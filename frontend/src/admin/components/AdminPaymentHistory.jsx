import { useEffect, useMemo, useState, useCallback } from 'react';
import { listAdminAdmissions, listStudentPayments, getStructuredFees } from '../../utils/firebase';
import modal from '../../utils/modal';
import '../styles/AdminPaymentHistory.css';

const currency = (n) => `KSh ${Number(n || 0).toLocaleString()}`;
const fmtDateTime = (isoOrTs) => {
  try {
    if (!isoOrTs) return '';
    // Handle Firestore serverTimestamp or ISO
    if (typeof isoOrTs === 'object' && isoOrTs.seconds) {
      return new Date(isoOrTs.seconds * 1000).toLocaleString();
    }
    const d = new Date(isoOrTs);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();
  } catch {
    return '';
  }
};

const AdminPaymentHistory = () => {
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [drivingFees, setDrivingFees] = useState({});
  const [computingFees, setComputingFees] = useState({});

  // Define loader before effects reference it
  const loadPayments = useCallback(async (id) => {
    if (!id) { setPayments([]); return; }
    try {
      setLoadingPayments(true);
      const list = await listStudentPayments(id);
      setPayments(list);
    } catch (e) {
      await modal.error({ title: 'Failed to load payments', text: e?.message || 'Please try again.' });
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const list = await listAdminAdmissions({ take: 500 });
        if (mounted) setStudents(list);
        // Load fee structures for totals computation
        const { driving, computing } = await getStructuredFees();
        if (mounted) {
          setDrivingFees(driving || {});
          setComputingFees(computing || {});
        }
      } catch (e) {
        await modal.error({ title: 'Failed to load students', text: e?.message || 'Please try again.' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.firstName, s.lastName, s.admissionNumber, s.course]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [students, query]);

  // Keep selection in sync with filtered results
  useEffect(() => {
    if (selectedId && !filtered.some((s) => s.id === selectedId)) {
      setSelectedId('');
      setPayments([]);
    }
    if (!selectedId && filtered.length === 1) {
      const only = filtered[0];
      setSelectedId(only.id);
      // Fire and forget; no need to await in effect
      loadPayments(only.id);
    }
  }, [filtered, selectedId, loadPayments]);

  const selectedStudent = students.find(s => s.id === selectedId);
  const totalAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const computeBaseFee = (student) => {
    if (!student) return 0;
    if (student.course === 'Driving') {
      const dtype = student.drivingType || 'New Student';
      const clsRaw = (dtype === 'Endorsement' ? student.endorsementClass : student.drivingClass) || 'B1/B2';
      const dclass = (clsRaw || '').toUpperCase();
      const classMap = (drivingFees || {})[dclass] || {};
      return Number(classMap[dtype] || 0);
    }
    if (student.course === 'Computing') {
      const level = student.computingLevel || 'Beginner';
      return Number((computingFees || {})[level] || 0);
    }
    return 0;
  };

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
          .meta-grid { display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: start; }
          .qr-box { display: flex; flex-direction: column; align-items: center; gap: 6px; }
          .qr-box img { width: 120px; height: 120px; }
          .qr-caption { font-size: 11px; color: #64748b; text-align: center; max-width: 160px; }
          .contact-footer { margin-top: 24px; padding-top: 16px; border-top: 2px solid #e2e8f0; color: #334155; font-size: 12px; }
          .contact-footer .line { margin: 2px 0; }
          .contact-footer a { color: #1d4ed8; text-decoration: none; }
          .signatures { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px; margin-top: 32px; }
          .sig-box { height: 72px; display: flex; flex-direction: column; justify-content: flex-end; }
          .sig-line { border-top: 1px solid #cbd5e1; height: 1px; }
          .sig-label { margin-top: 6px; color: #64748b; font-size: 12px; text-align: center; }
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
    try { w.focus(); } catch (e) { console.debug('Unable to focus print window:', e); }
  };

  const handlePrint = (p) => {
    const student = selectedStudent;
    if (!student) return;
    const baseFee = computeBaseFee(student);
    // Determine timestamp for ordering (createdAt seconds or paidAt ISO)
    const thisTs = p.createdAt?.seconds ? p.createdAt.seconds * 1000 : (p.paidAt ? new Date(p.paidAt).getTime() : 0);
    const paidBefore = payments
      .filter(x => {
        const ts = x.createdAt?.seconds ? x.createdAt.seconds * 1000 : (x.paidAt ? new Date(x.paidAt).getTime() : 0);
        return ts && ts < thisTs;
      })
      .reduce((sum, x) => sum + (Number(x.amount) || 0), 0);
    const balanceBefore = Math.max(0, baseFee - paidBefore);
    const amount = Number(p.amount) || 0;
    const balanceAfter = Math.max(0, baseFee - (paidBefore + amount));

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const suffix = String(p.id).slice(-4).toUpperCase();
    const friendlyCode = `RCPT-${y}${m}${d}-${suffix}`;
    const verificationUrl = `${window.location.origin}/verify-receipt/${p.id}`;

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
        name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        admissionNumber: student.admissionNumber || '-',
      },
      course: {
        name: student.course || '-',
        category: student.course === 'Driving' ? `${(student.drivingClass || student.endorsementClass || 'B1/B2').toUpperCase()} • ${student.drivingType || 'New Student'}` : (student.computingLevel || '-')
      },
      payment: {
        amount,
        amountFmt: `KSh ${Number(amount || 0).toLocaleString()}`,
        method: p.method,
        confirmationCode: p.confirmationCode,
        note: p.note,
        paidAt: p.paidAt || p.createdAt,
        receiptNo: p.id,
        receiptCode: friendlyCode,
        verificationUrl,
      },
      totals: {
        totalFeeFmt: `KSh ${Number(baseFee || 0).toLocaleString()}`,
        paidBeforeFmt: `KSh ${Number(paidBefore || 0).toLocaleString()}`,
        balanceBeforeFmt: `KSh ${Number(balanceBefore || 0).toLocaleString()}`,
        balanceAfterFmt: `KSh ${Number(balanceAfter || 0).toLocaleString()}`,
      }
    });
  };

  return (
    <div className="admin-payment-container">
      <div className="admin-payment-main-card">
        <div className="admin-payment-header">
          <div className="admin-payment-header-content">
            <h1 className="admin-payment-title">Payment History</h1>
            <p className="admin-payment-subtitle">
              View and track student payment records
            </p>
          </div>
        </div>

        <div className="admin-payment-content">
          {/* Stats Section */}
          {selectedStudent && (
            <div className="admin-payment-stats">
              <div className="admin-payment-stat-card">
                <div className="admin-payment-stat-label">Total Payments</div>
                <div className="admin-payment-stat-value">{payments.length}</div>
              </div>
              <div className="admin-payment-stat-card">
                <div className="admin-payment-stat-label">Total Amount</div>
                <div className="admin-payment-stat-value admin-payment-stat-currency">
                  {currency(totalAmount)}
                </div>
              </div>
              <div className="admin-payment-stat-card">
                <div className="admin-payment-stat-label">Student</div>
                <div className="admin-payment-stat-value" style={{ fontSize: '1rem' }}>
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </div>
              </div>
            </div>
          )}

          {/* Student Picker */}
          <div className="admin-payment-picker-card">
            <div className="admin-payment-picker-grid">
              <div className="admin-payment-form-group">
                <label className="admin-payment-label">Search Students</label>
                <input 
                  className="admin-payment-input" 
                  placeholder="Search by name, admission no, course" 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const first = filtered[0];
                      if (first) {
                        setSelectedId(first.id);
                        await loadPayments(first.id);
                      }
                    }
                  }}
                />
                {query && filtered.length === 0 && (
                  <div className="admin-payment-input-hint" style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                    No matches. Try a different name, admission number, or course.
                  </div>
                )}
              </div>
              <div className="admin-payment-form-group">
                <label className="admin-payment-label">Select Student</label>
                <select
                  className="admin-payment-select"
                  value={selectedId}
                  onChange={async (e) => { 
                    const id = e.target.value; 
                    setSelectedId(id); 
                    await loadPayments(id); 
                  }}
                >
                  <option value="">-- Choose Student --</option>
                  {filtered.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.admissionNumber ? `[${s.admissionNumber}] ` : ''}{s.firstName} {s.lastName} — {s.course}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className="admin-payment-history-card">
            <h2 className="admin-payment-history-title">Payment Records</h2>
            
            {!selectedId && (
              <div className="admin-payment-no-selection">
                <svg className="admin-payment-no-selection-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div className="admin-payment-no-selection-title">No Student Selected</div>
                <div className="admin-payment-no-selection-desc">
                  Select a student from the dropdown above to view their payment history
                </div>
              </div>
            )}
            
            {selectedId && (
              <>
                {loadingPayments && (
                  <div className="admin-payment-loading">
                    <div className="admin-payment-loading-spinner"></div>
                    Loading payment records...
                  </div>
                )}
                
                {!loadingPayments && (
                  <div className="admin-payment-table-container">
                    <table className="admin-payment-table">
                      <thead>
                        <tr>
                          <th>Date/Time</th>
                          <th>Amount</th>
                          <th>Confirmation Code</th>
                          <th>Note</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id}>
                            <td>{fmtDateTime(p.paidAt || p.createdAt)}</td>
                            <td>
                              <span className="admin-payment-amount">
                                {currency(p.amount)}
                              </span>
                            </td>
                            <td>
                              {p.confirmationCode ? (
                                <span className="admin-payment-confirmation">
                                  {p.confirmationCode}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td>{p.note || '-'}</td>
                            <td>
                              <button className="admin-payment-action" onClick={() => handlePrint(p)}>
                                Print Receipt
                              </button>
                            </td>
                          </tr>
                        ))}
                        {payments.length === 0 && (
                          <tr>
                            <td colSpan={4} className="admin-payment-empty">
                              <div className="admin-payment-empty-title">No Payments Found</div>
                              <div className="admin-payment-empty-description">
                                This student has no payment records yet
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
          
          {loading && (
            <div className="admin-payment-loading">
              <div className="admin-payment-loading-spinner"></div>
              <div className="admin-payment-loading-text">Loading students...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentHistory;
