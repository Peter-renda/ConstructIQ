import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const USERS_KEY = 'constructiq_users';
const SESSION_KEY = 'constructiq_session';

function getStoredUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}
function saveStoredUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function getStoredSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}
function saveStoredSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getStoredSession();
    if (session) {
      setUser(session.user);
      setProfile(session.profile);
    }
    setLoading(false);
  }, []);

  async function signIn(email, password) {
    const users = getStoredUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!found) return { error: { message: 'Invalid email or password' } };
    const { password: _pw, ...safeUser } = found;
    const session = { user: { id: safeUser.id, email: safeUser.email }, profile: safeUser };
    saveStoredSession(session);
    setUser(session.user);
    setProfile(safeUser);
    return { data: session, error: null };
  }

  async function signUp(email, password, fullName, companyRole = 'user') {
    const users = getStoredUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { error: { message: 'An account with this email already exists' } };
    }
    const newUser = {
      id: crypto.randomUUID(),
      email,
      password,
      full_name: fullName,
      company_role: companyRole,
      created_at: new Date().toISOString(),
    };
    saveStoredUsers([...users, newUser]);
    const { password: _pw, ...safeUser } = newUser;
    const session = { user: { id: safeUser.id, email: safeUser.email }, profile: safeUser };
    saveStoredSession(session);
    setUser(session.user);
    setProfile(safeUser);
    return { data: session, error: null };
  }

  async function signOut() {
    saveStoredSession(null);
    setUser(null);
    setProfile(null);
  }

  function updateProfile(updates) {
    const users = getStoredUsers();
    const updated = users.map(u => u.id === user?.id ? { ...u, ...updates } : u);
    saveStoredUsers(updated);
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    const session = getStoredSession();
    if (session) saveStoredSession({ ...session, profile: newProfile });
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
