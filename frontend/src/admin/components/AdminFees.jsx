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
  const [payment, setPayment] = useState({ amount: '', confirmationCode: '', note: '' });
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
        confirmationCode: payment.confirmationCode,
        note: payment.note,
      });
      await modal.success({ title: 'Payment recorded', text: 'The payment has been added.' });
      setPayment({ amount: '', confirmationCode: '', note: '' });
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
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 12 }}>Admin: Fees Management</h1>

      {/* Tabs navbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #e5e7eb' }}>
        <button
          className={`student-detail-edit-button ${activeTab === 'record' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('record')}
          style={{ padding: '8px 12px', borderBottom: activeTab === 'record' ? '2px solid #2563eb' : '2px solid transparent' }}
        >
          Record Payment
        </button>
        <button
          className={`student-detail-edit-button ${activeTab === 'students' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('students')}
          style={{ padding: '8px 12px', borderBottom: activeTab === 'students' ? '2px solid #2563eb' : '2px solid transparent' }}
        >
          Students & Balances
        </button>
        <button
          className={`student-detail-edit-button ${activeTab === 'fees' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('fees')}
          style={{ padding: '8px 12px', marginLeft: 'auto', borderBottom: activeTab === 'fees' ? '2px solid #2563eb' : '2px solid transparent' }}
        >
          Course Fees
        </button>
      </div>

      {/* Course Fees Editor */}
      {activeTab === 'fees' && (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, marginBottom: 12 }}>Course Fees</h2>
          {!loading && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="student-detail-edit-button"
                onClick={() => setEditingDriving((v) => !v)}
                style={{ padding: '8px 10px' }}
              >
                {editingDriving ? 'Done (Driving)' : 'Edit Driving'}
              </button>
              <button
                className="student-detail-edit-button"
                onClick={() => setEditingComputing((v) => !v)}
                style={{ padding: '8px 10px' }}
              >
                {editingComputing ? 'Done (Computing)' : 'Edit Computing'}
              </button>
            </div>
          )}
        </div>

        {/* DRIVING SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          <div>
            <h3 style={{ margin: '6px 0' }}>Driving (by Class and Type)</h3>
            {/* View mode */}
            {!editingDriving && (
              <div>
                {Object.keys(drivingFees).length === 0 ? (
                  <div style={{ fontSize: 13, color: '#6b7280' }}>No driving fees set yet. Click "Edit Driving" to configure.</div>
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
            )}

            {/* Edit mode */}
            {editingDriving && (
              <div>
                {/* Add missing class control */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  <label style={{ fontWeight: 600 }}>Add Class:</label>
                  <select
                    className="student-detail-select"
                    value={newDrivingClass}
                    onChange={(e) => setNewDrivingClass(e.target.value)}
                    style={{ minWidth: 140 }}
                  >
                    <option value="">Select class</option>
                    {ALL_DRIVING_CLASSES.filter((c) => !Object.keys(drivingDraft).includes(c)).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    className="student-detail-save-button"
                    onClick={() => {
                      if (!newDrivingClass) return;
                      setDrivingDraft((prev) => ({
                        ...prev,
                        [newDrivingClass]: { 'New Student': '', 'Endorsement': '', 'Refresher': '' },
                      }));
                      setNewDrivingClass('');
                    }}
                    disabled={!ALL_DRIVING_CLASSES.some((c) => c === newDrivingClass) || Object.keys(drivingDraft).includes(newDrivingClass)}
                    style={{ padding: '8px 10px' }}
                  >
                    Add Class
                  </button>
                </div>
                {Object.keys(drivingDraft).length === 0 && (
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Initialize classes below, then Save per field.</div>
                )}
                {Object.entries(drivingDraft).map(([cls, types]) => (
                  <div key={cls} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>{cls}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                      {['New Student','Endorsement','Refresher'].map((type) => (
                        <div key={type}>
                          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>{type}</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              type="number"
                              className="student-detail-input"
                              value={types?.[type] ?? ''}
                              onChange={(e) => setDrivingDraft((prev) => ({
                                ...prev,
                                [cls]: { ...(prev[cls] || {}), [type]: e.target.value }
                              }))}
                              placeholder="e.g., 15000"
                              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                            />
                            <button
                              className="student-detail-save-button"
                              onClick={() => saveDriving(cls, type)}
                              disabled={savingFees}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {/* Quick setup */}
                {Object.keys(drivingDraft).length === 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    {['A1/A2','B1/B2','C1/C2','D1/D2'].map((cls) => (
                      <div key={cls} style={{ border: '1px dashed #e5e7eb', borderRadius: 8, padding: 12 }}>
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>{cls}</div>
                        {['New Student','Endorsement','Refresher'].map((type) => (
                          <div key={type} style={{ marginBottom: 8 }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>{type}</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input
                                type="number"
                                className="student-detail-input"
                                value={drivingDraft?.[cls]?.[type] ?? ''}
                                onChange={(e) => setDrivingDraft((prev) => ({
                                  ...prev,
                                  [cls]: { ...(prev[cls] || {}), [type]: e.target.value }
                                }))}
                                placeholder="e.g., 15000"
                                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                              />
                              <button className="student-detail-save-button" onClick={() => saveDriving(cls, type)} disabled={savingFees}>Save</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* COMPUTING SECTION */}
          <div>
            <h3 style={{ margin: '6px 0' }}>Computing (by Level)</h3>
            {/* View mode */}
            {!editingComputing && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {['Beginner','Intermediate'].map((level) => (
                  <div key={level}>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{level}</div>
                    <div style={{ fontWeight: 600 }}>{currency(computingFees?.[level] || 0)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Edit mode */}
            {editingComputing && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                {['Beginner','Intermediate'].map((level) => (
                  <div key={level}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>{level}</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="number"
                        className="student-detail-input"
                        value={computingDraft?.[level] ?? ''}
                        onChange={(e) => setComputingDraft((prev) => ({ ...prev, [level]: e.target.value }))}
                        placeholder="e.g., 6000"
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                      />
                      <button className="student-detail-save-button" onClick={() => saveComputing(level)} disabled={savingFees}>Save</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      )}
 
      {/* Payment Form */}
      {activeTab === 'record' && (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h2 style={{ margin: 0, marginBottom: 12 }}>Record Payment</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Find Student (Name or Admission No.)</label>
            <input
              className="student-detail-input"
              placeholder="Start typing... e.g., Jane, John Doe, 0007"
              value={studentQuery}
              onChange={(e) => { setStudentQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
            />
            {showSuggestions && studentSuggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  marginTop: 4,
                  zIndex: 20,
                  maxHeight: 260,
                  overflowY: 'auto',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
                }}
                onMouseLeave={() => setShowSuggestions(false)}
              >
                {studentSuggestions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedStudentId(s.id);
                      setStudentQuery(`${s.firstName || ''} ${s.lastName || ''} ${s.admissionNumber ? `(${s.admissionNumber})` : ''}`.trim());
                      setShowSuggestions(false);
                    }}
                    style={{ padding: '8px 10px', cursor: 'pointer' }}
                    className="zds-suggestion-item"
                  >
                    <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName} {s.admissionNumber ? `(${s.admissionNumber})` : ''}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{s.course || '-'}</div>
                  </div>
                ))}
              </div>
            )}
            {selectedStudent && (
              <div style={{ fontSize: 12, color: '#374151', marginTop: 8, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
                <div><strong>Selected:</strong> {selectedStudent.firstName} {selectedStudent.lastName} {selectedStudent.admissionNumber ? `(${selectedStudent.admissionNumber})` : ''}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, color: '#6b7280', flexWrap: 'wrap' }}>
                  <span>Course: <strong>{selectedStudent.course || '-'}</strong></span>
                  {selectedStudent.course === 'Driving' && (
                    <>
                      <span>
                        Type:
                        <select className="student-detail-select" value={payDrivingType} onChange={(e) => setPayDrivingType(e.target.value)} style={{ marginLeft: 6 }}>
                          <option value="New Student">New Student</option>
                          <option value="Endorsement">Endorsement</option>
                          <option value="Refresher">Refresher</option>
                        </select>
                      </span>
                      <span>
                        Class:
                        <select className="student-detail-select" value={payDrivingClass} onChange={(e) => setPayDrivingClass(e.target.value)} style={{ marginLeft: 6 }}>
                          {ALL_DRIVING_CLASSES.map((c) => (<option key={c} value={c}>{c}</option>))}
                        </select>
                      </span>
                    </>
                  )}
                  {selectedStudent.course === 'Computing' && (
                    <span>
                      Level:
                      <select className="student-detail-select" value={payComputingLevel} onChange={(e) => setPayComputingLevel(e.target.value)} style={{ marginLeft: 6 }}>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                      </select>
                    </span>
                  )}
                  <span>Base fee: <strong>{currency(displayBaseFee || 0)}</strong></span>
                  <span>Total paid: <strong>{currency(selectedStudent.paymentsTotal || 0)}</strong></span>
                  <span>Balance: <strong>{currency(displayBalance || 0)}</strong></span>
                </div>
                <div style={{ color: '#6b7280', marginTop: 6 }}>
                  This selection only affects the fee context for this payment guidance. To permanently set a student's class/level, edit their profile.
                </div>
              </div>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Amount</label>
            <input type="number" className="student-detail-input" value={payment.amount} onChange={(e) => setPayment((p) => ({ ...p, amount: e.target.value }))} placeholder="e.g., 5000" onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Confirmation Code</label>
            <input type="text" className="student-detail-input" value={payment.confirmationCode} onChange={(e) => setPayment((p) => ({ ...p, confirmationCode: e.target.value }))} placeholder="e.g., MPESA/Bank ref" onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} />
          </div>
          {/* Paid At auto-recorded using current time; no manual entry needed */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Note (optional)</label>
            <input type="text" className="student-detail-input" value={payment.note} onChange={(e) => setPayment((p) => ({ ...p, note: e.target.value }))} placeholder="e.g., Paid at branch X" onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} />
          </div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className="student-detail-save-button" onClick={submitPayment} disabled={submittingPayment || !selectedStudentId || !Number(payment.amount)}>
            {submittingPayment ? 'Saving...' : 'Add Payment'}
          </button>
        </div>
      </div>
      )}
 
      {/* Students & Balances */}
      {activeTab === 'students' && (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
        <h2 style={{ margin: 0, marginBottom: 12 }}>Students & Balances</h2>
        <div style={{ marginBottom: 12 }}>
          <input
            className="student-detail-input"
            placeholder="Search by name, course, admission no..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
          />
        </div>
        <div className="zds-students-table-wrap">
          <table className="zds-students-table">
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
      </div>
      )}
       {loading && <div style={{ marginTop: 8, color: '#6b7280' }}>Loading...</div>}
     </div>
   );
};

export default AdminFees;
