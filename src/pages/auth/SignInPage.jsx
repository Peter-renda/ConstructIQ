import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Building2 } from 'lucide-react';

export function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) { setError(error.message); setLoading(false); }
    else navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 flex flex-col items-center justify-center p-6">
      {/* Logo above card */}
      <div className="flex items-center gap-2.5 mb-7">
        <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">ConstructIQ</span>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-3.5 py-2.5">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoFocus
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-10"
            />
          </div>
          <Button type="submit" className="w-full h-10" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          No account?{' '}
          <Link to="/sign-up" className="text-primary hover:underline font-medium">
            Create one
          </Link>
        </p>
      </div>

      <p className="text-white/30 text-xs mt-8">© {new Date().getFullYear()} ConstructIQ</p>
    </div>
  );
}
