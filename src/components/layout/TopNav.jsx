import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Building2, LogOut, ChevronRight } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from '../ui/dropdown-menu';
import { useMemo } from 'react';

export function TopNav() {
  const { user, profile, signOut } = useAuth();
  const { projects } = useData();
  const navigate = useNavigate();
  const { projectId } = useParams();

  const project = useMemo(
    () => projects.find(p => p.id === projectId),
    [projects, projectId]
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/sign-in');
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <header className="h-[52px] bg-[#1a2638] flex items-center px-4 sm:px-5 gap-2 sm:gap-3 sticky top-0 z-40 border-b border-white/[0.06]">
      {/* Logo */}
      <button
        onClick={() => navigate('/home')}
        className="flex items-center gap-2.5 font-bold text-white text-sm hover:opacity-80 transition-opacity flex-shrink-0"
      >
        <div className="w-7 h-7 bg-[hsl(208,92%,42%)] rounded-md flex items-center justify-center shadow-sm">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <span className="tracking-tight hidden xs:inline sm:inline">ConstructIQ</span>
      </button>

      {/* Divider */}
      {project && <span className="hidden sm:block w-px h-5 bg-white/15 ml-1" />}

      {/* Project breadcrumb */}
      {project && (
        <div className="hidden sm:flex items-center gap-1.5 text-sm min-w-0">
          <button
            onClick={() => navigate(`/projects/${project.id}/home`)}
            className="text-white/60 hover:text-white/90 transition-colors truncate max-w-[200px] font-medium"
          >
            {project.name}
          </button>
        </div>
      )}

      <div className="flex-1" />

      {/* User avatar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="focus:outline-none rounded-full ring-2 ring-transparent focus:ring-white/30 ring-offset-1 ring-offset-[#1a2638]">
            <div className="w-8 h-8 rounded-full bg-[hsl(208,92%,48%)] flex items-center justify-center text-white text-xs font-bold hover:bg-[hsl(208,92%,55%)] transition-colors select-none">
              {initials}
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 shadow-xl border-border/60">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold truncate">{profile?.full_name ?? 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <span className="mt-1.5 inline-flex w-fit text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold capitalize tracking-wide">
                {profile?.company_role || 'user'}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="text-destructive focus:text-destructive cursor-pointer gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
