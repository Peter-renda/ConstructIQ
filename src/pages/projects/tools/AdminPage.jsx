import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../../contexts/DataContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { Pencil, Save, X, Lock, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STAGES = ['bidding', 'pre-construction', 'course of construction', 'post-construction', 'warranty'];

function SectionCard({ title, children, isAdmin, editing, onEdit, onSave, onCancel }) {
  return (
    <div className="bg-white rounded-xl border">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {isAdmin ? (
          <div className="flex gap-2 flex-shrink-0">
            {editing ? (
              <>
                <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 px-2.5 text-xs gap-1">
                  <X className="h-3 w-3" /> Cancel
                </Button>
                <Button size="sm" onClick={onSave} className="h-7 px-2.5 text-xs gap-1">
                  <Save className="h-3 w-3" /> Save
                </Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" onClick={onEdit} className="h-7 px-2.5 text-xs gap-1 text-muted-foreground">
                <Pencil className="h-3 w-3" /> Edit
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
            <Lock className="h-3 w-3" /> Admin only
          </div>
        )}
      </div>
      <div className="px-4 sm:px-6 py-5">{children}</div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-sm">{value || <span className="text-muted-foreground/60 italic">Not set</span>}</p>
    </div>
  );
}

export function AdminPage() {
  const { projectId } = useParams();
  const { user, profile } = useAuth();
  const { projects, updateProject, getProjectRole, specifications, addSpec, updateSpec, deleteSpec } = useData();

  const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);
  const projectRole = getProjectRole(projectId, user?.id);
  const isAdmin = profile?.company_role === 'administrator' || projectRole === 'administrator';

  const [editingGeneral, setEditingGeneral] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [editingDates, setEditingDates] = useState(false);
  const [general, setGeneral] = useState({});
  const [location, setLocation] = useState({});
  const [dates, setDates] = useState({});

  const [showSpecDialog, setShowSpecDialog] = useState(false);
  const [editSpec, setEditSpec] = useState(null);
  const [specForm, setSpecForm] = useState({ number: '', title: '' });
  const [confirmDeleteSpec, setConfirmDeleteSpec] = useState(null);
  const projectSpecs = useMemo(() => specifications.filter(s => s.projectId === projectId).sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })), [specifications, projectId]);

  useEffect(() => {
    if (!project) return;
    setGeneral({ stage: project.stage || 'pre-construction', name: project.name || '', jobNumber: project.jobNumber || '', description: project.description || '', sector: project.sector || '', contractValue: project.contractValue || '' });
    setLocation({ address: project.address || '', city: project.city || '', state: project.state || '', zip: project.zip || '', county: project.county || '' });
    setDates({ startDate: project.startDate || '', actualStartDate: project.actualStartDate || '', completionDate: project.completionDate || '', projectedFinishDate: project.projectedFinishDate || '', warrantyStartDate: project.warrantyStartDate || '', warrantyEndDate: project.warrantyEndDate || '' });
  }, [project]);

  if (!project) return null;

  const setG = (k, v) => setGeneral(p => ({ ...p, [k]: v }));
  const setL = (k, v) => setLocation(p => ({ ...p, [k]: v }));
  const setD = (k, v) => setDates(p => ({ ...p, [k]: v }));

  const saveGeneral = () => { updateProject(projectId, { ...general, contractValue: parseFloat(general.contractValue) || 0 }, user?.id); setEditingGeneral(false); toast.success('Saved'); };
  const saveLocation = () => { updateProject(projectId, location, user?.id); setEditingLocation(false); toast.success('Saved'); };
  const saveDates = () => { updateProject(projectId, dates, user?.id); setEditingDates(false); toast.success('Saved'); };

  const dateFields = [
    { key: 'startDate', label: 'Start Date' },
    { key: 'actualStartDate', label: 'Actual Start Date' },
    { key: 'completionDate', label: 'Completion Date' },
    { key: 'projectedFinishDate', label: 'Projected Finish Date' },
    { key: 'warrantyStartDate', label: 'Warranty Start Date' },
    { key: 'warrantyEndDate', label: 'Warranty End Date' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-4">
      <h2 className="text-lg font-bold tracking-tight">Admin</h2>

      {/* General Information */}
      <SectionCard title="General Information" isAdmin={isAdmin} editing={editingGeneral} onEdit={() => setEditingGeneral(true)} onSave={saveGeneral} onCancel={() => setEditingGeneral(false)}>
        {editingGeneral ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select value={general.stage} onValueChange={v => setG('stage', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Project Name</Label><Input value={general.name} onChange={e => setG('name', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Project Number</Label><Input value={general.jobNumber} onChange={e => setG('jobNumber', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Sector</Label><Input value={general.sector} onChange={e => setG('sector', e.target.value)} placeholder="e.g. Commercial" /></div>
            <div className="space-y-1.5"><Label>Contract Value ($)</Label><Input type="number" value={general.contractValue} onChange={e => setG('contractValue', e.target.value)} /></div>
            <div className="sm:col-span-2 space-y-1.5"><Label>Description</Label><Textarea value={general.description} onChange={e => setG('description', e.target.value)} rows={3} /></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Stage" value={general.stage} />
            <Field label="Project Name" value={general.name} />
            <Field label="Project Number" value={general.jobNumber} />
            <Field label="Sector" value={general.sector} />
            <Field label="Contract Value" value={general.contractValue ? `$${Number(general.contractValue).toLocaleString()}` : null} />
            <div className="sm:col-span-2"><Field label="Description" value={general.description} /></div>
          </div>
        )}
      </SectionCard>

      {/* Location */}
      <SectionCard title="Project Location" isAdmin={isAdmin} editing={editingLocation} onEdit={() => setEditingLocation(true)} onSave={saveLocation} onCancel={() => setEditingLocation(false)}>
        {editingLocation ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5"><Label>Address</Label><Input value={location.address} onChange={e => setL('address', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>City</Label><Input value={location.city} onChange={e => setL('city', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>State</Label><Input value={location.state} onChange={e => setL('state', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Zip Code</Label><Input value={location.zip} onChange={e => setL('zip', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>County</Label><Input value={location.county} onChange={e => setL('county', e.target.value)} /></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><Field label="Address" value={location.address} /></div>
            <Field label="City" value={location.city} />
            <Field label="State" value={location.state} />
            <Field label="Zip Code" value={location.zip} />
            <Field label="County" value={location.county} />
          </div>
        )}
      </SectionCard>

      {/* Dates */}
      <SectionCard title="Dates" isAdmin={isAdmin} editing={editingDates} onEdit={() => setEditingDates(true)} onSave={saveDates} onCancel={() => setEditingDates(false)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dateFields.map(({ key, label }) => (
            editingDates ? (
              <div key={key} className="space-y-1.5"><Label>{label}</Label><Input type="date" value={dates[key]} onChange={e => setD(key, e.target.value)} /></div>
            ) : (
              <Field key={key} label={label} value={dates[key]} />
            )
          ))}
        </div>
      </SectionCard>

      {/* Specifications */}
      <div className="bg-white rounded-xl border">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b gap-2">
          <h3 className="text-sm font-semibold">Specifications</h3>
          {isAdmin ? (
            <Button size="sm" variant="ghost" className="h-7 px-2.5 text-xs gap-1 text-muted-foreground"
              onClick={() => { setEditSpec(null); setSpecForm({ number: '', title: '' }); setShowSpecDialog(true); }}>
              <Plus className="h-3 w-3" /> Add
            </Button>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
              <Lock className="h-3 w-3" /> Admin only
            </div>
          )}
        </div>
        <div className="px-4 sm:px-6 py-5">
          {projectSpecs.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No specifications added yet.</p>
          ) : (
            <div className="divide-y rounded-md border overflow-hidden">
              {projectSpecs.map(spec => (
                <div key={spec.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono font-semibold text-muted-foreground flex-shrink-0">{spec.number}</span>
                    <span className="text-sm truncate">{spec.title}</span>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-6 w-6"
                        onClick={() => { setEditSpec(spec); setSpecForm({ number: spec.number, title: spec.title }); setShowSpecDialog(true); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                        onClick={() => setConfirmDeleteSpec(spec)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Spec Dialog */}
      <Dialog open={showSpecDialog} onOpenChange={setShowSpecDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editSpec ? 'Edit Specification' : 'Add Specification'}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label>Section Number</Label>
              <Input value={specForm.number} onChange={e => setSpecForm(p => ({ ...p, number: e.target.value }))} placeholder="e.g. 03300" />
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={specForm.title} onChange={e => setSpecForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Cast-In-Place Concrete" autoFocus />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSpecDialog(false)}>Cancel</Button>
              <Button onClick={() => {
                if (!specForm.number.trim() || !specForm.title.trim()) { toast.error('Number and title are required'); return; }
                if (editSpec) {
                  updateSpec(editSpec.id, specForm);
                  toast.success('Specification updated');
                } else {
                  addSpec(projectId, specForm);
                  toast.success('Specification added');
                }
                setShowSpecDialog(false);
              }}>
                {editSpec ? 'Save' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDeleteSpec}
        onOpenChange={v => !v && setConfirmDeleteSpec(null)}
        title={`Delete "${confirmDeleteSpec?.number} — ${confirmDeleteSpec?.title}"?`}
        description="This specification will be removed from the project."
        onConfirm={() => { deleteSpec(confirmDeleteSpec.id); setConfirmDeleteSpec(null); toast.success('Deleted'); }}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
