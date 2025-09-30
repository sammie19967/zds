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
  getPaymentByStudent,
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
  // Verify receipt state
  const [verifyUrl, setVerifyUrl] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifyData, setVerifyData] = useState(null);

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

  const parseVerifyPath = (input) => {
    try {
      const trimmed = (input || '').trim().replace(/\s+/g, ''); // remove spaces anywhere
      if (!trimmed) return null;
      // Supports full URL or path
      let path = trimmed;
      if (/^https?:\/\//i.test(trimmed)) {
        const u = new URL(trimmed);
        path = u.pathname;
      }
      // Accept raw "studentId/paymentId" or with prefix
      if (!path.startsWith('/')) path = '/' + path;
      path = path.replace(/\/+$/, ''); // trim trailing slashes
      let m = path.match(/\/verify-receipt\/(.*?)\/(.*?)(?:[/?#]|$)/);
      if (!m) {
        m = path.match(/^\/(.*?)\/(.*?)$/);
      }
      if (!m) return null;
      return { studentId: m[1], paymentId: m[2] };
    } catch (e) {
      return null;
    }
  };

  const handleVerify = async () => {
    setVerifyError('');
    setVerifyData(null);
    const ids = parseVerifyPath(verifyUrl);
    if (!ids) { setVerifyError('Enter a valid receipt URL'); return; }
    try {
      setVerifyLoading(true);
      const res = await getPaymentByStudent(ids.studentId, ids.paymentId);
      if (!res) { setVerifyError('Receipt not found'); return; }
      setVerifyData({ ...res, ids });
      // Log success
      try {
        const { logReceiptVerification } = await import('../../utils/firebase');
        await logReceiptVerification({ studentId: ids.studentId, paymentId: ids.paymentId, inputUrl: verifyUrl, success: true });
      } catch (e) { /* noop */ }
    } catch (e) {
      setVerifyError(e?.message || 'Failed to verify');
      try {
        const { logReceiptVerification } = await import('../../utils/firebase');
        await logReceiptVerification({ studentId: ids.studentId, paymentId: ids.paymentId, inputUrl: verifyUrl, success: false, errorMessage: e?.message || 'Failed' });
      } catch (err) { /* noop */ }
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="admin-dashboard-container">
      {/* Header */}
      <div className="admin-dashboard-header">
        <div className="admin-dashboard-header-content">
          <h1 className="admin-dashboard-page-title">Dashboard</h1>
          <p className="admin-dashboard-page-subtitle">Key metrics and recent activity</p>
        </div>
        <div className="admin-dashboard-header-actions">
          <div className="admin-dashboard-search">
            <FaSearch className="admin-dashboard-search-icon" />
            <input className="admin-dashboard-search-input" placeholder="Search students, enquiries..." />
          </div>
          <div className="admin-dashboard-month-filter">
            <label className="admin-dashboard-month-label">Month</label>
            <input type="month" className="admin-dashboard-month-input" value={month} onChange={(e)=>setMonth(e.target.value)} />
          </div>
        </div>
      </div>

      {loading && (
        <div className="admin-dashboard-loading">
          <div className="admin-dashboard-loading-spinner"></div>
          <p className="admin-dashboard-loading-text">Loading dashboard...</p>
        </div>
      )}
      
      {error && (
        <div className="admin-dashboard-error">
          <span className="admin-dashboard-error-text">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Stats Grid */}
          <div className="admin-dashboard-stats-grid">
            {cards.map((c) => (
              <Link key={c.label} to={c.to} className="admin-dashboard-stat-card">
                <div className={`admin-dashboard-stat-icon admin-dashboard-chip-${c.tone}`}>{c.icon}</div>
                <div className="admin-dashboard-stat-info">
                  <span className="admin-dashboard-stat-label">{c.label}</span>
                  <strong className="admin-dashboard-stat-value">{c.value}</strong>
                </div>
              </Link>
            ))}
          </div>

          {/* Two-column layout */}
          <div className="admin-dashboard-main-grid">
            {/* Quick Actions + Recent */}
            <div className="admin-dashboard-left-column">
              {/* Verify Receipt */}
              <div className="admin-dashboard-card admin-verify-card">
                <div className="admin-dashboard-card-header">
                  <h2 className="admin-dashboard-card-title">Verify Receipt</h2>
                </div>
                <div className="admin-verify-grid">
                  <input
                    className="admin-verify-input"
                    placeholder="Paste receipt URL (e.g. /verify-receipt/{studentId}/{paymentId})"
                    value={verifyUrl}
                    onChange={(e)=>setVerifyUrl(e.target.value)}
                  />
                  <button className="admin-dashboard-btn admin-verify-btn" onClick={handleVerify} disabled={verifyLoading}>
                    {verifyLoading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                {verifyError && (
                  <div className="admin-dashboard-error admin-dashboard-error--compact admin-verify-error">
                    <span className="admin-dashboard-error-text">{verifyError}</span>
                  </div>
                )}
                {verifyData && (
                  <div className="admin-verify-result">
                    <div className="admin-verify-meta">
                      <div>
                        <div className="admin-verify-label">Student</div>
                        <div className="admin-verify-value-strong">{`${verifyData.student?.firstName || ''} ${verifyData.student?.lastName || ''}`.trim()}</div>
                      </div>
                      <div>
                        <div className="admin-verify-label">Admission</div>
                        <div className="admin-verify-value">{verifyData.student?.admissionNumber || '-'}</div>
                      </div>
                      <div>
                        <div className="admin-verify-label">Amount</div>
                        <div className="admin-verify-amount">{`KSh ${Number(verifyData.payment?.amount || 0).toLocaleString()}`}</div>
                      </div>
                      <div>
                        <div className="admin-verify-label">Method</div>
                        <div className="admin-verify-value">{(verifyData.payment?.method || '-').toString().toUpperCase()}</div>
                      </div>
                    </div>
                    <div className="admin-verify-actions">
                      <a className="admin-dashboard-btn admin-dashboard-btn-link" href={`/verify-receipt/${verifyData.ids.studentId}/${verifyData.ids.paymentId}`} target="_blank" rel="noopener noreferrer">Open Details</a>
                      <button
                        className="admin-dashboard-btn"
                        onClick={async ()=>{ await navigator.clipboard.writeText(verifyData.ids.studentId); }}
                        title="Copy Student ID"
                      >Copy Student ID</button>
                      <button
                        className="admin-dashboard-btn"
                        onClick={async ()=>{ await navigator.clipboard.writeText(verifyData.ids.paymentId); }}
                        title="Copy Payment ID"
                      >Copy Payment ID</button>
                      <button
                        className="admin-dashboard-btn"
                        onClick={async ()=>{ await navigator.clipboard.writeText(`${window.location.origin}/verify-receipt/${verifyData.ids.studentId}/${verifyData.ids.paymentId}`); }}
                        title="Copy Full URL"
                      >Copy URL</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="admin-dashboard-card">
                <div className="admin-dashboard-card-header">
                  <h2 className="admin-dashboard-card-title">Quick Actions</h2>
                </div>
                <div className="admin-dashboard-actions-grid">
                  <Link to="/admin/register" className="admin-dashboard-action-btn">
                    <span className="admin-dashboard-btn-icon"><FaPlus /></span>
                    <span className="admin-dashboard-btn-label">Register Student</span>
                  </Link>
                  <Link to="/admin/fees" className="admin-dashboard-action-btn">
                    <span className="admin-dashboard-btn-icon"><FaMoneyBillWave /></span>
                    <span className="admin-dashboard-btn-label">Record Payment</span>
                  </Link>
                  <Link to="/admin/fuel" className="admin-dashboard-action-btn">
                    <span className="admin-dashboard-btn-icon"><FaGasPump /></span>
                    <span className="admin-dashboard-btn-label">Fuel Log</span>
                  </Link>
                  <Link to="/admin/enquiries" className="admin-dashboard-action-btn">
                    <span className="admin-dashboard-btn-icon"><FaEnvelope /></span>
                    <span className="admin-dashboard-btn-label">View Inquiries</span>
                  </Link>
                </div>
              </div>

              {/* Recent Students */}
              <div className="admin-dashboard-card">
                <div className="admin-dashboard-card-header">
                  <h2 className="admin-dashboard-card-title">Recent Students</h2>
                  <Link to="/admin/students" className="admin-dashboard-btn admin-dashboard-btn-link">View all</Link>
                </div>
                <ul className="admin-dashboard-activity-list">
                  {recentStudents.map((s) => (
                    <li key={s.id} className="admin-dashboard-activity-item">
                      <span className="admin-dashboard-activity-time">{s.admissionNumber || s.id.slice(0,8)}</span>
                      <span className="admin-dashboard-activity-text">{s.firstName} {s.lastName} — {s.course}</span>
                    </li>
                  ))}
                  {recentStudents.length === 0 && (
                    <li className="admin-dashboard-activity-item">No recent admissions</li>
                  )}
                </ul>
              </div>

              {/* Recent Enquiries */}
              <div className="admin-dashboard-card">
                <div className="admin-dashboard-card-header">
                  <h2 className="admin-dashboard-card-title">Recent Enquiries</h2>
                  <Link to="/admin/enquiries" className="admin-dashboard-btn admin-dashboard-btn-link">View all</Link>
                </div>
                <ul className="admin-dashboard-activity-list">
                  {recentEnquiries.map((e) => (
                    <li key={e.id} className="admin-dashboard-activity-item">
                      <span className="admin-dashboard-activity-time">{new Date(e.createdAt?.seconds ? e.createdAt.seconds * 1000 : e.createdAt).toLocaleDateString?.() || ''}</span>
                      <span className="admin-dashboard-activity-text">{e.name} — {e.subject || 'General Inquiry'}</span>
                    </li>
                  ))}
                  {recentEnquiries.length === 0 && (
                    <li className="admin-dashboard-activity-item">No recent enquiries</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Sidebar: Summary cards */}
            <div className="admin-dashboard-summary">
              <div className="admin-dashboard-summary-header">
                <h2 className="admin-dashboard-summary-title">Summary</h2>
              </div>
              <ul className="admin-dashboard-summary-list">
                <li className="admin-dashboard-summary-row">
                  <span className="admin-dashboard-summary-label">Fees (MoM)</span>
                  <strong className="admin-dashboard-summary-value">{currency(stats.paymentsMonth)}</strong>
                </li>
                <li className="admin-dashboard-summary-row">
                  <span className="admin-dashboard-summary-label">Fuel Cost (MoM)</span>
                  <strong className="admin-dashboard-summary-value">{currency(stats.fuelCostMonth)}</strong>
                </li>
                <li className="admin-dashboard-summary-row">
                  <span className="admin-dashboard-summary-label">Enquiries (MoM)</span>
                  <strong className="admin-dashboard-summary-value">{stats.enquiriesMonth}</strong>
                </li>
                <li className="admin-dashboard-summary-row">
                  <span className="admin-dashboard-summary-label">Applications (MoM)</span>
                  <strong className="admin-dashboard-summary-value">{stats.applicationsMonth}</strong>
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