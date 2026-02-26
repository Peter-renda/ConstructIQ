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
    <header className="h-14 border-b border-border/60 bg-white/90 backdrop-blur-md flex items-center px-4 sm:px-5 gap-2 sm:gap-3 sticky top-0 z-40 shadow-[0_1px_3px_0_rgb(0,0,0,0.06)]">
      {/* Logo */}
      <button
        onClick={() => navigate('/home')}
        className="flex items-center gap-2 font-semibold text-primary text-base hover:opacity-80 transition-all duration-150 flex-shrink-0"
      >
        <div className="w-7 h-7 bg-gradient-to-br from-primary to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <span className="tracking-tight hidden xs:inline sm:inline">ConstructIQ</span>
      </button>

      {/* Project breadcrumb — hidden on very small screens */}
      {project && (
        <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground ml-1 min-w-0">
          <ChevronRight className="h-3.5 w-3.5 opacity-40 flex-shrink-0" />
          <button
            onClick={() => navigate(`/projects/${project.id}/home`)}
            className="hover:text-foreground transition-colors truncate max-w-[160px] font-medium"
          >
            {project.name}
          </button>
        </div>
      )}

      <div className="flex-1" />

      {/* User avatar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 rounded-full">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white text-xs font-semibold hover:opacity-90 transition-all duration-150 shadow-sm">
              {initials}
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 shadow-lg">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold truncate">{profile?.full_name ?? 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <span className="mt-1 inline-flex w-fit text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium capitalize">
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
