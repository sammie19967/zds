import { useEffect, useMemo, useState } from 'react';
import modal from '../../utils/modal';
import {
  getCourseFees,
  setCourseFee,
  listAdminAdmissions,
  addStudentPayment,
  getStudentPaymentsTotal,
} from '../../utils/firebase';

const currency = (n) => `KSh ${Number(n || 0).toLocaleString()}`;

const AdminFees = () => {
  const [loading, setLoading] = useState(true);
  const [savingFees, setSavingFees] = useState(false);
  const [fees, setFees] = useState({ Driving: 0, Computing: 0 });
  const [students, setStudents] = useState([]); // {id, firstName, lastName, course, amountPaid, paymentsTotal, balance}
  const [query, setQuery] = useState('');
  const [refreshToggle, setRefreshToggle] = useState(0);

  // Payment form
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [payment, setPayment] = useState({ amount: '', confirmationCode: '', note: '' });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  // Typeahead for student selection
  const [studentQuery, setStudentQuery] = useState('');
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Load course fees
        const cf = await getCourseFees();
        if (mounted) setFees({ Driving: cf.Driving || 0, Computing: cf.Computing || 0 });

        // Load students
        const list = await listAdminAdmissions({ take: 200 });
        // Compute payments totals for each student
        const withTotals = await Promise.all(
          list.map(async (s) => {
            const paymentsTotal = await getStudentPaymentsTotal(s.id);
            // Base fee by course
            const baseFee = s.course && fees[s.course] ? fees[s.course] : (s.course === 'Driving' ? cf.Driving || 0 : s.course === 'Computing' ? cf.Computing || 0 : 0);
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

  const saveCourseFees = async () => {
    try {
      setSavingFees(true);
      await setCourseFee('Driving', Number(fees.Driving || 0));
      await setCourseFee('Computing', Number(fees.Computing || 0));
      await modal.success({ title: 'Saved', text: 'Course fees updated.' });
      setRefreshToggle((x) => x + 1);
    } catch (e) {
      await modal.error({ title: 'Failed to save fees', text: e?.message || 'Please try again.' });
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
    try {
      setSubmittingPayment(true);
      // Do not pass paidAt; let backend default to current timestamp/ISO
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

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 16 }}>Admin: Fees Management</h1>

      {/* Course Fees Editor */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h2 style={{ margin: 0, marginBottom: 12 }}>Course Fees</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Driving Fee</label>
            <input type="number" value={fees.Driving} onChange={(e) => setFees((f) => ({ ...f, Driving: e.target.value }))} className="student-detail-input" placeholder="e.g., 15000" />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Computing Fee</label>
            <input type="number" value={fees.Computing} onChange={(e) => setFees((f) => ({ ...f, Computing: e.target.value }))} className="student-detail-input" placeholder="e.g., 10000" />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="student-detail-save-button" onClick={saveCourseFees} disabled={savingFees}>
            {savingFees ? 'Saving...' : 'Save Fees'}
          </button>
        </div>
      </div>

      {/* Payment Form */}
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
            {selectedStudentId && (
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                Selected ID: <strong>{selectedStudentId.slice(0,8)}</strong>
                <button type="button" onClick={() => { setSelectedStudentId(''); setStudentQuery(''); }} style={{ marginLeft: 8, fontSize: 12 }}>
                  Clear
                </button>
              </div>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Amount</label>
            <input type="number" className="student-detail-input" value={payment.amount} onChange={(e) => setPayment((p) => ({ ...p, amount: e.target.value }))} placeholder="e.g., 5000" />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Confirmation Code</label>
            <input type="text" className="student-detail-input" value={payment.confirmationCode} onChange={(e) => setPayment((p) => ({ ...p, confirmationCode: e.target.value }))} placeholder="e.g., MPESA/Bank ref" />
          </div>
          {/* Paid At auto-recorded using current time; no manual entry needed */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Note (optional)</label>
            <input type="text" className="student-detail-input" value={payment.note} onChange={(e) => setPayment((p) => ({ ...p, note: e.target.value }))} placeholder="e.g., Paid at branch X" />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="student-detail-save-button" onClick={submitPayment} disabled={submittingPayment}>
            {submittingPayment ? 'Saving...' : 'Add Payment'}
          </button>
        </div>
      </div>

      {/* Students & Balances */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
        <h2 style={{ margin: 0, marginBottom: 12 }}>Students & Balances</h2>
        <div style={{ marginBottom: 12 }}>
          <input
            className="student-detail-input"
            placeholder="Search by name, course, admission no..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
      {loading && <div style={{ marginTop: 8, color: '#6b7280' }}>Loading...</div>}
    </div>
  );
};

export default AdminFees;
