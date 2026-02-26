import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../../contexts/DataContext';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { UserPlus, Building, Users, MoreVertical, Pencil, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const USER_PERMISSIONS = ['architect/engineer', 'owner/client', 'subcontractor', 'company employee'];

function AddUserDialog({ open, onOpenChange, onAdd, editData }) {
  const [form, setForm] = useState(editData || { firstName: '', lastName: '', email: '', permission: 'company employee' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.lastName.trim()) { toast.error('Last name required'); return; }
    if (!form.email.trim()) { toast.error('Email required'); return; }
    onAdd(form); onOpenChange(false);
    setForm({ firstName: '', lastName: '', email: '', permission: 'company employee' });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editData ? 'Edit User' : 'Add User'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>First Name</Label><Input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Jane" /></div>
            <div className="space-y-1.5"><Label>Last Name *</Label><Input value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Smith" required /></div>
          </div>
          <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@company.com" required /></div>
          <div className="space-y-1.5">
            <Label>Permission</Label>
            <Select value={form.permission} onValueChange={v => set('permission', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{USER_PERMISSIONS.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editData ? 'Save' : 'Add User'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddCompanyDialog({ open, onOpenChange, onAdd, editData }) {
  const [form, setForm] = useState(editData || { name: '', type: '', contact: '', email: '', phone: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Company name required'); return; }
    onAdd(form); onOpenChange(false);
    setForm({ name: '', type: '', contact: '', email: '', phone: '' });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editData ? 'Edit Company' : 'Add Company'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          <div className="space-y-1.5"><Label>Company Name *</Label><Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Acme Contractors LLC" required /></div>
          <div className="space-y-1.5"><Label>Company Type</Label><Input value={form.type} onChange={e => set('type', e.target.value)} placeholder="e.g. Subcontractor" /></div>
          <div className="space-y-1.5"><Label>Primary Contact</Label><Input value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="John Doe" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editData ? 'Save' : 'Add Company'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddGroupDialog({ open, onOpenChange, onAdd, users }) {
  const [name, setName] = useState('');
  const [members, setMembers] = useState([]);
  const toggle = (id) => setMembers(p => p.includes(id) ? p.filter(m => m !== id) : [...p, id]);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Group name required'); return; }
    onAdd({ name, members }); onOpenChange(false);
    setName(''); setMembers([]);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Distribution Group</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          <div className="space-y-1.5"><Label>Group Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Design Team" required /></div>
          <div className="space-y-1.5">
            <Label>Members</Label>
            <div className="border rounded-lg max-h-44 overflow-y-auto divide-y">
              {users.length === 0
                ? <p className="text-sm text-muted-foreground p-3">No users in directory yet</p>
                : users.map(u => (
                  <label key={u.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={members.includes(u.id)} onChange={() => toggle(u.id)} className="rounded" />
                    <span className="text-sm">{[u.firstName, u.lastName].filter(Boolean).join(' ')} — {u.email}</span>
                  </label>
                ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Create Group</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DirectoryPage() {
  const { projectId } = useParams();
  const { dirUsers, dirCompanies, distGroups, addDirUser, updateDirUser, deleteDirUser, addDirCompany, updateDirCompany, deleteDirCompany, addDistGroup, deleteDistGroup } = useData();

  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editCompany, setEditCompany] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState('');

  const projectUsers = useMemo(() => dirUsers.filter(u => u.projectId === projectId), [dirUsers, projectId]);
  const projectCompanies = useMemo(() => dirCompanies.filter(c => c.projectId === projectId), [dirCompanies, projectId]);
  const projectGroups = useMemo(() => distGroups.filter(g => g.projectId === projectId), [distGroups, projectId]);

  const filter = (list, keys) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(item => keys.some(k => item[k]?.toLowerCase().includes(q)));
  };

  const EmptyState = ({ icon: Icon, label, onAdd }) => (
    <div className="text-center py-14 text-muted-foreground">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
        <Icon className="h-6 w-6 text-gray-400" />
      </div>
      <p className="text-sm">{label}</p>
      {onAdd && <Button variant="outline" size="sm" className="mt-3" onClick={onAdd}><Plus className="h-4 w-4 mr-1" /> Add one</Button>}
    </div>
  );

  const ActionMenu = ({ onEdit, onDelete }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {onEdit && <DropdownMenuItem onClick={onEdit} className="gap-2 cursor-pointer"><Pencil className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>}
        {onEdit && <DropdownMenuSeparator />}
        <DropdownMenuItem onClick={onDelete} className="gap-2 cursor-pointer text-destructive focus:text-destructive"><Trash2 className="h-3.5 w-3.5" /> Remove</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-lg font-bold tracking-tight">Directory</h2>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setShowAddUser(true)}><UserPlus className="h-3.5 w-3.5 mr-1.5" /> Add User</Button>
          <Button size="sm" variant="outline" onClick={() => setShowAddCompany(true)}><Building className="h-3.5 w-3.5 mr-1.5" /> Add Company</Button>
          <Button size="sm" variant="outline" onClick={() => setShowAddGroup(true)}><Users className="h-3.5 w-3.5 mr-1.5" /> Add Group</Button>
        </div>
      </div>

      <Input placeholder="Search directory…" value={search} onChange={e => setSearch(e.target.value)} className="mb-4 max-w-xs h-8 text-sm" />

      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Users ({projectUsers.length})</TabsTrigger>
          <TabsTrigger value="companies">Companies ({projectCompanies.length})</TabsTrigger>
          <TabsTrigger value="groups">Groups ({projectGroups.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          {filter(projectUsers, ['firstName', 'lastName', 'email', 'permission']).length === 0
            ? <EmptyState icon={UserPlus} label="No users added yet" onAdd={() => setShowAddUser(true)} />
            : (
              <div className="bg-white rounded-xl shadow-sm ring-1 ring-black/[0.04] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[400px]">
                    <thead><tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Permission</th>
                      <th className="px-4 py-3 w-10" />
                    </tr></thead>
                    <tbody>
                      {filter(projectUsers, ['firstName', 'lastName', 'email', 'permission']).map(u => (
                        <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/60 group transition-colors">
                          <td className="px-4 py-3 font-medium">{[u.firstName, u.lastName].filter(Boolean).join(' ')}</td>
                          <td className="px-4 py-3 text-muted-foreground truncate max-w-[180px]">{u.email}</td>
                          <td className="px-4 py-3 hidden sm:table-cell"><span className="capitalize text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{u.permission}</span></td>
                          <td className="px-4 py-3 text-right"><ActionMenu onEdit={() => setEditUser(u)} onDelete={() => setConfirmDelete({ type: 'user', item: u })} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </TabsContent>

        <TabsContent value="companies">
          {filter(projectCompanies, ['name', 'type', 'contact', 'email']).length === 0
            ? <EmptyState icon={Building} label="No companies added yet" onAdd={() => setShowAddCompany(true)} />
            : (
              <div className="bg-white rounded-xl shadow-sm ring-1 ring-black/[0.04] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[400px]">
                    <thead><tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Contact</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                      <th className="px-4 py-3 w-10" />
                    </tr></thead>
                    <tbody>
                      {filter(projectCompanies, ['name', 'type', 'contact', 'email']).map(c => (
                        <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/60 group transition-colors">
                          <td className="px-4 py-3 font-medium">{c.name}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{c.type || '—'}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.contact || '—'}</td>
                          <td className="px-4 py-3 text-muted-foreground truncate max-w-[150px]">{c.email || '—'}</td>
                          <td className="px-4 py-3 text-right"><ActionMenu onEdit={() => setEditCompany(c)} onDelete={() => setConfirmDelete({ type: 'company', item: c })} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </TabsContent>

        <TabsContent value="groups">
          {projectGroups.length === 0
            ? <EmptyState icon={Users} label="No distribution groups yet" onAdd={() => setShowAddGroup(true)} />
            : (
              <div className="bg-white rounded-xl shadow-sm ring-1 ring-black/[0.04] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Group Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Members</th>
                      <th className="px-4 py-3 w-10" />
                    </tr></thead>
                    <tbody>
                      {projectGroups.map(g => {
                        const memberUsers = projectUsers.filter(u => g.members?.includes(u.id));
                        return (
                          <tr key={g.id} className="border-b border-gray-50 hover:bg-gray-50/60 group transition-colors">
                            <td className="px-4 py-3 font-medium">{g.name}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[200px]">
                              {memberUsers.length === 0 ? 'No members' : memberUsers.map(u => [u.firstName, u.lastName].filter(Boolean).join(' ')).join(', ')}
                            </td>
                            <td className="px-4 py-3 text-right"><ActionMenu onDelete={() => setConfirmDelete({ type: 'group', item: g })} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </TabsContent>
      </Tabs>

      <AddUserDialog
        open={showAddUser || !!editUser}
        onOpenChange={v => { if (!v) { setShowAddUser(false); setEditUser(null); } }}
        editData={editUser}
        onAdd={data => {
          if (editUser) { updateDirUser(editUser.id, data); toast.success('User updated'); setEditUser(null); }
          else { addDirUser(projectId, data); toast.success('User added'); }
        }}
      />
      <AddCompanyDialog
        open={showAddCompany || !!editCompany}
        onOpenChange={v => { if (!v) { setShowAddCompany(false); setEditCompany(null); } }}
        editData={editCompany}
        onAdd={data => {
          if (editCompany) { updateDirCompany(editCompany.id, data); toast.success('Company updated'); setEditCompany(null); }
          else { addDirCompany(projectId, data); toast.success('Company added'); }
        }}
      />
      <AddGroupDialog open={showAddGroup} onOpenChange={setShowAddGroup} users={projectUsers} onAdd={data => { addDistGroup(projectId, data); toast.success('Group created'); }} />
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={v => !v && setConfirmDelete(null)}
        title={`Remove "${confirmDelete?.item?.name || [confirmDelete?.item?.firstName, confirmDelete?.item?.lastName].filter(Boolean).join(' ')}"?`}
        description="This action cannot be undone."
        onConfirm={() => {
          if (confirmDelete.type === 'user') { deleteDirUser(confirmDelete.item.id); toast.success('Removed'); }
          else if (confirmDelete.type === 'company') { deleteDirCompany(confirmDelete.item.id); toast.success('Removed'); }
          else { deleteDistGroup(confirmDelete.item.id); toast.success('Removed'); }
          setConfirmDelete(null);
        }}
        confirmLabel="Remove" variant="destructive"
      />
    </div>
  );
}
