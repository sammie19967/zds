import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import modal from '../utils/modal';
import '../styles/AdminAuth.css';

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      await modal.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password);
      await modal.success('Account created', 'Your admin account has been created. Please sign in.');
      navigate('/admin/login', { replace: true });
    } catch (err) {
      setError(err?.message || 'Signup failed');
      await modal.error('Signup failed', err?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-auth-container">
      <div className="admin-auth-card">
        <div className="admin-auth-header">
          <h1 className="admin-auth-title">Create Admin Account</h1>
          <p className="admin-auth-subtitle">Sign up to manage submissions and admissions</p>
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
            <div className="admin-auth-row">
              <label htmlFor="confirm" className="admin-auth-label">Confirm Password</label>
              <input id="confirm" type="password" className="admin-auth-input" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            <div className="admin-auth-actions">
              <span></span>
              <button type="submit" className="admin-auth-btn primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>

        <div className="admin-auth-footer">
          Already have an account? <Link to="/admin/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
