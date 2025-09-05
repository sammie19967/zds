import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import modal from '../utils/modal';
import '../styles/Admin.css';

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
    <div className="admin-container" style={{ maxWidth: 420 }}>
      <div className="admin-header"><h1>Admin Login</h1></div>
      {error && <div className="admin-error">{error}</div>}
      <form onSubmit={handleSubmit} className="admin-panel">
        <div className="form-row">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="form-row">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="multi-button right" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
      </form>
      <p style={{ marginTop: 12 }}>No account? <Link to="/admin/signup">Create one</Link></p>
    </div>
  );
}
