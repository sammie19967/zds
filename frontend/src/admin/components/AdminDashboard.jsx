import { Link } from 'react-router-dom';
import { FaUsers, FaEnvelope, FaMoneyBillWave, FaGasPump, FaPlus, FaSearch } from 'react-icons/fa';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  // Placeholder stats. Wire these to real data when available.
  const stats = [
    { label: 'Total Students', value: 128, icon: <FaUsers />, tone: 'primary' },
    { label: 'New Enquiries', value: 14, icon: <FaEnvelope />, tone: 'secondary' },
    { label: 'Fees Collected (MoM)', value: '$42,560', icon: <FaMoneyBillWave />, tone: 'yellow' },
    { label: 'Fuel Expenses (MoM)', value: '$3,240', icon: <FaGasPump />, tone: 'red' },
  ];

  const quickActions = [
    { to: '/admin/register', label: 'Register Student', icon: <FaPlus /> },
    { to: '/admin/students', label: 'View Students', icon: <FaUsers /> },
    { to: '/admin/enquiries', label: 'Review Enquiries', icon: <FaEnvelope /> },
    { to: '/admin/fees', label: 'Manage Fees', icon: <FaMoneyBillWave /> },
  ];

  const recentActivity = [
    { id: 1, time: 'Today, 10:32', action: 'Registered new student: Alice M.' },
    { id: 2, time: 'Today, 09:15', action: 'Enquiry received: Manual Car Lessons' },
    { id: 3, time: 'Yesterday, 16:50', action: 'Recorded fee payment: John D. - $320' },
  ];

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, Admin</h1>
          <p>Here’s a quick overview of what’s happening today.</p>
        </div>
        <div className="search">
          <FaSearch className="search-icon" />
          <input className="search-input" placeholder="Search students, enquiries..." />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon chip-${s.tone}`}>{s.icon}</div>
            <div className="stat-info">
              <span className="stat-label">{s.label}</span>
              <strong className="stat-value">{s.value}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="main-grid">
        {/* Quick Actions + Recent Activity */}
        <div className="left-column">
          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h2>Quick Actions</h2>
            </div>
            <div className="actions-grid">
              {quickActions.map((a) => (
                <Link
                  key={a.to}
                  to={a.to}
                  className="btn action-btn"
                >
                  <span className="btn-icon">{a.icon}</span>
                  <span className="btn-label">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="card-header">
              <h2>Recent Activity</h2>
            </div>
            <ul className="activity-list">
              {recentActivity.map((e) => (
                <li key={e.id} className="activity-item">
                  <span className="activity-time">{e.time}</span>
                  <span className="activity-text">{e.action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar column: Today’s schedule placeholder */}
        <div className="card schedule">
          <h2>Today’s Schedule</h2>
          <ul className="schedule-list">
            <li className="schedule-row">
              <span>08:00 - 09:30</span>
              <strong>Lesson: Manual (Car A)</strong>
            </li>
            <li className="schedule-row">
              <span>10:00 - 11:00</span>
              <strong>Test Prep - John D.</strong>
            </li>
            <li className="schedule-row">
              <span>14:00 - 15:30</span>
              <strong>Lesson: Automatic (Car B)</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;