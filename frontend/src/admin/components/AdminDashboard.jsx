import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaEnvelope, FaMoneyBillWave, FaGasPump, FaPlus, FaSearch } from 'react-icons/fa';
import {
  getCountAdminAdmissions,
  getMonthlyEnquiriesCount,
  getMonthlyApplicationsCount,
  getMonthlyPaymentsTotal,
  getMonthlyFuelCost,
  listAdminAdmissions,
  fetchRecentSubmissions,
} from '../../utils/firebase';
import '../styles/AdminDashboard.css';

const currency = (n) => `KSh ${Number(n || 0).toLocaleString()}`;
const yyyymm = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(yyyymm());
  const [stats, setStats] = useState({
    totalStudents: 0,
    enquiriesMonth: 0,
    applicationsMonth: 0,
    paymentsMonth: 0,
    fuelCostMonth: 0,
  });
  const [recentStudents, setRecentStudents] = useState([]);
  const [recentEnquiries, setRecentEnquiries] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [totalStudents, enquiriesMonth, applicationsMonth, paymentsMonth, fuelCostMonth] = await Promise.all([
          getCountAdminAdmissions(),
          getMonthlyEnquiriesCount(month),
          getMonthlyApplicationsCount(month),
          getMonthlyPaymentsTotal(month),
          getMonthlyFuelCost(month),
        ]);
        const [students, enquiries] = await Promise.all([
          listAdminAdmissions({ take: 5 }),
          fetchRecentSubmissions({ take: 5 }),
        ]);
        if (!mounted) return;
        setStats({ totalStudents, enquiriesMonth, applicationsMonth, paymentsMonth, fuelCostMonth });
        setRecentStudents(students || []);
        setRecentEnquiries(enquiries || []);
      } catch (e) {
        setError(e?.message || 'Failed to load dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [month]);

  const cards = useMemo(() => ([
    { label: 'Total Students', value: stats.totalStudents, icon: <FaUsers />, tone: 'primary', to: '/admin/students' },
    { label: 'Enquiries (This Month)', value: stats.enquiriesMonth, icon: <FaEnvelope />, tone: 'secondary', to: '/admin/enquiries' },
    { label: 'Applications (This Month)', value: stats.applicationsMonth, icon: <FaEnvelope />, tone: 'secondary', to: '/admin/enquiries' },
    { label: 'Fees Collected (This Month)', value: currency(stats.paymentsMonth), icon: <FaMoneyBillWave />, tone: 'yellow', to: '/admin/fees' },
    { label: 'Fuel Cost (This Month)', value: currency(stats.fuelCostMonth), icon: <FaGasPump />, tone: 'red', to: '/admin/fuel' },
  ]), [stats]);

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Key metrics and recent activity</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="search">
            <FaSearch className="search-icon" />
            <input className="search-input" placeholder="Search students, enquiries..." />
          </div>
          <div className="zds-students-month-filter">
            <label className="zds-students-month-label">Month</label>
            <input type="month" className="zds-students-month-input" value={month} onChange={(e)=>setMonth(e.target.value)} />
          </div>
        </div>
      </div>

      {loading && <div style={{ padding: 16, color: '#6b7280' }}>Loading dashboard...</div>}
      {error && (
        <div style={{ padding: 16, color: '#ef4444' }}>{error}</div>
      )}

      {!loading && !error && (
        <>
          {/* Stats Grid */}
          <div className="stats-grid">
            {cards.map((c) => (
              <Link key={c.label} to={c.to} className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className={`stat-icon chip-${c.tone}`}>{c.icon}</div>
                <div className="stat-info">
                  <span className="stat-label">{c.label}</span>
                  <strong className="stat-value">{c.value}</strong>
                </div>
              </Link>
            ))}
          </div>

          {/* Two-column layout */}
          <div className="main-grid">
            {/* Quick Actions + Recent */}
            <div className="left-column">
              {/* Quick Actions */}
              <div className="card">
                <div className="card-header">
                  <h2>Quick Actions</h2>
                </div>
                <div className="actions-grid">
                  <Link to="/admin/register" className="btn action-btn">
                    <span className="btn-icon"><FaPlus /></span>
                    <span className="btn-label">Register Student</span>
                  </Link>
                  <Link to="/admin/fees" className="btn action-btn">
                    <span className="btn-icon"><FaMoneyBillWave /></span>
                    <span className="btn-label">Record Payment</span>
                  </Link>
                  <Link to="/admin/fuel" className="btn action-btn">
                    <span className="btn-icon"><FaGasPump /></span>
                    <span className="btn-label">Fuel Log</span>
                  </Link>
                  <Link to="/admin/enquiries" className="btn action-btn">
                    <span className="btn-icon"><FaEnvelope /></span>
                    <span className="btn-label">View Inquiries</span>
                  </Link>
                </div>
              </div>

              {/* Recent Students */}
              <div className="card">
                <div className="card-header">
                  <h2>Recent Students</h2>
                  <Link to="/admin/students" className="btn link">View all</Link>
                </div>
                <ul className="activity-list">
                  {recentStudents.map((s) => (
                    <li key={s.id} className="activity-item">
                      <span className="activity-time">{s.admissionNumber || s.id.slice(0,8)}</span>
                      <span className="activity-text">{s.firstName} {s.lastName} — {s.course}</span>
                    </li>
                  ))}
                  {recentStudents.length === 0 && (
                    <li className="activity-item">No recent admissions</li>
                  )}
                </ul>
              </div>

              {/* Recent Enquiries */}
              <div className="card">
                <div className="card-header">
                  <h2>Recent Enquiries</h2>
                  <Link to="/admin/enquiries" className="btn link">View all</Link>
                </div>
                <ul className="activity-list">
                  {recentEnquiries.map((e) => (
                    <li key={e.id} className="activity-item">
                      <span className="activity-time">{new Date(e.createdAt?.seconds ? e.createdAt.seconds * 1000 : e.createdAt).toLocaleDateString?.() || ''}</span>
                      <span className="activity-text">{e.name} — {e.subject || 'General Inquiry'}</span>
                    </li>
                  ))}
                  {recentEnquiries.length === 0 && (
                    <li className="activity-item">No recent enquiries</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Sidebar: Summary cards */}
            <div className="card schedule">
              <h2>Summary</h2>
              <ul className="schedule-list">
                <li className="schedule-row">
                  <span>Fees (MoM)</span>
                  <strong>{currency(stats.paymentsMonth)}</strong>
                </li>
                <li className="schedule-row">
                  <span>Fuel Cost (MoM)</span>
                  <strong>{currency(stats.fuelCostMonth)}</strong>
                </li>
                <li className="schedule-row">
                  <span>Enquiries (MoM)</span>
                  <strong>{stats.enquiriesMonth}</strong>
                </li>
                <li className="schedule-row">
                  <span>Applications (MoM)</span>
                  <strong>{stats.applicationsMonth}</strong>
                </li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;