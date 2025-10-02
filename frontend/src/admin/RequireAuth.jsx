import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';

const Loader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100%',
    backgroundColor: '#f5f7f9'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #3498db',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <style>{
      `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`
    }</style>
  </div>
);

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('Auth state:', { user, loading });

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    console.log('No user, redirecting to login');
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}

RequireAuth.propTypes = {
  children: PropTypes.node.isRequired,
};
