import { useEffect, useMemo, useState } from 'react';
import modal from '../../utils/modal';
import {
  getStructuredFees,
  setDrivingFee,
  setComputingFee,
  listAdminAdmissions,
  addStudentPayment,
  getStudentPaymentsTotal,
} from '../../utils/firebase';

import '../styles/AdminFees.css';

const ALL_DRIVING_CLASSES = ['A1/A2','B1/B2','C1/C2','D1/D2'];
const currency = (n) => `KSh ${Number(n || 0).toLocaleString()}`;

const AdminFees = () => {
  const [loading, setLoading] = useState(true);
  const [savingFees, setSavingFees] = useState(false);
  const [drivingFees, setDrivingFees] = useState({}); 
  const [computingFees, setComputingFees] = useState({}); 
  const [students, setStudents] = useState([]); 
  const [query, setQuery] = useState('');
  const [refreshToggle, setRefreshToggle] = useState(0);
  // Simple navbar/tabs
  const [activeTab, setActiveTab] = useState('record'); // 'fees' | 'record' | 'students'

  // Drafts to avoid auto-save on blur
  const [drivingDraft, setDrivingDraft] = useState({}); // { cls: { type: value } }
  const [computingDraft, setComputingDraft] = useState({}); // { level: value }

  // Edit toggles
  const [editingDriving, setEditingDriving] = useState(false);
  const [editingComputing, setEditingComputing] = useState(false);
  // Add-class control
  const [newDrivingClass, setNewDrivingClass] = useState('');

  // Payment form
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [payment, setPayment] = useState({ amount: '', method: 'cash', confirmationCode: '', note: '' });
  const [submittingPayment, setSubmittingPayment] = useState(false);
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
          // Initialize drafts
          const dd = {};
          Object.entries(driving || {}).forEach(([cls, types]) => {
            dd[cls] = { ...(types || {}) };
          });
          setDrivingDraft(dd);
          setComputingDraft({ ...(computing || {}) });
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

  const saveDriving = async (cls, type) => {
    const val = Number(drivingDraft?.[cls]?.[type] ?? 0);
    try {
      setSavingFees(true);
      await setDrivingFee(cls, type, val);
      await modal.success({ title: 'Saved', text: `Driving fee updated for ${cls} • ${type}.` });
      setRefreshToggle((x) => x + 1);
    } catch (e) {
      await modal.error({ title: 'Failed to save fee', text: e?.message || 'Please try again.' });
    } finally {
      setSavingFees(false);
    }
  };

  const saveComputing = async (level) => {
    const val = Number(computingDraft?.[level] ?? 0);
    try {
      setSavingFees(true);
      await setComputingFee(level, val);
      await modal.success({ title: 'Saved', text: `Computing fee updated for ${level}.` });
      setRefreshToggle((x) => x + 1);
    } catch (e) {
      await modal.error({ title: 'Failed to save fee', text: e?.message || 'Please try again.' });
    } finally {
      setSavingFees(false);
    }
  };

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
      setSubmittingPayment(true);
      await addStudentPayment(selectedStudentId, {
        amount: amt,
        method: payment.method,
        confirmationCode: payment.confirmationCode,
        note: payment.note,
      });
      await modal.success({ title: 'Payment recorded', text: 'The payment has been added.' });
      setPayment({ amount: '', method: 'cash', confirmationCode: '', note: '' });
      setRefreshToggle((x) => x + 1);
    } catch (e) {
      await modal.error({ title: 'Failed to add payment', text: e?.message || 'Please try again.' });
    } finally {
      setSubmittingPayment(false);
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

  const displayBalance = useMemo(() => {
    if (!selectedStudent) return 0;
    return Math.max(0, Number(displayBaseFee) - Number(selectedStudent.paymentsTotal || 0));
  }, [selectedStudent, displayBaseFee]);

  return (
    <div className="admin-fees-container">
      <div className="admin-fees-card">
        <div className="admin-fees-card-header">
          <div className="admin-fees-header-content">
            <h1 className="admin-fees-page-title">Fees Management</h1>
            <p className="admin-fees-page-subtitle">Manage course fees, record payments, and track student balances</p>
          </div>
          <div className="admin-fees-header-actions">
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
                      <div style={{ fontSize: 13, color: '#6b7280' }}>No driving fees set yet. Click &quot;Edit Driving&quot; to configure.</div>
                    ) : (
                      Object.entries(drivingFees).map(([cls, types]) => (
                        <div key={cls} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>{cls}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                            {['New Student','Endorsement','Refresher'].map((type) => (
                              <div key={type}>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>{type}</div>
                                <div style={{ fontWeight: 600 }}>{currency(types?.[type] || 0)}</div>
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
                    {['Beginner','Intermediate'].map((level) => (
                      <div key={level}>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{level}</div>
                        <div style={{ fontWeight: 600 }}>{currency(computingFees?.[level] || 0)}</div>
                      </div>
                    ))}
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
                          max={selectedStudent.baseFee - selectedStudent.paymentsTotal}
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
        </div>
      </div>
    </div>
  );
};

export default AdminFees;
