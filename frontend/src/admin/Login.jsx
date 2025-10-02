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

  // Non-blocking password policy guidance for existing accounts
  const policy = { minLen: 8 };
  const pwdChecks = {
    length: password.length >= policy.minLen,
    trimmed: password === password.trim() && password.length > 0,
  };

  const from = location.state?.from?.pathname || '/admin';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cleanEmail = email.trim();
      await signIn(cleanEmail, password);
      await modal.success('Signed in', 'You are now signed in.');
      navigate(from, { replace: true });
    } catch (err) {
      const code = err?.code || '';
      const msg = mapFirebaseLoginError(code, err?.message);
      setError(msg);
      await modal.error('Login failed', msg);
    } finally {
      setLoading(false);
    }
  }

  function mapFirebaseLoginError(code, fallback) {
    switch (code) {
      case 'auth/invalid-email':
        return 'The email address is not valid.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Contact support.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Incorrect email or password. Please try again.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.';
      default:
        return fallback || 'Unable to sign in. Please try again later.';
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
              {password && (!pwdChecks.length || !pwdChecks.trimmed) && (
                <div className="admin-auth-hint">
                  For security, we recommend passwords of at least {policy.minLen} characters with no leading or trailing spaces.
                </div>
              )}
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
