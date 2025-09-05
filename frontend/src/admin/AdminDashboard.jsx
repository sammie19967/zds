import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, limit, query } from 'firebase/firestore';
import { db } from '../utils/firebase';
import '../styles/Admin.css';
import { useAuth } from '../context/AuthContext';

function formatTs(ts) {
  try {
    if (!ts) return '-';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString();
  } catch {
    return '-';
  }
}

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('submissions');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const subQ = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'), limit(100));
      const admQ = query(collection(db, 'admissions'), orderBy('createdAt', 'desc'), limit(100));
      const [subSnap, admSnap] = await Promise.all([getDocs(subQ), getDocs(admQ)]);
      setSubmissions(subSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setAdmissions(admSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
      setError(e?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const subjectCounts = useMemo(() => {
    const counts = {};
    for (const s of submissions) {
      const subj = s.subject || 'General';
      counts[subj] = (counts[subj] || 0) + 1;
    }
    return Object.entries(counts).sort((a,b) => b[1]-a[1]);
  }, [submissions]);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-actions">
          <span style={{ marginRight: 12, fontSize: 14, color: '#555' }}>{user?.email}</span>
          <button onClick={load} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
          <button style={{ marginLeft: 8 }} onClick={signOut}>Sign out</button>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-tabs">
        <button className={activeTab === 'submissions' ? 'active' : ''} onClick={() => setActiveTab('submissions')}>Contact Submissions</button>
        <button className={activeTab === 'admissions' ? 'active' : ''} onClick={() => setActiveTab('admissions')}>Admissions</button>
      </div>

      {activeTab === 'submissions' && (
        <div className="admin-panel">
          <h2>Recent Contact Submissions ({submissions.length})</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Subject</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(s => (
                  <tr key={s.id}>
                    <td>{formatTs(s.createdAt)}</td>
                    <td>{s.name || '-'}</td>
                    <td>{s.email || '-'}</td>
                    <td>{s.phone || '-'}</td>
                    <td>{s.subject || '-'}</td>
                    <td className="truncate">{s.message || '-'}</td>
                  </tr>
                ))}
                {submissions.length === 0 && !loading && (
                  <tr><td colSpan={6} style={{ textAlign: 'center' }}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <h3>Subject Breakdown</h3>
          <ul className="metrics-list">
            {subjectCounts.map(([subj, count]) => (
              <li key={subj}><strong>{subj}:</strong> {count}</li>
            ))}
            {subjectCounts.length === 0 && <li>No data</li>}
          </ul>
        </div>
      )}

      {activeTab === 'admissions' && (
        <div className="admin-panel">
          <h2>Recent Admissions ({admissions.length})</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>First</th>
                  <th>Last</th>
                  <th>Phone</th>
                  <th>Course</th>
                  <th>Type/Level</th>
                  <th>Study Mode</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map(a => (
                  <tr key={a.id}>
                    <td>{formatTs(a.createdAt)}</td>
                    <td>{a.firstName || '-'}</td>
                    <td>{a.lastName || '-'}</td>
                    <td>{a.phoneNumber || '-'}</td>
                    <td>{a.course || '-'}</td>
                    <td>{a.course === 'Driving' ? (a.drivingType === 'Endorsement' ? a.endorsementClass : a.drivingType) : a.computingLevel || '-'}</td>
                    <td>{a.studyMode || '-'}</td>
                  </tr>
                ))}
                {admissions.length === 0 && !loading && (
                  <tr><td colSpan={7} style={{ textAlign: 'center' }}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
