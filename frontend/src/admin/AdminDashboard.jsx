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
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    totalAdmissions: 0,
    todaySubmissions: 0,
    todayAdmissions: 0
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const subQ = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'), limit(100));
      const admQ = query(collection(db, 'admissions'), orderBy('createdAt', 'desc'), limit(100));
      const [subSnap, admSnap] = await Promise.all([getDocs(subQ), getDocs(admQ)]);
      setSubmissions(subSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setAdmissions(admSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Calculate today's counts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaySubs = subSnap.docs.filter(d => {
        const docDate = d.data().createdAt?.toDate ? d.data().createdAt.toDate() : new Date(d.data().createdAt);
        return docDate >= today;
      });
      
      const todayAdms = admSnap.docs.filter(d => {
        const docDate = d.data().createdAt?.toDate ? d.data().createdAt.toDate() : new Date(d.data().createdAt);
        return docDate >= today;
      });

      setStats({
        totalSubmissions: subSnap.size,
        totalAdmissions: admSnap.size,
        todaySubmissions: todaySubs.length,
        todayAdmissions: todayAdms.length
      });
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
        <div className="header-content">
          <div className="header-title">
            <h1>Admin Dashboard</h1>
            <p>Manage contact submissions and admissions</p>
          </div>
          <div className="admin-actions">
            <span className="user-email">{user?.email}</span>
            <button className="btn btn-secondary" onClick={load} disabled={loading}>
              {loading ? <span className="spinner"></span> : 'Refresh Data'}
            </button>
            <button className="btn btn-signout" onClick={signOut}>Sign Out</button>
          </div>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon submissions-icon">
            <i className="fas fa-envelope"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalSubmissions}</h3>
            <p>Total Submissions</p>
            <span className="stat-today">+{stats.todaySubmissions} today</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon admissions-icon">
            <i className="fas fa-user-graduate"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalAdmissions}</h3>
            <p>Total Admissions</p>
            <span className="stat-today">+{stats.todayAdmissions} today</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon subjects-icon">
            <i className="fas fa-tag"></i>
          </div>
          <div className="stat-content">
            <h3>{subjectCounts.length}</h3>
            <p>Unique Subjects</p>
            <span className="stat-today">Inquiries</span>
          </div>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'submissions' ? 'active' : ''}`} 
          onClick={() => setActiveTab('submissions')}
        >
          <i className="fas fa-envelope"></i>
          Contact Submissions ({submissions.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'admissions' ? 'active' : ''}`} 
          onClick={() => setActiveTab('admissions')}
        >
          <i className="fas fa-user-graduate"></i>
          Admissions ({admissions.length})
        </button>
      </div>

      {activeTab === 'submissions' && (
        <div className="admin-panel">
          <div className="panel-header">
            <h2>Contact Submissions</h2>
            <div className="panel-actions">
              <button className="btn btn-sm btn-export">
                <i className="fas fa-download"></i> Export
              </button>
            </div>
          </div>
          
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date/Time</th>
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
                    <td className="timestamp">{formatTs(s.createdAt)}</td>
                    <td className="name">{s.name || '-'}</td>
                    <td className="email">{s.email || '-'}</td>
                    <td className="phone">{s.phone || '-'}</td>
                    <td className="subject">{s.subject || '-'}</td>
                    <td className="message">{s.message || '-'}</td>
                  </tr>
                ))}
                {submissions.length === 0 && !loading && (
                  <tr><td colSpan={6} className="no-data">No submissions found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="panel-footer">
            <h3>Subject Breakdown</h3>
            <div className="subject-breakdown">
              {subjectCounts.map(([subj, count]) => (
                <div key={subj} className="subject-item">
                  <span className="subject-name">{subj}</span>
                  <span className="subject-count">{count}</span>
                </div>
              ))}
              {subjectCounts.length === 0 && <p>No subject data available</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'admissions' && (
        <div className="admin-panel">
          <div className="panel-header">
            <h2>Admission Applications</h2>
            <div className="panel-actions">
              <button className="btn btn-sm btn-export">
                <i className="fas fa-download"></i> Export
              </button>
            </div>
          </div>
          
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date/Time</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Phone</th>
                  <th>Course</th>
                  <th>Type/Level</th>
                  <th>Study Mode</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map(a => (
                  <tr key={a.id}>
                    <td className="timestamp">{formatTs(a.createdAt)}</td>
                    <td className="name">{a.firstName || '-'}</td>
                    <td className="name">{a.lastName || '-'}</td>
                    <td className="phone">{a.phoneNumber || '-'}</td>
                    <td className="course">{a.course || '-'}</td>
                    <td className="type">{a.course === 'Driving' ? (a.drivingType === 'Endorsement' ? a.endorsementClass : a.drivingType) : a.computingLevel || '-'}</td>
                    <td className="mode">{a.studyMode || '-'}</td>
                  </tr>
                ))}
                {admissions.length === 0 && !loading && (
                  <tr><td colSpan={7} className="no-data">No admissions found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      )}
    </div>
  );
}