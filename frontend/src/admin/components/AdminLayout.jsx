import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import '../styles/AdminLayout.css';

const AdminLayout = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log('AdminLayout rendered at path:', location.pathname);
  }, [location]);

  return (
    <div className="admin-container">
      <Sidebar />
      <main className="admin-content">
        <div style={{ padding: '20px' }}>
          <h2>Current Path: {location.pathname}</h2>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
