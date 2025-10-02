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

  // Strong password policy
  // - at least 8 characters
  // - contains lowercase, uppercase, digit, and special character
  // - no leading/trailing spaces
  // - does not contain the email local part
  const policy = {
    minLen: 8,
  };

  const evaluatePassword = (pwd, emailVal) => {
    const checks = {
      length: pwd.length >= policy.minLen,
      lower: /[a-z]/.test(pwd),
      upper: /[A-Z]/.test(pwd),
      digit: /\d/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd),
      trimmed: pwd === pwd.trim() && pwd.length > 0,
      noEmailLocal: true,
    };
    const local = String(emailVal || '').split('@')[0] || '';
    if (local) {
      checks.noEmailLocal = !pwd.toLowerCase().includes(local.toLowerCase());
    }
    const isValid = Object.values(checks).every(Boolean);
    return { isValid, checks };
  };

  const { isValid: isPwdValid, checks } = evaluatePassword(password, email);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!isPwdValid) {
      setError('Password does not meet the required strength.');
      await modal.error('Weak password', 'Please meet all password requirements.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      await modal.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const cleanEmail = email.trim();
      await signUp(cleanEmail, password);
      await modal.success('Account created', 'Your admin account has been created. Please sign in.');
      navigate('/admin/login', { replace: true });
    } catch (err) {
      const code = err?.code || '';
      const msg = mapFirebaseSignupError(code, err?.message);
      setError(msg);
      await modal.error('Signup failed', msg);
    } finally {
      setLoading(false);
    }
  }

  function mapFirebaseSignupError(code, fallback) {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'This email is already in use. Try signing in or use a different email.';
      case 'auth/invalid-email':
        return 'The email address is not valid. Please check and try again.';
      case 'auth/weak-password':
        return 'Your password is too weak. Please follow the password requirements.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are disabled for this project. Contact support.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.';
      default:
        return fallback || 'Unable to create account. Please try again later.';
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
              <div className="admin-auth-password-help">
                <ul>
                  <li className={checks.length ? 'ok' : 'bad'}>At least {policy.minLen}+ characters</li>
                  <li className={checks.lower ? 'ok' : 'bad'}>Contains a lowercase letter</li>
                  <li className={checks.upper ? 'ok' : 'bad'}>Contains an uppercase letter</li>
                  <li className={checks.digit ? 'ok' : 'bad'}>Contains a number</li>
                  <li className={checks.special ? 'ok' : 'bad'}>Contains a special character</li>
                  <li className={checks.trimmed ? 'ok' : 'bad'}>No leading or trailing spaces</li>
                  <li className={checks.noEmailLocal ? 'ok' : 'bad'}>Does not include your email name</li>
                </ul>
              </div>
            </div>
            <div className="admin-auth-row">
              <label htmlFor="confirm" className="admin-auth-label">Confirm Password</label>
              <input id="confirm" type="password" className="admin-auth-input" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            <div className="admin-auth-actions">
              <span></span>
              <button type="submit" className="admin-auth-btn primary" disabled={loading || !isPwdValid || password !== confirm}>
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
