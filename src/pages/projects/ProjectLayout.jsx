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
      <div className="px-4 pt-4 pb-3.5 flex items-start justify-between gap-2 border-b border-gray-100">
        <div className="min-w-0">
          {project.jobNumber && (
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1 truncate">
              #{project.jobNumber}
            </p>
          )}
          <p className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2">
            {project.name}
          </p>
          {project.stage && (
            <p className="text-[11px] text-gray-400 mt-1 capitalize">{project.stage}</p>
          )}
        </div>
        <button
          className="md:hidden flex-shrink-0 mt-0.5 p-1 rounded hover:bg-gray-100 transition-colors"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-5 overflow-y-auto scrollbar-thin">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-4 mb-1">
              {group.label}
            </p>
            <ul className="space-y-px">
              {group.items.map(item => {
                const isActive = currentPath === item.path;
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => go(item.path)}
                      className={`w-full flex items-center gap-2.5 pr-3 py-[7px] text-[13px] transition-all text-left ${
                        isActive
                          ? 'border-l-2 border-blue-600 pl-[14px] text-blue-700 font-semibold bg-blue-50'
                          : 'border-l-2 border-transparent pl-[14px] text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className={`h-[14px] w-[14px] flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
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
    <div className="flex h-[calc(100vh-50px)] relative overflow-hidden">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed overlay on mobile, static on desktop */}
      <aside
        className={`
          fixed md:static top-[50px] left-0 z-40
          h-[calc(100vh-50px)] md:h-full
          w-60 md:w-52 flex-shrink-0
          bg-white border-r border-gray-100 flex flex-col
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-2.5 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors -ml-1"
          >
            <Menu className="h-5 w-5 text-gray-500" />
          </button>
          <span className="text-sm font-semibold text-gray-900 truncate">
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
