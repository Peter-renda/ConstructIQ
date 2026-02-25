import { useState, useMemo } from 'react';
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
import { Plus, ClipboardList, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-800',
  closed: 'bg-green-100 text-green-800',
  draft: 'bg-gray-100 text-gray-700',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  'revise and resubmit': 'bg-yellow-100 text-yellow-800',
};

function SubmittalForm({ open, onOpenChange, onSubmit, initialData, users, companies, nextNumber }) {
  const [form, setForm] = useState(initialData || {
    submittalNumber: nextNumber,
    title: '',
    status: 'open',
    type: '',
    specSection: '',
    dueDate: '',
    assignee: '',
    description: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    onSubmit(form);
    onOpenChange(false);
    setForm({ submittalNumber: nextNumber + 1, title: '', status: 'open', type: '', specSection: '', dueDate: '', assignee: '', description: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Submittal' : 'Create Submittal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Submittal #</Label>
              <Input type="number" value={form.submittalNumber} onChange={e => set('submittalNumber', parseInt(e.target.value) || nextNumber)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['open', 'approved', 'rejected', 'revise and resubmit', 'closed', 'draft'].map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Submittal title" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Input value={form.type} onChange={e => set('type', e.target.value)} placeholder="e.g. Shop Drawing" />
            </div>
            <div className="space-y-1.5">
              <Label>Spec Section</Label>
              <Input value={form.specSection} onChange={e => set('specSection', e.target.value)} placeholder="e.g. 03300" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Select value={form.assignee} onValueChange={v => set('assignee', v)}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {[u.firstName, u.lastName].filter(Boolean).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{initialData ? 'Save Changes' : 'Create Submittal'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SubmittalsPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { submittals, dirUsers, dirCompanies, addSubmittal, updateSubmittal, deleteSubmittal } = useData();

  const [showForm, setShowForm] = useState(false);
  const [editSubmittal, setEditSubmittal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const projectSubmittals = useMemo(() =>
    submittals.filter(s => s.projectId === projectId).sort((a, b) => a.submittalNumber - b.submittalNumber),
    [submittals, projectId]
  );

  const projectUsers = useMemo(() => dirUsers.filter(u => u.projectId === projectId), [dirUsers, projectId]);
  const projectCompanies = useMemo(() => dirCompanies.filter(c => c.projectId === projectId), [dirCompanies, projectId]);

  const nextNumber = useMemo(() =>
    projectSubmittals.reduce((m, s) => Math.max(m, s.submittalNumber || 0), 0) + 1,
    [projectSubmittals]
  );

  const filtered = useMemo(() => {
    let list = projectSubmittals;
    if (statusFilter !== 'all') list = list.filter(s => s.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.title?.toLowerCase().includes(q) || String(s.submittalNumber).includes(q));
    }
    return list;
  }, [projectSubmittals, statusFilter, search]);

  const getUserName = (id) => {
    if (!id) return '—';
    const u = projectUsers.find(u => u.id === id);
    return u ? [u.firstName, u.lastName].filter(Boolean).join(' ') : '—';
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-lg font-semibold">Submittals</h2>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Create Submittal
        </Button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <Input
          placeholder="Search submittals..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 w-52 text-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-40 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {['open', 'approved', 'rejected', 'revise and resubmit', 'closed', 'draft'].map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl text-muted-foreground">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{projectSubmittals.length === 0 ? 'No submittals yet' : 'No submittals match filters'}</p>
          {projectSubmittals.length === 0 && (
            <Button variant="outline" className="mt-3" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" /> Create first submittal
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-16">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Assignee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Due Date</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 group transition-colors">
                  <td className="px-4 py-3 font-mono text-muted-foreground text-xs">{s.submittalNumber}</td>
                  <td className="px-4 py-3 font-medium">{s.title}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{s.type || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`capitalize text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status] || 'bg-muted text-muted-foreground'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{getUserName(s.assignee)}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.dueDate || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditSubmittal(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => setConfirmDelete(s)}
                      >
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

      <SubmittalForm
        open={showForm || !!editSubmittal}
        onOpenChange={v => { if (!v) { setShowForm(false); setEditSubmittal(null); } }}
        initialData={editSubmittal}
        users={projectUsers}
        companies={projectCompanies}
        nextNumber={nextNumber}
        onSubmit={(data) => {
          if (editSubmittal) {
            updateSubmittal(editSubmittal.id, data, user?.id);
            toast.success('Submittal updated');
            setEditSubmittal(null);
          } else {
            addSubmittal(projectId, data, user?.id);
            toast.success('Submittal created');
          }
        }}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={v => !v && setConfirmDelete(null)}
        title={`Delete Submittal #${confirmDelete?.submittalNumber}?`}
        description="This action cannot be undone."
        onConfirm={() => { deleteSubmittal(confirmDelete.id); toast.success('Submittal deleted'); setConfirmDelete(null); }}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
