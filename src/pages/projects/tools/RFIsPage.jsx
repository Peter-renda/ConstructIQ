import { useState, useMemo, useRef, useEffect } from 'react';
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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { Plus, Download, FileQuestion, Pencil, ChevronLeft, Paperclip, X, Settings2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-800',
  closed: 'bg-green-100 text-green-800',
  draft: 'bg-gray-100 text-gray-700',
};

const ALL_COLUMNS = [
  { key: 'rfiNumber', label: '#' },
  { key: 'subject', label: 'Subject' },
  { key: 'status', label: 'Status' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'rfiManager', label: 'RFI Manager' },
  { key: 'receivedFrom', label: 'Received From' },
  { key: 'assignees', label: 'Assignees' },
  { key: 'responsibleContractor', label: 'Responsible Contractor' },
  { key: 'drawingNumber', label: 'Drawing #' },
  { key: 'createdAt', label: 'Created' },
];

const BLANK_FORM = {
  rfiNumber: 1,
  subject: '',
  question: '',
  attachments: [],
  dueDate: '',
  rfiManager: '',
  receivedFrom: '',
  assignees: [],
  distributionList: [],
  responsibleContractor: '',
  specification: '',
  drawingNumber: '',
};

// ─── RFI Form ─────────────────────────────────────
function RFIForm({ open, onOpenChange, onSubmit, initialData, users, companies, specs, nextNumber }) {
  const [form, setForm] = useState({ ...BLANK_FORM, rfiNumber: nextNumber });
  const fileRef = useRef(null);

  // Reset form whenever the dialog opens
  useEffect(() => {
    if (open) {
      setForm(initialData
        ? { ...BLANK_FORM, ...initialData }
        : { ...BLANK_FORM, rfiNumber: nextNumber }
      );
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Radix Select v2 does not allow value="". Use sentinel "__none__" ↔ ""
  const selectVal = (v) => v || '__none__';
  const fromSelect = (v) => v === '__none__' ? '' : v;

  const toggleList = (key, id) => {
    setForm(p => ({
      ...p,
      [key]: p[key].includes(id) ? p[key].filter(x => x !== id) : [...p[key], id],
    }));
  };

  const handleAttach = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        setForm(p => ({
          ...p,
          attachments: [...p.attachments, { name: file.name, size: file.size, dataUrl: ev.target.result }],
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    Array.from(e.dataTransfer.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        setForm(p => ({
          ...p,
          attachments: [...p.attachments, { name: file.name, size: file.size, dataUrl: ev.target.result }],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (status) => {
    if (!form.subject.trim()) { toast.error('Subject is required'); return; }
    if (form.subject.length > 200) { toast.error('Subject cannot exceed 200 characters'); return; }
    onSubmit({ ...form, status });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit RFI' : 'Create New RFI'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">

          {/* Row 1: RFI Number + Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>RFI Number</Label>
              <Input
                type="number"
                value={form.rfiNumber}
                onChange={e => set('rfiNumber', parseInt(e.target.value) || nextNumber)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label>
              Subject *{' '}
              <span className="text-xs text-muted-foreground font-normal">({form.subject.length}/200)</span>
            </Label>
            <Input
              value={form.subject}
              onChange={e => set('subject', e.target.value.slice(0, 200))}
              placeholder="Brief description of the RFI"
              maxLength={200}
            />
          </div>

          {/* Question */}
          <div className="space-y-1.5">
            <Label>Question</Label>
            <Textarea
              value={form.question}
              onChange={e => set('question', e.target.value)}
              placeholder="Describe the question in detail..."
              rows={4}
            />
          </div>

          {/* Attachment Drop Zone */}
          <div className="space-y-1.5">
            <Label>Attachments</Label>
            <div
              className="border-2 border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground cursor-pointer hover:border-primary hover:text-primary transition-colors"
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip className="h-5 w-5 mx-auto mb-1" />
              Drop files here or click to attach
            </div>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={handleAttach} />
            {form.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-muted/50 rounded px-2 py-1 text-xs">
                    <span className="max-w-[150px] truncate">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, attachments: p.attachments.filter((_, j) => j !== i) }))}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RFI Manager + Received From */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>RFI Manager</Label>
              <Select value={selectVal(form.rfiManager)} onValueChange={v => set('rfiManager', fromSelect(v))}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {[u.firstName, u.lastName].filter(Boolean).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Received From</Label>
              <Select value={selectVal(form.receivedFrom)} onValueChange={v => set('receivedFrom', fromSelect(v))}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {[u.firstName, u.lastName].filter(Boolean).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Responsible Contractor */}
          <div className="space-y-1.5">
            <Label>Responsible Contractor</Label>
            <Select value={selectVal(form.responsibleContractor)} onValueChange={v => set('responsibleContractor', fromSelect(v))}>
              <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Specification + Drawing Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Specification</Label>
              {specs.length > 0 ? (
                <Select value={selectVal(form.specification)} onValueChange={v => set('specification', fromSelect(v))}>
                  <SelectTrigger><SelectValue placeholder="Select specification" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {specs.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.number} — {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={form.specification}
                  onChange={e => set('specification', e.target.value)}
                  placeholder="Add specs in Admin first"
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Drawing Number</Label>
              <Input
                value={form.drawingNumber}
                onChange={e => set('drawingNumber', e.target.value)}
                placeholder="e.g. A-101"
              />
            </div>
          </div>

          {/* Assignees */}
          <div className="space-y-1.5">
            <Label>Assignees</Label>
            <div className="border rounded-md max-h-36 overflow-y-auto divide-y">
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3">No users in directory</p>
              ) : users.map(u => (
                <label key={u.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/30">
                  <input
                    type="checkbox"
                    checked={form.assignees.includes(u.id)}
                    onChange={() => toggleList('assignees', u.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{[u.firstName, u.lastName].filter(Boolean).join(' ')} — {u.email}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Distribution List */}
          <div className="space-y-1.5">
            <Label>Distribution List</Label>
            <div className="border rounded-md max-h-36 overflow-y-auto divide-y">
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3">No users in directory</p>
              ) : users.map(u => (
                <label key={u.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/30">
                  <input
                    type="checkbox"
                    checked={form.distributionList.includes(u.id)}
                    onChange={() => toggleList('distributionList', u.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{[u.firstName, u.lastName].filter(Boolean).join(' ')} — {u.email}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            {!initialData && (
              <Button type="button" variant="outline" onClick={() => handleSubmit('draft')}>
                Save as Draft
              </Button>
            )}
            <Button type="button" onClick={() => handleSubmit(initialData ? form.status || 'open' : 'open')}>
              {initialData ? 'Save Changes' : 'Create as Open'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── RFI Detail View ──────────────────────────────
function RFIDetail({ rfi, onClose, users, companies, specs, currentUserId }) {
  const [responseText, setResponseText] = useState('');
  const { addRfiResponse } = useData();

  const getUserName = (id) => {
    if (!id) return '—';
    const u = users.find(u => u.id === id);
    return u ? [u.firstName, u.lastName].filter(Boolean).join(' ') : '—';
  };

  const getCompanyName = (id) => {
    if (!id) return '—';
    return companies.find(c => c.id === id)?.name ?? '—';
  };

  const getSpecLabel = (id) => {
    if (!id) return '—';
    const s = specs.find(s => s.id === id);
    return s ? `${s.number} — ${s.title}` : id;
  };

  const isAssignee = rfi.assignees?.includes(currentUserId);

  const handleResponse = () => {
    if (!responseText.trim()) { toast.error('Response cannot be empty'); return; }
    addRfiResponse(rfi.id, { text: responseText, authorId: currentUserId }, currentUserId);
    setResponseText('');
    toast.success('Response added');
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={onClose}>
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to RFIs
      </Button>

      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h2 className="text-xl font-bold">{rfi.subject}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">RFI #{rfi.rfiNumber}</p>
        </div>
        <span className={`text-sm px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[rfi.status] || 'bg-gray-100 text-gray-700'}`}>
          {rfi.status}
        </span>
      </div>

      {rfi.question && (
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">Question</h3>
          <div className="bg-muted/30 rounded-lg p-4 text-sm whitespace-pre-wrap">{rfi.question}</div>
        </div>
      )}

      {rfi.attachments?.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">Attachments</h3>
          <div className="flex flex-wrap gap-2">
            {rfi.attachments.map((att, i) => (
              <a
                key={i}
                href={att.dataUrl}
                download={att.name}
                className="flex items-center gap-1.5 bg-muted/50 rounded px-2 py-1 text-xs hover:bg-muted transition-colors"
              >
                <Paperclip className="h-3 w-3" />
                {att.name}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Responses */}
      <div>
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Responses</h3>
        {(rfi.responses || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No responses yet.</p>
        ) : (
          <div className="space-y-3">
            {rfi.responses.map(r => (
              <div key={r.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{getUserName(r.authorId)}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(r.createdAt), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{r.text}</p>
              </div>
            ))}
          </div>
        )}
        {isAssignee ? (
          <div className="mt-4 space-y-2">
            <Label className="text-sm">Add Response</Label>
            <Textarea
              value={responseText}
              onChange={e => setResponseText(e.target.value)}
              placeholder="Type your response..."
              rows={3}
            />
            <Button size="sm" onClick={handleResponse}>Submit Response</Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-2 italic">Only assignees can respond to this RFI.</p>
        )}
      </div>

      {/* General Info */}
      <div>
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">General Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Due Date', value: rfi.dueDate || '—' },
            { label: 'RFI Manager', value: getUserName(rfi.rfiManager) },
            { label: 'Received From', value: getUserName(rfi.receivedFrom) },
            { label: 'Responsible Contractor', value: getCompanyName(rfi.responsibleContractor) },
            { label: 'Specification', value: getSpecLabel(rfi.specification) },
            { label: 'Drawing Number', value: rfi.drawingNumber || '—' },
            { label: 'Created', value: format(new Date(rfi.createdAt), 'MMM d, yyyy') },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium mt-0.5">{value}</p>
            </div>
          ))}
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground">Assignees</p>
            <p className="font-medium mt-0.5">
              {rfi.assignees?.length ? rfi.assignees.map(id => getUserName(id)).join(', ') : '—'}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground">Distribution List</p>
            <p className="font-medium mt-0.5">
              {rfi.distributionList?.length ? rfi.distributionList.map(id => getUserName(id)).join(', ') : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main RFIs Page ───────────────────────────────
export function RFIsPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { rfis, dirUsers, dirCompanies, specifications, addRfi, updateRfi, deleteRfi } = useData();

  const [showForm, setShowForm] = useState(false);
  const [editRfi, setEditRfi] = useState(null);
  const [viewRfi, setViewRfi] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [visibleColumns, setVisibleColumns] = useState(['rfiNumber', 'subject', 'status', 'dueDate', 'rfiManager', 'createdAt']);

  const projectRfis = useMemo(() =>
    rfis.filter(r => r.projectId === projectId).sort((a, b) => a.rfiNumber - b.rfiNumber),
    [rfis, projectId]
  );

  const projectUsers = useMemo(() => dirUsers.filter(u => u.projectId === projectId), [dirUsers, projectId]);
  const projectCompanies = useMemo(() => dirCompanies.filter(c => c.projectId === projectId), [dirCompanies, projectId]);
  const projectSpecs = useMemo(() => specifications.filter(s => s.projectId === projectId), [specifications, projectId]);

  const nextNumber = useMemo(() =>
    projectRfis.reduce((m, r) => Math.max(m, r.rfiNumber || 0), 0) + 1,
    [projectRfis]
  );

  const filtered = useMemo(() => {
    let list = projectRfis;
    if (statusFilter !== 'all') list = list.filter(r => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => r.subject?.toLowerCase().includes(q) || String(r.rfiNumber).includes(q));
    }
    return list;
  }, [projectRfis, statusFilter, search]);

  const getUserName = (id) => {
    if (!id) return '—';
    const u = projectUsers.find(u => u.id === id);
    return u ? [u.firstName, u.lastName].filter(Boolean).join(' ') : '—';
  };

  const getSpecLabel = (id) => {
    if (!id) return '—';
    const s = projectSpecs.find(s => s.id === id);
    return s ? `${s.number} — ${s.title}` : id;
  };

  const exportPDF = (rfi) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`RFI #${rfi.rfiNumber}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Subject: ${rfi.subject}`, 14, 32);
    doc.text(`Status: ${rfi.status}`, 14, 40);
    doc.text(`Due Date: ${rfi.dueDate || 'N/A'}`, 14, 48);
    doc.text(`Question:`, 14, 58);
    const lines = doc.splitTextToSize(rfi.question || '', 180);
    doc.setFontSize(10);
    doc.text(lines, 14, 66);
    doc.save(`RFI-${rfi.rfiNumber}.pdf`);
  };

  const toggleColumn = (key) => {
    setVisibleColumns(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const getCellValue = (rfi, key) => {
    switch (key) {
      case 'rfiNumber': return `#${rfi.rfiNumber}`;
      case 'subject': return (
        <span className="font-medium text-primary hover:underline">{rfi.subject}</span>
      );
      case 'status': return (
        <span className={`capitalize text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[rfi.status] || ''}`}>
          {rfi.status}
        </span>
      );
      case 'dueDate': return rfi.dueDate || '—';
      case 'rfiManager': return getUserName(rfi.rfiManager);
      case 'receivedFrom': return getUserName(rfi.receivedFrom);
      case 'assignees': return rfi.assignees?.map(id => getUserName(id)).join(', ') || '—';
      case 'responsibleContractor': return projectCompanies.find(c => c.id === rfi.responsibleContractor)?.name || '—';
      case 'drawingNumber': return rfi.drawingNumber || '—';
      case 'createdAt': return format(new Date(rfi.createdAt), 'MMM d, yyyy');
      default: return '—';
    }
  };

  if (viewRfi) {
    const currentRfi = rfis.find(r => r.id === viewRfi.id) || viewRfi;
    return (
      <RFIDetail
        rfi={currentRfi}
        onClose={() => setViewRfi(null)}
        users={projectUsers}
        companies={projectCompanies}
        specs={projectSpecs}
        currentUserId={user?.id}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-lg font-semibold">RFIs</h2>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="h-4 w-4 mr-1.5" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {ALL_COLUMNS.map(col => (
                <DropdownMenuItem
                  key={col.key}
                  onClick={() => toggleColumn(col.key)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(col.key)}
                    onChange={() => {}}
                    className="rounded"
                  />
                  {col.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={() => { setEditRfi(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Create RFI
          </Button>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <Input
          placeholder="Search RFIs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 w-52 text-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl text-muted-foreground">
          <FileQuestion className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{projectRfis.length === 0 ? 'No RFIs yet' : 'No RFIs match your filters'}</p>
          {projectRfis.length === 0 && (
            <Button variant="outline" className="mt-3" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" /> Create first RFI
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b bg-muted/30">
                  {ALL_COLUMNS.filter(c => visibleColumns.includes(c.key)).map(col => (
                    <th key={col.key} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(rfi => (
                  <tr
                    key={rfi.id}
                    className="hover:bg-muted/20 group cursor-pointer"
                    onClick={() => setViewRfi(rfi)}
                  >
                    {ALL_COLUMNS.filter(c => visibleColumns.includes(c.key)).map(col => (
                      <td key={col.key} className="px-4 py-2.5 max-w-xs truncate">
                        {getCellValue(rfi, col.key)}
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100">
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => { setEditRfi(rfi); setShowForm(true); }}
                          title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => exportPDF(rfi)}
                          title="Export PDF">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          onClick={() => setConfirmDelete(rfi)}
                          title="Delete">
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

      <RFIForm
        open={showForm}
        onOpenChange={v => { if (!v) { setShowForm(false); setEditRfi(null); } }}
        initialData={editRfi}
        users={projectUsers}
        companies={projectCompanies}
        specs={projectSpecs}
        nextNumber={nextNumber}
        onSubmit={(data) => {
          if (editRfi) {
            updateRfi(editRfi.id, data, user?.id);
            toast.success('RFI updated');
            setEditRfi(null);
          } else {
            addRfi(projectId, data, user?.id);
            toast.success(`RFI created as ${data.status}`);
          }
        }}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={v => !v && setConfirmDelete(null)}
        title={`Delete RFI #${confirmDelete?.rfiNumber}?`}
        description="This will permanently delete this RFI and all its responses."
        onConfirm={() => { deleteRfi(confirmDelete.id); toast.success('RFI deleted'); setConfirmDelete(null); }}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
