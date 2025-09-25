import { useEffect, useMemo, useState } from 'react';
import { listAdminAdmissions, listStudentPayments } from '../../utils/firebase';
import modal from '../../utils/modal';

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

  const loadPayments = async (id) => {
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
  };

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 16 }}>Admin: Payment History</h1>

      {/* Student Picker */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1 / 3' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Search Students</label>
            <input className="student-detail-input" placeholder="Search by name, admission no, course" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Select Student</label>
            <select
              className="student-detail-select"
              value={selectedId}
              onChange={async (e) => { const id = e.target.value; setSelectedId(id); await loadPayments(id); }}
            >
              <option value="">-- Choose --</option>
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
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginTop: 16 }}>
        <h2 style={{ margin: 0, marginBottom: 12 }}>Payment Records</h2>
        {!selectedId && (
          <div style={{ color: '#6b7280' }}>Select a student to view payment history.</div>
        )}
        {selectedId && (
          <div className="zds-students-table-wrap">
            <table className="zds-students-table">
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
                    <td><strong>{currency(p.amount)}</strong></td>
                    <td>{p.confirmationCode || '-'}</td>
                    <td>{p.note || '-'}</td>
                  </tr>
                ))}
                {payments.length === 0 && !loadingPayments && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 16, color: '#6b7280' }}>No payments found</td>
                  </tr>
                )}
              </tbody>
            </table>
            {loadingPayments && <div style={{ marginTop: 8, color: '#6b7280' }}>Loading payments...</div>}
          </div>
        )}
      </div>
      {loading && <div style={{ marginTop: 8, color: '#6b7280' }}>Loading students...</div>}
    </div>
  );
};

export default AdminPaymentHistory;
