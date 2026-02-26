import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useState, useMemo, useEffect } from 'react';
import { WeatherWidget } from '../../components/shared/WeatherWidget';
import {
  Home, BarChart2, FolderOpen, Users, CheckSquare, Settings,
  FileQuestion, ClipboardList, Send, List, Calendar, BookOpen,
  Camera, FileImage, FileText, DollarSign, PieChart, Layers,
  GitMerge, Zap, Menu, X,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Core Tools',
    items: [
      { label: 'Home', path: 'home', icon: Home },
      { label: 'Reporting', path: 'reporting', icon: BarChart2 },
      { label: 'Documents', path: 'documents', icon: FolderOpen },
      { label: 'Directory', path: 'directory', icon: Users },
      { label: 'Tasks', path: 'tasks', icon: CheckSquare },
      { label: 'Admin', path: 'admin', icon: Settings },
    ],
  },
  {
    label: 'Project Tools',
    items: [
      { label: 'RFIs', path: 'rfis', icon: FileQuestion },
      { label: 'Submittals', path: 'submittals', icon: ClipboardList },
      { label: 'Transmittals', path: 'transmittals', icon: Send },
      { label: 'Punch List', path: 'punch-list', icon: List },
      { label: 'Meetings', path: 'meetings', icon: Calendar },
      { label: 'Schedule', path: 'schedule', icon: Calendar },
      { label: 'Daily Log', path: 'daily-log', icon: BookOpen },
      { label: 'Photos', path: 'photos', icon: Camera },
      { label: 'Drawings', path: 'drawings', icon: FileImage },
      { label: 'Specifications', path: 'specifications', icon: FileText },
    ],
  },
  {
    label: 'Financial',
    items: [
      { label: 'Prime Contracts', path: 'prime-contracts', icon: DollarSign },
      { label: 'Budget', path: 'budget', icon: PieChart },
      { label: 'Commitments', path: 'commitments', icon: Layers },
      { label: 'Change Orders', path: 'change-orders', icon: GitMerge },
      { label: 'Change Events', path: 'change-events', icon: Zap },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap(g => g.items);

export function ProjectLayout() {
  const { projectId } = useParams();
  const { projects } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);

  const currentPath = useMemo(() => {
    const parts = location.pathname.split('/');
    return parts[parts.length - 1];
  }, [location.pathname]);

  const currentItem = ALL_ITEMS.find(i => i.path === currentPath);

  // Close sidebar when route changes
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (sidebarOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const go = (path) => navigate(`/projects/${projectId}/${path}`);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm px-4 text-center">
        Project not found.{' '}
        <button className="text-primary hover:underline ml-1" onClick={() => navigate('/home')}>
          Return home
        </button>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      {/* Project identity */}
      <div className="px-4 pt-4 pb-3.5 border-b border-border/60 flex items-start justify-between gap-2 bg-white">
        <div className="min-w-0">
          {project.jobNumber && (
            <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1 truncate">
              #{project.jobNumber}
            </p>
          )}
          <p className="text-[13px] font-bold text-foreground leading-snug line-clamp-2">
            {project.name}
          </p>
          {project.stage && (
            <p className="text-[11px] text-muted-foreground mt-1 capitalize font-medium">{project.stage}</p>
          )}
        </div>
        {/* Close button — mobile only */}
        <button
          className="md:hidden flex-shrink-0 mt-0.5 p-1 rounded hover:bg-muted transition-colors"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-6 overflow-y-auto scrollbar-thin">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-4 mb-1.5">
              {group.label}
            </p>
            <ul className="space-y-px">
              {group.items.map(item => {
                const isActive = currentPath === item.path;
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => go(item.path)}
                      className={`w-full flex items-center gap-2.5 pr-3 py-[7px] text-[13px] transition-colors text-left ${
                        isActive
                          ? 'border-l-[3px] border-primary pl-[13px] text-primary font-semibold bg-primary/[0.07]'
                          : 'border-l-[3px] border-transparent pl-[13px] text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
                      }`}
                    >
                      <item.icon className={`h-[15px] w-[15px] flex-shrink-0 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <div className="flex h-[calc(100vh-52px)] relative overflow-hidden">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed overlay on mobile, static on desktop */}
      <aside
        className={`
          fixed md:static top-[52px] left-0 z-40
          h-[calc(100vh-52px)] md:h-full
          w-64 md:w-56 flex-shrink-0
          border-r bg-white flex flex-col
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50 min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-20 bg-white border-b px-4 py-2.5 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors -ml-1"
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <span className="text-sm font-semibold truncate">
            {currentItem?.label ?? project.name}
          </span>
        </div>

        <Outlet />
        <div className="px-4 sm:px-6 pb-6">
          <WeatherWidget zip={project.zip} city={project.city} state={project.state} />
        </div>
      </main>
    </div>
  );
}
