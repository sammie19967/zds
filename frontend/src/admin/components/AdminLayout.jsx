import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import '../styles/AdminLayout.css';
import PropTypes from 'prop-types';

const AdminLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => {
      const m = window.matchMedia('(max-width: 768px)').matches;
      setIsMobile(m);
      if (!m) setMobileOpen(false);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className={`admin-container ${mobileOpen ? 'show-sidebar' : ''}`}>
      <Sidebar />
      <main className="admin-content">
        {isMobile && (
          <div className="admin-topbar">
            <button
              className="admin-topbar-btn"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen(v => !v)}
            >
              <span className="admin-topbar-icon" aria-hidden>☰</span>
            </button>
          </div>
        )}
        <div className="admin-main-wrapper">
          {children}
        </div>
      </main>
      {isMobile && mobileOpen && (
        <div className="admin-overlay" onClick={() => setMobileOpen(false)} aria-label="Close menu overlay" />
      )}
    </div>
  );
};

AdminLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AdminLayout;
