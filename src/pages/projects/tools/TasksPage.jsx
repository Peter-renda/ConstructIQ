import { useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../../contexts/DataContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { Plus, Download, Paperclip, X, Pencil, Trash2, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

const TASK_STATUSES = ['open', 'in progress', 'closed'];
const TASK_CATEGORIES = ['administrative', 'closeout', 'contract', 'design', 'miscellaneous', 'construction'];

const STATUS_COLORS = {
  'open':        'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/60',
  'in progress': 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/60',
  'closed':      'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/60',
};

function TaskForm({ open, onOpenChange, onSubmit, initialData, users, nextNumber }) {
  const [form, setForm] = useState(initialData || {
    taskNumber: nextNumber, title: '', status: 'open',
    category: 'miscellaneous', distributionList: [], description: '', attachments: [],
  });
  const imgRef = useRef(null);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleDist = (id) => setForm(p => ({
    ...p,
    distributionList: p.distributionList.includes(id)
      ? p.distributionList.filter(x => x !== id)
      : [...p.distributionList, id],
  }));

  const handleAttach = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(p => ({ ...p, attachments: [...p.attachments, { name: file.name, dataUrl: ev.target.result }] }));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    onSubmit(form);
    onOpenChange(false);
    setForm({ taskNumber: nextNumber + 1, title: '', status: 'open', category: 'miscellaneous', distributionList: [], description: '', attachments: [] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{initialData ? 'Edit Task' : 'New Task'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Task #</Label>
              <Input type="number" value={form.taskNumber} onChange={e => set('taskNumber', parseInt(e.target.value) || nextNumber)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TASK_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task title" required />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={v => set('category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TASK_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Distribution List</Label>
            <div className="border rounded-lg max-h-36 overflow-y-auto divide-y text-sm">
              {users.length === 0
                ? <p className="text-muted-foreground p-3 text-sm">No users in directory</p>
                : users.map(u => (
                  <label key={u.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={form.distributionList.includes(u.id)} onChange={() => toggleDist(u.id)} className="rounded" />
                    <span>{[u.firstName, u.lastName].filter(Boolean).join(' ')} — {u.email}</span>
                  </label>
                ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Details…" />
          </div>
          <div className="space-y-1.5">
            <Label>Attach Image</Label>
            <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleAttach} />
            <Button type="button" variant="outline" size="sm" onClick={() => imgRef.current?.click()}>
              <Paperclip className="h-3.5 w-3.5 mr-1.5" /> Attach Image
            </Button>
            {form.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2 py-1 text-xs">
                    {att.dataUrl?.startsWith('data:image') && <img src={att.dataUrl} alt="" className="h-6 w-6 object-cover rounded" />}
                    <span className="max-w-[100px] truncate">{att.name}</span>
                    <button type="button" onClick={() => setForm(p => ({ ...p, attachments: p.attachments.filter((_, j) => j !== i) }))}>
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{initialData ? 'Save' : 'Create Task'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TasksPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { tasks, dirUsers, addTask, updateTask, deleteTask } = useData();

  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const projectTasks = useMemo(() =>
    tasks.filter(t => t.projectId === projectId).sort((a, b) => a.taskNumber - b.taskNumber),
    [tasks, projectId]
  );
  const projectUsers = useMemo(() => dirUsers.filter(u => u.projectId === projectId), [dirUsers, projectId]);
  const nextNumber = useMemo(() => projectTasks.reduce((m, t) => Math.max(m, t.taskNumber || 0), 0) + 1, [projectTasks]);

  const filtered = useMemo(() => {
    let list = projectTasks;
    if (statusFilter !== 'all') list = list.filter(t => t.status === statusFilter);
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter(t => t.title?.toLowerCase().includes(q) || String(t.taskNumber).includes(q)); }
    return list;
  }, [projectTasks, statusFilter, search]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text('Task List', 14, 20);
    doc.setFontSize(10); let y = 32;
    filtered.forEach(t => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`#${t.taskNumber}  ${t.title}  [${t.status}]  ${t.category}`, 14, y); y += 7;
    });
    doc.save('tasks.pdf');
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-lg font-bold tracking-tight">Tasks</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export PDF
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> New Task
          </Button>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <Input placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} className="h-8 w-44 text-sm" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {TASK_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-3">
            <CheckSquare className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-sm font-medium">{projectTasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}</p>
          {projectTasks.length === 0 && <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" /> Create first task</Button>}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-black/[0.04] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-12">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Created</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/60 group transition-colors">
                    <td className="px-4 py-3 font-mono text-muted-foreground text-xs">{t.taskNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{t.title}</p>
                      {t.description && <p className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5">{t.description}</p>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="capitalize text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`capitalize text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[t.status] || 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-200/60'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                      {format(new Date(t.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setEditTask(t)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive" onClick={() => setConfirmDelete(t)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TaskForm
        open={showForm || !!editTask}
        onOpenChange={v => { if (!v) { setShowForm(false); setEditTask(null); } }}
        initialData={editTask}
        users={projectUsers}
        nextNumber={nextNumber}
        onSubmit={data => {
          if (editTask) { updateTask(editTask.id, data, user?.id); toast.success('Task updated'); setEditTask(null); }
          else { addTask(projectId, data, user?.id); toast.success('Task created'); }
        }}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={v => !v && setConfirmDelete(null)}
        title={`Delete Task #${confirmDelete?.taskNumber}?`}
        description="This action cannot be undone."
        onConfirm={() => { deleteTask(confirmDelete.id); toast.success('Deleted'); setConfirmDelete(null); }}
        confirmLabel="Delete" variant="destructive"
      />
    </div>
  );
}
