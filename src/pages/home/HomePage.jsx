import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import {
  Plus, FolderOpen, BarChart3, FileText, AlertCircle,
  Building2, ChevronRight, Clock, Activity, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { WeatherWidget } from '../../components/shared/WeatherWidget';

const STAGES = ['bidding', 'pre-construction', 'course of construction', 'post-construction', 'warranty'];

const STAGE_STYLES = {
  'bidding':                { dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  'pre-construction':       { dot: 'bg-blue-400',    badge: 'bg-blue-50 text-blue-700 ring-blue-200' },
  'course of construction': { dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  'post-construction':      { dot: 'bg-purple-400',  badge: 'bg-purple-50 text-purple-700 ring-purple-200' },
  'warranty':               { dot: 'bg-orange-400',  badge: 'bg-orange-50 text-orange-700 ring-orange-200' },
};

const ACTIVITY_TYPE_STYLES = {
  rfi:       { color: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60',     label: 'RFI' },
  submittal: { color: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200/60', label: 'Submittal' },
  task:      { color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',   label: 'Task' },
  project:   { color: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200/60',     label: 'Project' },
};

// ─── New Project Dialog ───────────────────────────
function NewProjectDialog({ open, onOpenChange, onCreated }) {
  const { user } = useAuth();
  const { addProject } = useData();
  const blank = { name: '', jobNumber: '', address: '', city: '', state: '', zip: '', county: '', stage: 'pre-construction', description: '', sector: '', contractValue: '' };
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Project name is required'); return; }
    setLoading(true);
    const project = addProject({ ...form, contractValue: parseFloat(form.contractValue) || 0 }, user?.id);
    toast.success('Project created');
    onOpenChange(false);
    setForm(blank);
    setLoading(false);
    if (onCreated) onCreated(project);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Project name *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Downtown Office Tower" autoFocus required />
            </div>
            <div className="space-y-1.5">
              <Label>Job number</Label>
              <Input value={form.jobNumber} onChange={e => set('jobNumber', e.target.value)} placeholder="2025-001" />
            </div>
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select value={form.stage} onValueChange={v => set('stage', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address" />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input value={form.state} onChange={e => set('state', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Zip</Label>
              <Input value={form.zip} onChange={e => set('zip', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>County</Label>
              <Input value={form.county} onChange={e => set('county', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Sector</Label>
              <Input value={form.sector} onChange={e => set('sector', e.target.value)} placeholder="e.g. Commercial" />
            </div>
            <div className="space-y-1.5">
              <Label>Contract value ($)</Label>
              <Input type="number" value={form.contractValue} onChange={e => set('contractValue', e.target.value)} placeholder="0" min="0" step="1000" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Optional" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create Project'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Stat Card ────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconColor, accentBar, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl overflow-hidden text-left transition-all hover:shadow-md shadow-sm ring-1 ring-black/[0.04] w-full ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {accentBar && <div className={`h-[3px] w-full ${accentBar}`} />}
      <div className="flex items-start justify-between p-5">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground mb-2.5 uppercase tracking-widest">{label}</p>
          <p className="text-[26px] font-bold tracking-tight text-foreground leading-none">{value}</p>
        </div>
        <div className={`p-2 rounded-md ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </button>
  );
}

// ─── Project Card ─────────────────────────────────
function ProjectCard({ project, onClick }) {
  const style = STAGE_STYLES[project.stage] || { dot: 'bg-gray-300', badge: 'bg-gray-50 text-gray-600 ring-gray-200' };
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm ring-1 ring-black/[0.04] p-5 text-left hover:shadow-md transition-all group w-full"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
            {project.name}
          </p>
          {project.jobNumber && (
            <p className="text-xs text-muted-foreground mt-0.5">#{project.jobNumber}</p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
      </div>

      {(project.address || project.city) && (
        <p className="text-xs text-muted-foreground mt-2.5 truncate">
          {[project.address, project.city, project.state].filter(Boolean).join(', ')}
        </p>
      )}

      <div className="flex items-center justify-between mt-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ring-1 capitalize ${style.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          {project.stage}
        </span>
        {project.contractValue > 0 && (
          <span className="text-xs font-semibold text-muted-foreground">
            ${project.contractValue >= 1000000
              ? `${(project.contractValue / 1000000).toFixed(1)}M`
              : project.contractValue >= 1000
              ? `${(project.contractValue / 1000).toFixed(0)}K`
              : project.contractValue.toLocaleString()}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────
export function HomePage() {
  const { user } = useAuth();
  const { projects, projectMembers, rfis, submittals, activityFeed, getUserProjects } = useData();
  const navigate = useNavigate();

  const [stageFilter, setStageFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [activityFilter, setActivityFilter] = useState([]);
  const [showNewProject, setShowNewProject] = useState(false);

  const userProjects = useMemo(() => getUserProjects(user?.id), [projects, projectMembers, user?.id]);
  const userProjectIds = useMemo(() => new Set(userProjects.map(p => p.id)), [userProjects]);

  const filteredProjects = useMemo(() => {
    let list = userProjects;
    if (stageFilter !== 'all') list = list.filter(p => p.stage === stageFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.jobNumber?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [userProjects, stageFilter, search]);

  const filteredActivity = useMemo(() => {
    let feed = activityFeed.filter(a => userProjectIds.has(a.projectId));
    if (activityFilter.length > 0) feed = feed.filter(a => activityFilter.includes(a.projectId));
    return feed.slice(0, 40);
  }, [activityFeed, userProjectIds, activityFilter]);

  const openRfis = rfis.filter(r => userProjectIds.has(r.projectId) && r.status === 'open').length;
  const openSubmittals = submittals.filter(s => userProjectIds.has(s.projectId) && s.status === 'open').length;
  const portfolioValue = userProjects.reduce((sum, p) => sum + (p.contractValue || 0), 0);

  const getProjectName = (id) => projects.find(p => p.id === id)?.name ?? 'Unknown';

  const toggleActivityFilter = (id) => {
    setActivityFilter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const fmtValue = (v) => {
    if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
    return `$${v.toLocaleString()}`;
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Portfolio Overview</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {userProjects.length} project{userProjects.length !== 1 ? 's' : ''} in your portfolio
            </p>
          </div>
          <Button size="sm" onClick={() => setShowNewProject(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Active Projects"
            value={userProjects.length}
            icon={FolderOpen}
            iconColor="bg-blue-50 text-blue-600"
            accentBar="bg-blue-500"
          />
          <StatCard
            label="Portfolio Value"
            value={fmtValue(portfolioValue)}
            icon={BarChart3}
            iconColor="bg-emerald-50 text-emerald-600"
            accentBar="bg-emerald-500"
          />
          <StatCard
            label="Open RFIs"
            value={openRfis}
            icon={FileText}
            iconColor="bg-amber-50 text-amber-600"
            accentBar="bg-amber-500"
          />
          <StatCard
            label="Open Submittals"
            value={openSubmittals}
            icon={AlertCircle}
            iconColor="bg-violet-50 text-violet-600"
            accentBar="bg-violet-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {['all', ...STAGES].map(stage => (
            <button
              key={stage}
              onClick={() => setStageFilter(stage)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
                stageFilter === stage
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white shadow-sm text-muted-foreground hover:text-foreground hover:shadow'
              }`}
            >
              {stage === 'all' ? 'All Stages' : stage}
            </button>
          ))}
          <div className="ml-auto">
            <Input
              placeholder="Search projects…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 w-48 text-sm bg-white"
            />
          </div>
        </div>

        {/* Project grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-3">
              <Building2 className="h-6 w-6 text-blue-500" />
            </div>
            <p className="font-medium text-sm">
              {userProjects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
            </p>
            {userProjects.length === 0 && (
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowNewProject(true)}>
                <Plus className="h-4 w-4 mr-1" /> Create your first project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => navigate(`/projects/${project.id}/home`)}
              />
            ))}
          </div>
        )}

        {/* Weather */}
        <WeatherWidget />

        {/* Activity Feed */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-black/[0.04]">
          {/* Feed header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Activity Feed</h2>
            </div>
            {/* Project filter chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {userProjects.slice(0, 5).map(p => (
                <button
                  key={p.id}
                  onClick={() => toggleActivityFilter(p.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    activityFilter.includes(p.id)
                      ? 'bg-primary text-white border-primary'
                      : 'text-muted-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {p.name}
                </button>
              ))}
              {activityFilter.length > 0 && (
                <button
                  onClick={() => setActivityFilter([])}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 ml-1"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Feed items */}
          {filteredActivity.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 mb-2">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              <p>No activity yet. Start by creating RFIs, tasks, or submittals.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredActivity.map(entry => {
                const typeStyle = ACTIVITY_TYPE_STYLES[entry.type] || ACTIVITY_TYPE_STYLES.project;
                return (
                  <div key={entry.id} className="flex items-start gap-3 px-5 py-3.5">
                    <span className={`mt-0.5 flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${typeStyle.color}`}>
                      {typeStyle.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{entry.details}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <button
                          className="text-xs text-primary hover:underline truncate max-w-[160px]"
                          onClick={() => navigate(`/projects/${entry.projectId}/home`)}
                        >
                          {getProjectName(entry.projectId)}
                        </button>
                        <span className="text-muted-foreground text-xs">·</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <NewProjectDialog
        open={showNewProject}
        onOpenChange={setShowNewProject}
        onCreated={p => navigate(`/projects/${p.id}/home`)}
      />
    </div>
  );
}
