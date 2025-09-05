import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import modal from '../utils/modal';
import '../styles/AdminAuth.css';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/admin';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      await modal.success('Signed in', 'You are now signed in.');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.message || 'Login failed');
      await modal.error('Login failed', err?.message || 'Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-auth-container">
      <div className="admin-auth-card">
        <div className="admin-auth-header">
          <h1 className="admin-auth-title">Admin Login</h1>
          <p className="admin-auth-subtitle">Sign in to access your dashboard</p>
        </div>

        {error && <div className="admin-auth-error">{error}</div>}

        <div className="admin-auth-body">
          <form onSubmit={handleSubmit}>
            <div className="admin-auth-row">
              <label htmlFor="email" className="admin-auth-label">Email</label>
              <input id="email" type="email" className="admin-auth-input" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="admin-auth-row">
              <label htmlFor="password" className="admin-auth-label">Password</label>
              <input id="password" type="password" className="admin-auth-input" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="admin-auth-actions">
              <span></span>
              <button type="submit" className="admin-auth-btn primary" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>

        <div className="admin-auth-footer">
          No account? <Link to="/admin/signup">Create one</Link>
        </div>
      </div>
    </div>
  );
}
