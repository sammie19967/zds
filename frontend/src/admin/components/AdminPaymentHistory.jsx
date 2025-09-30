import { useEffect, useMemo, useState, useCallback } from 'react';
import { listAdminAdmissions, listStudentPayments } from '../../utils/firebase';
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
