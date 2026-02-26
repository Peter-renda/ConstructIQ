import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../../contexts/DataContext';
import { FileQuestion, ClipboardList, CheckSquare, Activity, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useMemo } from 'react';

const STAGE_STYLES = {
  'bidding':                'bg-amber-50 text-amber-700 ring-amber-200',
  'pre-construction':       'bg-blue-50 text-blue-700 ring-blue-200',
  'course of construction': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'post-construction':      'bg-purple-50 text-purple-700 ring-purple-200',
  'warranty':               'bg-orange-50 text-orange-700 ring-orange-200',
};

const ACTIVITY_TYPE_STYLES = {
  rfi:       'bg-blue-50 text-blue-700',
  submittal: 'bg-violet-50 text-violet-700',
  task:      'bg-amber-50 text-amber-700',
  project:   'bg-slate-100 text-slate-600',
};

function QuickStat({ label, count, total, icon: Icon, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group w-full"
    >
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-2xl font-bold mt-3 tracking-tight">{count}</p>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-0.5">{label}</p>
      {total > 0 && <p className="text-xs text-muted-foreground mt-0.5">{total} total</p>}
    </button>
  );
}

export function ProjectHomePage() {
  const { projectId } = useParams();
  const { projects, rfis, submittals, tasks, activityFeed } = useData();
  const navigate = useNavigate();

  const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);
  const projectRfis = rfis.filter(r => r.projectId === projectId);
  const projectSubmittals = submittals.filter(s => s.projectId === projectId);
  const projectTasks = tasks.filter(t => t.projectId === projectId);
  const projectActivity = activityFeed.filter(a => a.projectId === projectId).slice(0, 15);

  if (!project) return null;

  const openRfis = projectRfis.filter(r => r.status === 'open').length;
  const openSubmittals = projectSubmittals.filter(s => s.status === 'open').length;
  const openTasks = projectTasks.filter(t => t.status === 'open').length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
      {/* Project header */}
      <div>
        <div className="flex items-start gap-3 flex-wrap">
          <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
          {project.stage && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ring-1 capitalize mt-0.5 ${STAGE_STYLES[project.stage] || 'bg-gray-50 text-gray-600 ring-gray-200'}`}>
              {project.stage}
            </span>
          )}
        </div>
        {(project.address || project.city) && (
          <p className="text-sm text-muted-foreground mt-1">
            {[project.address, project.city, project.state, project.zip].filter(Boolean).join(', ')}
          </p>
        )}
        {project.description && (
          <p className="text-sm text-foreground mt-2 leading-relaxed">{project.description}</p>
        )}
        {project.contractValue > 0 && (
          <p className="text-sm font-semibold mt-2">
            ${project.contractValue.toLocaleString()}
            <span className="font-normal text-muted-foreground ml-1">contract value</span>
          </p>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <QuickStat
          label="Open RFIs"
          count={openRfis}
          total={projectRfis.length}
          icon={FileQuestion}
          color="bg-blue-50 text-blue-600"
          onClick={() => navigate(`/projects/${projectId}/rfis`)}
        />
        <QuickStat
          label="Open Submittals"
          count={openSubmittals}
          total={projectSubmittals.length}
          icon={ClipboardList}
          color="bg-violet-50 text-violet-600"
          onClick={() => navigate(`/projects/${projectId}/submittals`)}
        />
        <QuickStat
          label="Open Tasks"
          count={openTasks}
          total={projectTasks.length}
          icon={CheckSquare}
          color="bg-amber-50 text-amber-600"
          onClick={() => navigate(`/projects/${projectId}/tasks`)}
        />
      </div>

      {/* Activity */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b bg-slate-50/50">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Recent Activity</h2>
        </div>
        {projectActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            No activity yet on this project.
          </p>
        ) : (
          <div className="divide-y">
            {projectActivity.map(a => (
              <div key={a.id} className="flex items-start gap-3 px-5 py-3.5">
                <span className={`mt-0.5 flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${ACTIVITY_TYPE_STYLES[a.type] || 'bg-slate-100 text-slate-600'}`}>
                  {a.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{a.details}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
