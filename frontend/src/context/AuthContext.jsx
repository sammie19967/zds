import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { subscribeAuth, signInWithEmail, signOutUser, signUpWithEmail } from '../utils/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = subscribeAuth((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    error,
    async signIn(email, password) {
      setError('');
      try {
        await signInWithEmail(email, password);
      } catch (err) {
        setError(err?.message || 'Unable to sign in.');
        throw err;
      }
    },
    async signUp(email, password) {
      setError('');
      try {
        await signUpWithEmail(email, password);
      } catch (err) {
        setError(err?.message || 'Unable to create account.');
        throw err;
      }
    },
    async signOut() {
      await signOutUser();
    },
  }), [user, loading, error]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
