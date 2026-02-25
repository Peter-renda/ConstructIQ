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
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-primary flex-col justify-between p-12">
        <div className="flex items-center gap-2.5 text-white">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Building2 className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-lg font-semibold">ConstructIQ</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white mb-3 leading-snug">
            Manage every project<br />from one place.
          </h2>
          <p className="text-primary-foreground/70 text-sm leading-relaxed max-w-sm">
            RFIs, submittals, documents, tasks — everything your team needs, organized and accessible.
          </p>
        </div>
        <p className="text-primary-foreground/40 text-xs">© {new Date().getFullYear()} ConstructIQ</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 text-primary mb-8">
            <Building2 className="h-6 w-6" />
            <span className="text-xl font-bold">ConstructIQ</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-7">Sign in to your account</p>

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

          <p className="text-center text-sm text-muted-foreground mt-6">
            No account?{' '}
            <Link to="/sign-up" className="text-primary hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
