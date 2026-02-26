import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Building2 } from 'lucide-react';

export function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyRole, setCompanyRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const { error } = await signUp(email, password, fullName, companyRole);
    if (error) { setError(error.message); setLoading(false); }
    else navigate('/home');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary via-blue-600 to-blue-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle background texture */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative flex items-center gap-2.5 text-white">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">ConstructIQ</span>
        </div>
        <div className="relative">
          <h2 className="text-3xl font-bold text-white mb-3 leading-snug">
            Get your projects<br />under control.
          </h2>
          <p className="text-white/65 text-sm leading-relaxed max-w-sm">
            Join thousands of construction professionals who manage their projects smarter with ConstructIQ.
          </p>
        </div>
        <p className="relative text-white/35 text-xs">© {new Date().getFullYear()} ConstructIQ</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 text-primary mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">ConstructIQ</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1">Create an account</h1>
          <p className="text-sm text-muted-foreground mb-7">Get started with ConstructIQ today</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-xl px-3.5 py-2.5">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Jane Smith"
                required
                autoFocus
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Company role *</Label>
              <Select value={companyRole} onValueChange={setCompanyRole}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrator">Administrator</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Administrators can create projects and manage users.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-10"
              />
            </div>
            <Button type="submit" className="w-full h-10" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/sign-in" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
