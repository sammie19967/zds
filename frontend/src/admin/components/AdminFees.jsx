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

// Receipt helpers
const buildReceiptHtml = ({ org = {}, student = {}, payment = {}, course = {}, totals = {} }) => {
  const paidAt = payment.paidAt ? new Date(payment.paidAt) : new Date();
  const dateStr = paidAt.toLocaleString();
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Payment Receipt</title>
      <style>
        body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji','Segoe UI Emoji'; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
        .card { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.07); padding: 24px; }
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .brand { display: flex; align-items: center; gap: 12px; }
        .brand img { width: 40px; height: 40px; }
        .title { font-size: 20px; font-weight: 700; }
        .muted { color: #475569; font-size: 12px; }
        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .section { margin-top: 16px; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e5e7eb; }
        .row:last-child { border-bottom: none; }
        .label { color: #64748b; font-size: 12px; }
        .value { font-weight: 600; }
        .amount { color: #16a34a; font-weight: 700; }
        .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #64748b; }
        .badge { display: inline-block; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 999px; font-size: 11px; }
        @media print { body { background: #fff; } .card { box-shadow: none; border: none; } }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="brand">
            <img src="${org.logoUrl || '/logo.png'}" alt="${org.name || 'Zane Driving'}" />
            <div>
              <div class="title">${org.name || 'Zane Driving'}</div>
              <div class="muted">${org.address || ''}</div>
            </div>
          </div>
          <div class="badge">Payment Receipt</div>
        </div>
        <div class="grid section">
          <div>
            <div class="label">Receipt Date</div>
            <div class="value">${dateStr}</div>
          </div>
          <div>
            <div class="label">Receipt No.</div>
            <div class="value">${payment.reference || payment.confirmationCode || ('RCPT-' + paidAt.getTime())}</div>
          </div>
        </div>
        <div class="grid section">
          <div>
            <div class="label">Student</div>
            <div class="value">${student.name || '-'}</div>
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
          <div class="row"><div class="label">Payment Method</div><div class="value">${payment.method || '-'}</div></div>
          <div class="row"><div class="label">Confirmation Code</div><div class="value">${payment.confirmationCode || '-'}</div></div>
          ${payment.note ? `<div class="row"><div class="label">Note</div><div class="value">${payment.note}</div></div>` : ''}
        </div>
        <div class="section">
          <div class="row"><div class="label">Course Fee</div><div class="value">${totals.totalFeeFmt}</div></div>
          <div class="row"><div class="label">Total Paid (before)</div><div class="value">${totals.paidBeforeFmt}</div></div>
          <div class="row"><div class="label">Balance (before)</div><div class="value">${totals.balanceBeforeFmt}</div></div>
          <div class="row"><div class="label">Balance (after this payment)</div><div class="value">${totals.balanceAfterFmt}</div></div>
        </div>
        <div class="footer">
          Thank you for your payment.
        </div>
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

      await addStudentPayment(selectedStudentId, {
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
        printReceipt({
          org: { name: 'Zane Driving', logoUrl: '/logo.png' },
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
