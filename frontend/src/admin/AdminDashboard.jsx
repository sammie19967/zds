import { useLocation } from 'react-router-dom';

function AdminDashboard() {
  const location = useLocation();
  
  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="current-path">
          Current Path: <strong>{location.pathname}</strong>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="welcome-message">
          <h2>Welcome to the Admin Panel</h2>
          <p>You are currently viewing the admin dashboard. Use the sidebar to navigate between different sections.</p>
        </div>
        
        <div className="quick-stats">
          <div className="stat-card">
            <h3>Quick Stats</h3>
            <p>Manage your school&apos;s data and settings from this dashboard.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;