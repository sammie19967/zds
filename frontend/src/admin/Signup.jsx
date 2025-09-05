import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import modal from '../utils/modal';
import '../styles/Admin.css';

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
    <div className="admin-container" style={{ maxWidth: 420 }}>
      <div className="admin-header"><h1>Create Admin Account</h1></div>
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
        <div className="form-row">
          <label htmlFor="confirm">Confirm Password</label>
          <input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
        </div>
        <button type="submit" className="multi-button right" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
      </form>
      <p style={{ marginTop: 12 }}>Already have an account? <Link to="/admin/login">Sign in</Link></p>
    </div>
  );
}
