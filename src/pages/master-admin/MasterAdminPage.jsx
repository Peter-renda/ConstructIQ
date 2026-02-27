import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ShieldCheck, Users } from 'lucide-react';

const STATUS_STYLES = {
  pending:  'bg-amber-50  text-amber-700  ring-1 ring-inset ring-amber-200/60',
  approved: 'bg-green-50  text-green-700  ring-1 ring-inset ring-green-200/60',
  rejected: 'bg-red-50    text-red-700    ring-1 ring-inset ring-red-200/60',
};

const TABS = ['All', 'Pending', 'Approved', 'Rejected'];

export function MasterAdminPage() {
  const { profile: currentProfile } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('All');

  async function loadProfiles() {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) { toast.error('Failed to load users'); return; }
    setProfiles(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadProfiles(); }, []);

  async function updateProfile(id, updates) {
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) { toast.error('Update failed'); return; }
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }

  async function approve(id) {
    await updateProfile(id, { status: 'approved' });
    toast.success('User approved');
  }

  async function reject(id) {
    await updateProfile(id, { status: 'rejected' });
    toast.success('User rejected');
  }

  async function revoke(id) {
    await updateProfile(id, { status: 'pending' });
    toast.success('Access revoked');
  }

  async function toggleAdmin(id, current) {
    await updateProfile(id, { is_master_admin: !current });
    toast.success(!current ? 'Admin role granted' : 'Admin role removed');
  }

  const filtered = profiles.filter(p => {
    if (tab === 'All') return true;
    return p.status === tab.toLowerCase();
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-50 rounded-full p-2.5">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Admin Portal</h1>
          <p className="text-sm text-gray-500">Manage user access and roles</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
            {t === 'Pending' && (
              <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5">
                {profiles.filter(p => p.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-black/[0.04] overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <Users className="h-8 w-8" />
            <p className="text-sm">Loading users…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="bg-gray-100 rounded-2xl p-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No users in this category</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const isSelf = p.id === currentProfile?.id;
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {p.full_name || '—'}
                      {p.is_master_admin && (
                        <span className="ml-2 text-[11px] bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/60 rounded-full px-1.5 py-0.5 font-semibold">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.email}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{p.company_role || 'user'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[p.status] || STATUS_STYLES.pending}`}>
                        {p.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.created_at ? format(new Date(p.created_at), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Approval actions */}
                        {!isSelf && (p.status === 'pending' || p.status === 'rejected') && (
                          <Button size="sm" variant="outline" className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50" onClick={() => approve(p.id)}>
                            Approve
                          </Button>
                        )}
                        {!isSelf && p.status === 'pending' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-50" onClick={() => reject(p.id)}>
                            Reject
                          </Button>
                        )}
                        {!isSelf && p.status === 'approved' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-50" onClick={() => revoke(p.id)}>
                            Revoke
                          </Button>
                        )}
                        {/* Admin toggle */}
                        {!isSelf && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-gray-500 hover:text-gray-700" onClick={() => toggleAdmin(p.id, p.is_master_admin)}>
                            {p.is_master_admin ? 'Remove Admin' : 'Make Admin'}
                          </Button>
                        )}
                        {isSelf && <span className="text-xs text-gray-400 italic">You</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
