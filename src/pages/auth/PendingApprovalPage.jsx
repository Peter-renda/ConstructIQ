import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Building2, Clock } from 'lucide-react';

export function PendingApprovalPage() {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/sign-in');
  };

  const isRejected = profile?.status === 'rejected';

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
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        <div className="flex justify-center mb-4">
          <div className={`p-3 rounded-full ${isRejected ? 'bg-red-50' : 'bg-amber-50'}`}>
            <Clock className={`h-7 w-7 ${isRejected ? 'text-red-500' : 'text-amber-500'}`} />
          </div>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">
          {isRejected ? 'Access denied' : 'Account pending approval'}
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          {isRejected
            ? 'Your account request was not approved. Please contact an administrator for more information.'
            : 'An administrator will review your request shortly. You will be able to sign in once your account is approved.'}
        </p>

        <Button variant="outline" className="w-full" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>

      <p className="text-white/30 text-xs mt-8">© {new Date().getFullYear()} ConstructIQ</p>
    </div>
  );
}
