import { useEffect, useMemo, useState } from 'react';
import modal from '../../utils/modal';
import {
  getStructuredFees,

  listAdminAdmissions,
  addStudentPayment,
  getStudentPaymentsTotal,
  setDrivingFee,
  setComputingFee,
} from '../../utils/firebase';

import '../styles/AdminFees.css';
import AdminPaymentHistory from './AdminPaymentHistory';

const currency = (n) => `KSh ${Number(n || 0).toLocaleString()}`;

// Lazy-load pdfmake (support both CJS and ESM build variants)
let pdfMakeInstanceRef = null;
const loadPdfMake = async () => {
  if (!pdfMakeInstanceRef) {
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
    const pm = pdfMakeModule.default || pdfMakeModule;
    pm.vfs = pdfFontsModule.default?.pdfMake?.vfs || pdfFontsModule.pdfMake?.vfs || {};
    pdfMakeInstanceRef = pm;
  }
  return pdfMakeInstanceRef;
};

// Receipt helpers
const buildReceiptHtml = ({ org = {}, student = {}, payment = {}, course = {}, totals = {} }) => {
  const paidAt = payment.paidAt ? new Date(payment.paidAt) : new Date();
  const dateStr = paidAt.toLocaleString();
  const receiptCode = payment.receiptCode || (payment.receiptNo || '').toString();
  const verificationUrl = payment.verificationUrl || '';
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Payment Receipt</title>
      <style>
        body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji','Segoe UI Emoji'; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
        .card { position: relative; overflow: hidden; max-width: 820px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 12px 24px -8px rgba(0,0,0,0.12); padding: 32px; }
        .watermark { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; opacity: 0.06; }
        .watermark img { max-width: 70%; max-height: 70%; filter: grayscale(100%); }
        .header { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 16px; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; }
        .brand { display: flex; align-items: center; gap: 16px; }
        .brand img { width: 80px; height: 80px; object-fit: contain; }
        .title { font-size: 24px; font-weight: 800; letter-spacing: 0.2px; }
        .tagline { color: #1d4ed8; font-weight: 600; margin-top: 4px; }
        .muted { color: #475569; font-size: 12px; }
        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .section { margin-top: 16px; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e5e7eb; }
        .row:last-child { border-bottom: none; }
        .label { color: #64748b; font-size: 12px; }
        .value { font-weight: 600; }
        .amount { color: #16a34a; font-weight: 700; }
        .amount-blue { color: #1d4ed8; font-weight: 800; }
        .student-name { color: #1d4ed8; font-weight: 800; }
        .footer { text-align: center; margin-top: 28px; font-size: 12px; color: #475569; }
        .badge { display: inline-block; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
        .right { text-align: right; }
        .contacts { margin-top: 6px; color: #475569; font-size: 12px; }
        .signatures { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px; margin-top: 32px; }
        .sig-box { height: 72px; display: flex; flex-direction: column; justify-content: flex-end; }
        .sig-line { border-top: 1px solid #cbd5e1; height: 1px; }
        .sig-label { margin-top: 6px; color: #64748b; font-size: 12px; text-align: center; }
        .meta-grid { display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: start; }
        .qr-box { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .qr-box img { width: 120px; height: 120px; }
        .qr-caption { font-size: 11px; color: #64748b; text-align: center; max-width: 160px; }
        .contact-footer { margin-top: 24px; padding-top: 16px; border-top: 2px solid #e2e8f0; color: #334155; font-size: 12px; }
        .contact-footer .line { margin: 2px 0; }
        .contact-footer a { color: #1d4ed8; text-decoration: none; }
        @media print { body { background: #fff; } .card { box-shadow: none; border: none; } }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="watermark"><img src="${org.logoUrl || '/logo.png'}" alt="Watermark" /></div>
        <div class="header">
          <div class="brand">
            <img src="${org.logoUrl || '/logo.png'}" alt="${org.name || 'Zane Driving School'}" />
            <div>
              <div class="title">${org.name || 'Zane Driving School'}</div>
              <div class="tagline">Drive with us, drive with confidence</div>
              <div class="muted">${org.address || ''}</div>
            </div>
          </div>
          <div class="right">
            <div class="badge">Payment Receipt</div>
          </div>
        </div>
        <div class="meta-grid section">
          <div class="grid">
            <div>
              <div class="label">Receipt Date</div>
              <div class="value">${dateStr}</div>
            </div>
            <div>
              <div class="label">Receipt No.</div>
              <div class="value">${receiptCode.toLowerCase()}</div>
            </div>
          </div>
          ${verificationUrl ? `
          <div class="qr-box">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verificationUrl)}" alt="QR" />
            <div class="qr-caption">Scan to verify this receipt</div>
          </div>` : ''}
        </div>
        <div class="grid section">
          <div>
            <div class="label">Student</div>
            <div class="student-name">${((student.name || '-') + '').toUpperCase()}</div>
          </div>
          <div>
            <div class="label">Admission No.</div>
            <div class="value">${student.admissionNumber || '-'}</div>
          </div>
        </div>
        <div class="grid section">
          <div>
            <div class="label">Course</div>
            <div class="value">${course.name || '-'}</div>
          </div>
          <div>
            <div class="label">Category</div>
            <div class="value">${course.category || '-'}</div>
          </div>
        </div>
        <div class="section">
          <div class="row"><div class="label">Amount Paid</div><div class="amount">${payment.amountFmt}</div></div>
          <div class="row"><div class="label">Payment Method</div><div class="value">${(payment.method || '-').toString().toUpperCase()}</div></div>
          <div class="row"><div class="label">Confirmation Code</div><div class="value">${payment.confirmationCode || '-'}</div></div>
          ${payment.note ? `<div class="row"><div class="label">Note</div><div class="value">${payment.note}</div></div>` : ''}
        </div>
        <div class="section">
          <div class="row"><div class="label">Course Fee</div><div class="value">${totals.totalFeeFmt}</div></div>
          <div class="row"><div class="label">Total Paid (before)</div><div class="value">${totals.paidBeforeFmt}</div></div>
          <div class="row"><div class="label">Balance (before)</div><div class="value">${totals.balanceBeforeFmt}</div></div>
          <div class="row"><div class="label">Balance (after this payment)</div><div class="amount-blue">${totals.balanceAfterFmt}</div></div>
        </div>
        <div class="contact-footer">
          <div class="line"><strong>Main Office:</strong> ${org.mainOffice || ''}</div>
          <div class="line"><strong>Branch Office:</strong> ${org.branchOffice || ''}</div>
          <div class="line"><strong>Phone:</strong> ${org.phone || ''} &nbsp; <strong>Email:</strong> ${org.email || ''}</div>
          <div class="line"><strong>Website:</strong> <a href="${org.website || '#'}" target="_blank" rel="noopener">${org.website || ''}</a></div>
        </div>
        <div class="signatures">
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-label">Cashier Signature</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-label">Student Signature</div>
          </div>
        </div>
        <div class="footer">Thank you for your payment.</div>
      </div>
      <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 100); };</script>
    </body>
  </html>`;
};

const printReceipt = (data) => {
  const html = buildReceiptHtml(data);
  const w = window.open('', 'PrintReceipt');
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  try { w.focus(); } catch (e) {
    // Safe to ignore if focus is blocked by the browser
    // eslint-disable-next-line no-console
    console.debug('Unable to focus print window:', e);
  }
};

const AdminFees = () => {
  const [loading, setLoading] = useState(true);
  const [drivingFees, setDrivingFees] = useState({}); 
  const [computingFees, setComputingFees] = useState({}); 
  const [students, setStudents] = useState([]); 
  const [query, setQuery] = useState('');
  const [refreshToggle, setRefreshToggle] = useState(0);
  // Simple navbar/tabs
  const [activeTab, setActiveTab] = useState('record'); // 'fees' | 'record' | 'students'

  // Edit mode for fees tab
  const [editMode, setEditMode] = useState(false);
  const [savingFees, setSavingFees] = useState(false);
  const [draftDrivingFees, setDraftDrivingFees] = useState({});
  const [draftComputingFees, setDraftComputingFees] = useState({});

  // Payment form
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [payment, setPayment] = useState({ amount: '', method: 'cash', confirmationCode: '', note: '' });
  const [submittingPayment] = useState(false);
  // Typeahead for student selection
  const [studentQuery, setStudentQuery] = useState('');
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Payment fee context (does not persist to student)
  const [payDrivingType, setPayDrivingType] = useState('');
  const [payDrivingClass, setPayDrivingClass] = useState('');
  const [payComputingLevel, setPayComputingLevel] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Load structured fees
        const { driving, computing } = await getStructuredFees();
        if (mounted) {
          setDrivingFees(driving || {});
          setComputingFees(computing || {});
        }

        // Load students
        const list = await listAdminAdmissions({ take: 200 });
        // Compute payments totals for each student
        const withTotals = await Promise.all(
          list.map(async (s) => {
            const paymentsTotal = await getStudentPaymentsTotal(s.id);
            // Base fee logic
            let baseFee = 0;
            if (s.course === 'Driving') {
              const dtype = s.drivingType || 'New Student';
              const clsRaw = (dtype === 'Endorsement' ? s.endorsementClass : s.drivingClass) || 'B1/B2';
              const dclass = (clsRaw || '').toUpperCase();
              const classMap = (driving || {})[dclass] || {};
              baseFee = Number(classMap[dtype] || 0);
            } else if (s.course === 'Computing') {
              const level = s.computingLevel || 'Beginner';
              baseFee = Number((computing || {})[level] || 0);
            }
            const balance = Math.max(0, Number(baseFee) - Number(paymentsTotal || 0));
            return { ...s, paymentsTotal, baseFee, balance };
          })
        );
        if (mounted) setStudents(withTotals);
      } catch (e) {
        await modal.error({ title: 'Load failed', text: e?.message || 'Could not load fees data.' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToggle]);

  // Initialize fee context when selection changes
  useEffect(() => {
    const s = students.find(st => st.id === selectedStudentId);
    if (!s) { setPayDrivingType(''); setPayDrivingClass(''); setPayComputingLevel(''); return; }
    if (s.course === 'Driving') {
      setPayDrivingType(s.drivingType || 'New Student');
      const cls = (s.drivingType === 'Endorsement' ? s.endorsementClass : s.drivingClass) || 'B1/B2';
      setPayDrivingClass((cls || '').toUpperCase());
      setPayComputingLevel('');
    } else if (s.course === 'Computing') {
      setPayComputingLevel(s.computingLevel || 'Beginner');
      setPayDrivingType('');
      setPayDrivingClass('');
    } else {
      setPayDrivingType('');
      setPayDrivingClass('');
      setPayComputingLevel('');
    }
  }, [selectedStudentId, students]);

  // Recompute suggestions when the query or students change
  useEffect(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) { setStudentSuggestions([]); return; }
    const results = students.filter((s) => {
      const name = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
      const adm = (s.admissionNumber || '').toString().toLowerCase();
      return name.includes(q) || adm.includes(q);
    }).slice(0, 10);
    setStudentSuggestions(results);
  }, [studentQuery, students]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.firstName, s.lastName, s.course, s.admissionNumber, s.confirmationCode]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [students, query]);

  const submitPayment = async () => {
    if (!selectedStudentId) {
      await modal.error({ title: 'Select a student', text: 'Please choose a student to record the payment for.' });
      return;
    }
    const amt = Number(payment.amount);
    if (!amt || amt <= 0) {
      await modal.error({ title: 'Invalid amount', text: 'Enter a positive amount.' });
      return;
    }
    const student = students.find(s => s.id === selectedStudentId);
    const confirm = await modal.confirm({
      title: 'Confirm payment',
      text: `Record payment of ${currency(amt)} for ${student ? (student.firstName + ' ' + student.lastName) : 'selected student'}?`,
    });
    if (!confirm) return;
    try {
      // Build receipt data before state resets
      const paidAtIso = new Date().toISOString();
      const baseFee = displayBaseFee;
      const paidBefore = Number(selectedStudent.paymentsTotal || 0);
      const balanceBefore = Math.max(0, baseFee - paidBefore);
      const balanceAfter = Math.max(0, baseFee - (paidBefore + amt));

      const paymentId = await addStudentPayment(selectedStudentId, {
        amount: amt,
        method: payment.method,
        confirmationCode: payment.confirmationCode,
        note: payment.note,
        paidAt: paidAtIso,
      });

      await modal.success({ title: 'Payment recorded', text: 'The payment has been added.' });

      // Offer receipt download/print
      const wantReceipt = await modal.confirm({ title: 'Download receipt?', text: 'Would you like to download/print a receipt for this payment now?' });
      if (wantReceipt) {
        // Build human-friendly receipt code: RCPT-YYYYMMDD-XXXX (then we render lowercase for style)
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const suffix = String(paymentId).slice(-4).toUpperCase();
        const friendlyCode = `RCPT-${y}${m}${d}-${suffix}`;
        const verificationUrl = `${window.location.origin}/verify-receipt/${selectedStudentId}/${paymentId}`;
        printReceipt({
          org: {
            name: 'Zane Driving School',
            logoUrl: '/logo.png',
            phone: '0115820508',
            email: 'zanedrivingschool2022@gmail.com',
            address: 'Nairobi, Kenya',
            mainOffice: 'Mercy Njeri - Kabarak Road, Nakuru',
            branchOffice: 'Kericho',
            website: 'https://zanedrivingschool.co.ke'
          },
          student: {
            name: `${selectedStudent.firstName || ''} ${selectedStudent.lastName || ''}`.trim(),
            admissionNumber: selectedStudent.admissionNumber || '-',
          },
          course: {
            name: selectedStudent.course || '-',
            category: selectedStudent.course === 'Driving' ? `${payDrivingClass} • ${payDrivingType}` : (payComputingLevel || '-')
          },
          payment: {
            amount: amt,
            amountFmt: currency(amt),
            method: payment.method,
            confirmationCode: payment.confirmationCode,
            note: payment.note,
            paidAt: paidAtIso,
            receiptNo: paymentId,
            receiptCode: friendlyCode,
            verificationUrl,
          },
          totals: {
            totalFeeFmt: currency(baseFee),
            paidBeforeFmt: currency(paidBefore),
            balanceBeforeFmt: currency(balanceBefore),
            balanceAfterFmt: currency(balanceAfter),
          }
        });
      }

      setPayment({ amount: '', method: 'cash', confirmationCode: '', note: '' });
      setRefreshToggle((x) => x + 1);
    } catch (e) {
      await modal.error({ title: 'Failed to add payment', text: e?.message || 'Please try again.' });
    }
  };

  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  const displayBaseFee = useMemo(() => {
    if (!selectedStudent) return 0;
    if (selectedStudent.course === 'Driving') {
      const dtype = payDrivingType || 'New Student';
      const dclass = (payDrivingClass || 'B1/B2').toUpperCase();
      const classMap = (drivingFees || {})[dclass] || {};
      return Number(classMap[dtype] || 0);
    }
    if (selectedStudent.course === 'Computing') {
      const level = payComputingLevel || 'Beginner';
      return Number((computingFees || {})[level] || 0);
    }
    return 0;
  }, [selectedStudent, payDrivingType, payDrivingClass, payComputingLevel, drivingFees, computingFees]);

  // Initialize drafts when entering edit mode or when fees load
  useEffect(() => {
    if (!editMode) return;
    setDraftDrivingFees(JSON.parse(JSON.stringify(drivingFees || {})));
    setDraftComputingFees(JSON.parse(JSON.stringify(computingFees || {})));
  }, [editMode, drivingFees, computingFees]);

  const startEdit = () => {
    setDraftDrivingFees(JSON.parse(JSON.stringify(drivingFees || {})));
    setDraftComputingFees(JSON.parse(JSON.stringify(computingFees || {})));
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
  };

  const saveEditedFees = async () => {
    try {
      setSavingFees(true);
      const updates = [];
      // Driving fees: compare draft vs current and update changed values
      const dClasses = new Set([
        ...Object.keys(drivingFees || {}),
        ...Object.keys(draftDrivingFees || {})
      ]);
      dClasses.forEach((cls) => {
        const currentTypes = drivingFees?.[cls] || {};
        const draftTypes = draftDrivingFees?.[cls] || {};
        const allTypes = new Set([
          ...Object.keys(currentTypes),
          ...Object.keys(draftTypes)
        ]);
        allTypes.forEach((t) => {
          const curVal = Number(currentTypes?.[t] || 0);
          const newVal = Number(draftTypes?.[t] || 0);
          if (curVal !== newVal) {
            updates.push(setDrivingFee(cls, t, newVal));
          }
        });
      });

      // Computing fees
      const cLevels = new Set([
        ...Object.keys(computingFees || {}),
        ...Object.keys(draftComputingFees || {})
      ]);
      cLevels.forEach((lvl) => {
        const curVal = Number(computingFees?.[lvl] || 0);
        const newVal = Number(draftComputingFees?.[lvl] || 0);
        if (curVal !== newVal) {
          updates.push(setComputingFee(lvl, newVal));
        }
      });

      if (updates.length === 0) {
        await modal.success({ title: 'No changes', text: 'There were no fee changes to save.' });
        setEditMode(false);
        return;
      }

      await Promise.all(updates);
      await modal.success({ title: 'Fees updated', text: 'Course fees have been saved successfully.' });
      setEditMode(false);
      setRefreshToggle((x) => x + 1);
    } catch (e) {
      await modal.error({ title: 'Save failed', text: e?.message || 'Could not save fee changes.' });
    } finally {
      setSavingFees(false);
    }
  };

  return (
    <div className="admin-fees-container">
      <div className="admin-fees-card">
        <div className="admin-fees-card-header">
          <div className="admin-fees-header-content">
            <h1 className="admin-fees-page-title">Fees Management</h1>
            <p className="admin-fees-page-subtitle">Manage course fees, record payments, and track student balances</p>
          </div>
          <div className="admin-fees-header-actions">
            <button
              className="admin-fees-btn"
              onClick={async () => {
                try {
                  const confirmed = await modal.confirm({
                    title: 'Generate Fees Structure PDF?',
                    text: 'Create a Fees Structure PDF from the current Course Fees shown in this page?'
                  });
                  if (!confirmed) return;
                  const pdfMake = await loadPdfMake();

                  // Build fees rows from currently loaded structures
                  const drivingRows = Object.entries(drivingFees || {}).flatMap(([dclass, types]) => {
                    const order = ['New Student','Endorsement','Refresher'];
                    return order
                      .filter((t) => types && types[t] != null)
                      .map((t) => ({ type: t, class: dclass, duration: '-', fees: Number(types[t] || 0), description: '-' }));
                  });
                  const computingRows = Object.entries(computingFees || {}).map(([level, fee]) => ({
                    type: 'Computer',
                    class: level,
                    duration: '-',
                    fees: Number(fee || 0),
                    description: '-'
                  }));
                  const feesRows = [...drivingRows, ...computingRows];

                  const now = new Date();
                  const currentMonth = now.toLocaleString('default', { month: 'long' });
                  const currentYear = now.getFullYear();

                  // Load logo as base64
                  let logoDataUrl = null;
                  try {
                    const resp = await fetch('/logo.png');
                    const blob = await resp.blob();
                    logoDataUrl = await new Promise((resolve) => {
                      const r = new FileReader();
                      r.onloadend = () => resolve(r.result);
                      r.readAsDataURL(blob);
                    });
                  } catch (e) {
                    // ignore logo errors
                  }

                  const tableBody = [
                    [
                      { text: 'COURSE TYPE', style: 'tableHeader' },
                      { text: 'CLASS', style: 'tableHeader' },
                      { text: 'DURATION', style: 'tableHeader' },
                      { text: 'FEES (KES)', style: 'tableHeader' },
                      { text: 'DESCRIPTION', style: 'tableHeader' }
                    ],
                    ...feesRows.map((row) => [
                      { text: String(row.type || '-'), style: 'tableCell' },
                      { text: String(row.class || '-'), style: 'tableCell' },
                      { text: String(row.duration || '-'), style: 'tableCell' },
                      { text: Number(row.fees || 0).toLocaleString(), style: 'tableCell', bold: true },
                      { text: String(row.description || '-'), style: 'tableCell' },
                    ])
                  ];

                  const docDefinition = {
                    pageSize: 'A4',
                    pageMargins: [40, 60, 40, 60],
                    background: logoDataUrl ? function(currentPage, pageSize) {
                      const imgWidth = 360;
                      const imgHeight = 360;
                      const x = (pageSize.width - imgWidth) / 2;
                      const y = (pageSize.height - imgHeight) / 2;
                      return [{ image: logoDataUrl, width: imgWidth, opacity: 0.06, absolutePosition: { x, y } }];
                    } : undefined,
                    footer: function(currentPage, pageCount) {
                      return {
                        margin: [40, 0, 40, 20],
                        columns: [
                          { text: 'Zane Driving School • Train with us, Drive with confidence', alignment: 'left', color: '#7f8c8d' },
                          { text: `Page ${currentPage} of ${pageCount}`, alignment: 'right', color: '#7f8c8d' }
                        ],
                        fontSize: 9
                      };
                    },
                    content: [
                      logoDataUrl ? { image: logoDataUrl, width: 120, alignment: 'center', margin: [0, 0, 0, 20] } : {},
                      { text: 'ZANE DRIVING SCHOOL', style: 'header', margin: [0, 0, 0, 5] },
                      { text: 'Train with us, Drive with confidence', style: 'subtitle', alignment: 'center', margin: [0, 0, 0, 20] },
                      { text: 'FEES STRUCTURE', style: 'title', margin: [0, 0, 0, 10] },
                      { text: `As of ${currentMonth} ${currentYear}`, style: 'date', margin: [0, 0, 0, 20] },
                      {
                        layout: {
                          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1.5 : 1,
                          vLineWidth: () => 0,
                          hLineColor: (i) => i === 0 ? '#2c3e50' : '#e0e0e0',
                          paddingTop: () => 8,
                          paddingBottom: () => 8,
                          fillColor: (i) => i % 2 === 0 ? '#f8f9fa' : null
                        },
                        table: {
                          headerRows: 1,
                          widths: ['25%', '15%', '15%', '20%', '25%'],
                          body: tableBody,
                        },
                      },
                      { text: ' ', margin: [0, 10] },
                      { text: 'Contact Information:', style: 'sectionHeader' },
                      { text: 'Phone: 0115820508' },
                      { text: 'Email: zanedrivingschool2022@gmail.com' },
                      { text: 'Main Office: Mercy Njeri along Kabarak Road, Nakuru, Kenya', margin: [0, 0, 0, 20] },
                      { text: 'Branch Office: Kericho', margin: [0, 0, 0, 20] },
                      { text: 'Website: zanedrivingschool.co.ke', margin: [0, 0, 0, 20] },
                      { text: 'Thank you for choosing Zane Driving School', style: 'footer' },
                    ],
                    styles: {
                      header: { fontSize: 20, bold: true, alignment: 'center', color: '#2c3e50', margin: [0, 5, 0, 5] },
                      title: { fontSize: 18, bold: true, alignment: 'center', color: '#2c3e50', margin: [0, 20, 0, 5] },
                      subtitle: { fontSize: 12, color: '#7f8c8d', italics: true },
                      date: { fontSize: 11, alignment: 'center', color: '#7f8c8d' },
                      sectionHeader: { fontSize: 12, bold: true, margin: [0, 15, 0, 8], color: '#2c3e50' },
                      footer: { fontSize: 10, italics: true, alignment: 'center', margin: [0, 20, 0, 0] },
                      tableHeader: { bold: true, fontSize: 10, color: 'white', fillColor: '#2c3e50', alignment: 'center', margin: [0, 5, 0, 5], padding: [5, 0, 5, 0] },
                      tableCell: { fontSize: 10, margin: [0, 5, 0, 5], padding: [5, 5, 5, 5] },
                    },
                    defaultStyle: { fontSize: 10, lineHeight: 1.3 },
                  };

                  pdfMake.createPdf(docDefinition).download(`Zane-Driving-Fees-${currentMonth}-${currentYear}.pdf`);
                  await modal.toast({ icon: 'success', title: 'Download started' });
                } catch (e) {
                  // eslint-disable-next-line no-console
                  console.error('Failed to generate Fees Structure PDF', e);
                  await modal.error({ title: 'PDF generation failed', text: 'Please try again.' });
                }
              }}
            >
              Generate Fees Structure
            </button>
            {activeTab === 'fees' && (
              <div style={{ display: 'flex', gap: 8 }}>
                {!editMode ? (
                  <button className="admin-fees-btn" onClick={startEdit}>Edit Fees</button>
                ) : (
                  <>
                    <button
                      className="admin-fees-btn"
                      onClick={saveEditedFees}
                      disabled={savingFees}
                    >
                      {savingFees ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      className="admin-fees-btn admin-fees-btn-secondary"
                      onClick={cancelEdit}
                      disabled={savingFees}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            )}
            <div className="admin-fees-search">
              <svg className="admin-fees-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search students..."
                className="admin-fees-search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="admin-fees-stats">
          <div className="admin-fees-stat">
            <span className="admin-fees-stat-label">Total Students</span>
            <span className="admin-fees-stat-value">{filtered.length}</span>
          </div>
          <div className="admin-fees-stat">
            <span className="admin-fees-stat-label">Outstanding Balance</span>
            <span className="admin-fees-stat-value">KSh {filtered.reduce((acc, student) => acc + student.balance, 0).toLocaleString()}</span>
          </div>
          <div className="admin-fees-stat">
            <span className="admin-fees-stat-label">Total Collected</span>
            <span className="admin-fees-stat-value">KSh {filtered.reduce((acc, student) => acc + student.paymentsTotal, 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="admin-fees-nav">
          <button
            className={`admin-fees-tab ${activeTab === 'fees' ? 'admin-fees-tab-active' : ''}`}
            onClick={() => setActiveTab('fees')}
          >
            Course Fees
          </button>
          <button
            className={`admin-fees-tab ${activeTab === 'record' ? 'admin-fees-tab-active' : ''}`}
            onClick={() => setActiveTab('record')}
          >
            Record Payment
          </button>
          <button
            className={`admin-fees-tab ${activeTab === 'students' ? 'admin-fees-tab-active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            Student Balances
          </button>
          <button
            className={`admin-fees-tab ${activeTab === 'history' ? 'admin-fees-tab-active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Payment History
          </button>
        </div>

        <div className="admin-fees-card-content">
          {activeTab === 'fees' && (
            <div>
              <h2 className="admin-fees-section-title">Course Fee Structure</h2>
              <div className="admin-fees-grid admin-fees-grid-2">
                {/* Driving Course Fees */}
                <div className="admin-fees-fee-card">
                  <div className="admin-fees-fee-card-header">Driving Course Fees</div>
                  <div className="admin-fees-grid">
                    {Object.keys(drivingFees).length === 0 ? (
                      <div style={{ fontSize: 13, color: '#6b7280' }}>No driving fees set yet. Click &quot;Edit Fees&quot; to configure.</div>
                    ) : (
                      Object.entries(editMode ? draftDrivingFees : drivingFees).map(([cls, types]) => (
                        <div key={cls} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>{cls}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                            {['New Student','Endorsement','Refresher'].map((type) => (
                              <div key={type}>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>{type}</div>
                                {!editMode ? (
                                  <div style={{ fontWeight: 600 }}>{currency(types?.[type] || 0)}</div>
                                ) : (
                                  <input
                                    type="number"
                                    className="admin-fees-input"
                                    style={{ maxWidth: 160 }}
                                    value={Number(types?.[type] || 0)}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setDraftDrivingFees((prev) => {
                                        const next = { ...(prev || {}) };
                                        const map = { ...(next[cls] || {}) };
                                        map[type] = Number(val);
                                        next[cls] = map;
                                        return next;
                                      });
                                    }}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Computing Course Fees */}
                <div className="admin-fees-fee-card">
                  <div className="admin-fees-fee-card-header">Computing Course Fees</div>
                  <div className="admin-fees-grid">
                    {(() => {
                      const defaultLevels = ['Beginner','Intermediate'];
                      const levelsSet = new Set([
                        ...defaultLevels,
                        ...Object.keys(editMode ? draftComputingFees : computingFees || {})
                      ]);
                      const levels = Array.from(levelsSet);
                      return levels.map((level) => (
                        <div key={level}>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{level}</div>
                          {!editMode ? (
                            <div style={{ fontWeight: 600 }}>{currency((computingFees || {})[level] || 0)}</div>
                          ) : (
                            <input
                              type="number"
                              className="admin-fees-input"
                              style={{ maxWidth: 160 }}
                              value={Number((draftComputingFees || {})[level] || 0)}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraftComputingFees((prev) => ({
                                  ...(prev || {}),
                                  [level]: Number(val)
                                }));
                              }}
                            />
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'record' && (
            <div>
              <h2 className="admin-fees-section-title">Record Payment</h2>
              
              {/* Student Selection */}
              <div className="admin-fees-student-selector">
                <label className="admin-fees-label">Select Student</label>
                <input
                  type="text"
                  className="admin-fees-input"
                  placeholder="Type student name or ID..."
                  value={studentQuery}
                  onChange={(e) => {
                    setStudentQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
                
                {showSuggestions && studentQuery && (
                  <div className="admin-fees-suggestions" style={{ zIndex: 1, position: 'absolute' }}>
                    {studentSuggestions.map((s) => (
                      <div
                        key={s.id}
                        className="admin-fees-suggestion-item"
                        onClick={() => {
                          setSelectedStudentId(s.id);
                          setStudentQuery(`${s.firstName || ''} ${s.lastName || ''} ${s.admissionNumber ? `(${s.admissionNumber})` : ''}`.trim());
                          setShowSuggestions(false);
                        }}
                      >
                        <div className="admin-fees-suggestion-name">{s.firstName} {s.lastName}</div>
                        <div className="admin-fees-suggestion-details">
                          ID: {s.admissionNumber || '-'} • {s.course}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Student Details */}
              {selectedStudent && (
                <div className="admin-fees-selected-student">
                  <h3 className="admin-fees-selected-student-name">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                  <div className="admin-fees-selected-student-details">
                    <div className="admin-fees-selected-student-detail">
                      <span className="admin-fees-selected-student-detail-label">Student ID</span>
                      <span className="admin-fees-selected-student-detail-value">{selectedStudent.admissionNumber || '-'}</span>
                    </div>
                    <div className="admin-fees-selected-student-detail">
                      <span className="admin-fees-selected-student-detail-label">Course</span>
                      <span className="admin-fees-selected-student-detail-value">{selectedStudent.course || '-'}</span>
                    </div>
                    <div className="admin-fees-selected-student-detail">
                      <span className="admin-fees-selected-student-detail-label">Total Fees</span>
                      <span className="admin-fees-selected-student-detail-value">KSh {selectedStudent.baseFee?.toLocaleString()}</span>
                    </div>
                    <div className="admin-fees-selected-student-detail">
                      <span className="admin-fees-selected-student-detail-label">Paid Amount</span>
                      <span className="admin-fees-selected-student-detail-value">KSh {selectedStudent.paymentsTotal?.toLocaleString()}</span>
                    </div>
                    <div className="admin-fees-selected-student-detail">
                      <span className="admin-fees-selected-student-detail-label">Balance</span>
                      <span className="admin-fees-selected-student-detail-value">KSh {(selectedStudent.baseFee - selectedStudent.paymentsTotal)?.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="admin-fees-selected-student-note">
                    Last payment: {selectedStudent.lastPayment ? new Date(selectedStudent.lastPayment).toLocaleDateString() : 'No payments yet'}
                  </p>
                </div>
              )}

              {/* Payment Form */}
              {selectedStudent && (
                <div className="admin-fees-grid admin-fees-grid-2" style={{ marginTop: '2rem' }}>
                  <div className="admin-fees-fee-card">
                    <div className="admin-fees-fee-card-header">Payment Details</div>
                    <div className="admin-fees-grid">
                      <div>
                        <label className="admin-fees-label">Payment Amount</label>
                        <input
                          type="number"
                          className="admin-fees-input"
                          value={payment.amount}
                          onChange={(e) => setPayment((p) => ({ ...p, amount: e.target.value }))}
                          placeholder="Enter amount"
                          max={displayBaseFee - selectedStudent.paymentsTotal}
                        />
                      </div>
                      <div>
                        <label className="admin-fees-label">Payment Method</label>
                        <select
                          className="admin-fees-select"
                          value={payment.method}
                          onChange={(e) => setPayment((p) => ({ ...p, method: e.target.value }))}
                        >
                          <option value="cash">Cash</option>
                          <option value="mpesa">MPESA</option>
                          <option value="card">Card</option>
                          <option value="bank_transfer">Bank Transfer</option>
                        </select>
                      </div>
                      <div>
                        <label className="admin-fees-label">Transaction Reference</label>
                        <input
                          type="text"
                          className="admin-fees-input"
                          value={payment.confirmationCode}
                          onChange={(e) => setPayment((p) => ({ ...p, confirmationCode: e.target.value }))}
                          placeholder="Optional reference number"
                        />
                      </div>
                      <div>
                        <label className="admin-fees-label">Notes</label>
                        <input
                          type="text"
                          className="admin-fees-input"
                          value={payment.note}
                          onChange={(e) => setPayment((p) => ({ ...p, note: e.target.value }))}
                          placeholder="Optional notes"
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: '1.5rem' }}>
                      <button
                        className="admin-fees-btn"
                        onClick={submitPayment}
                        disabled={!payment.amount || submittingPayment}
                      >
                        {submittingPayment ? 'Saving...' : 'Add Payment'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'students' && (
            <div>
              <h2 className="admin-fees-section-title">Student Fee Balances</h2>
              
              {loading ? (
                <div className="admin-fees-loading">
                  <div className="admin-fees-loading-spinner"></div>
                  <p className="admin-fees-loading-text">Loading student data...</p>
                </div>
              ) : (
                <div className="admin-fees-table-wrap">
                  <table className="admin-fees-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Admission No.</th>
                        <th>Course</th>
                        <th>Course Fee</th>
                        <th>Total Payments</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((s) => (
                        <tr key={s.id}>
                          <td>{s.firstName} {s.lastName}</td>
                          <td>{s.admissionNumber || '-'}</td>
                          <td>{s.course || '-'}</td>
                          <td>{currency(s.baseFee || 0)}</td>
                          <td>{currency(s.paymentsTotal || 0)}</td>
                          <td><strong>{currency(s.balance || 0)}</strong></td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: 16, color: '#6b7280' }}>No students found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <AdminPaymentHistory />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFees;
