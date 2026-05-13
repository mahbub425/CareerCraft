import { useEffect, useMemo, useState } from 'react';
import { Eye, Search, UserX } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Panel, StatusBadge } from './AdminShared';
import { cvService, type UserProfile } from '../../services/cvService';
import { authService } from '../../services/authService';

const AdminUsers = () => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentId, setCurrentId] = useState('');
  const [selected, setSelected] = useState<UserProfile | null>(null);

  const load = async () => {
    const [user, result] = await Promise.all([authService.getCurrentUser(), cvService.listUserProfiles()]);
    setCurrentId(user?.$id || '');
    setUsers(result.documents);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => users.filter((user) => {
    const matchQuery = `${user.full_name} ${user.email}`.toLowerCase().includes(query.toLowerCase());
    const matchType = type === 'All' || user.user_type === type;
    return matchQuery && matchType;
  }), [query, type, users]);

  const toggleStatus = async (user: UserProfile) => {
    if (user.user_id === currentId) {
      alert('Admin cannot deactivate own account.');
      return;
    }
    const status = user.status === 'Active' ? 'Inactive' : 'Active';
    await cvService.updateUserProfile(user.$id, { status });
    await load();
  };

  return (
    <AdminLayout title="Users">
      <Panel title="User Management">
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search className="h-5 w-5 text-blue-600" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or email" className="w-full bg-transparent font-medium outline-none" />
          </div>
          <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700">
            {['All', 'Student', 'Fresh Graduate', 'Professional'].map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="text-xs uppercase tracking-widest text-slate-500">
              <tr>
                {['Name', 'Email', 'User Type', 'Role', 'Total CVs', 'Status', 'Registered', 'Actions'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.$id} className="border-t border-slate-100">
                  <td className="px-4 py-4 font-bold text-slate-950">{user.full_name}</td>
                  <td className="px-4 py-4 text-slate-600">{user.email}</td>
                  <td className="px-4 py-4">{user.user_type}</td>
                  <td className="px-4 py-4">{user.role}</td>
                  <td className="px-4 py-4">{user.total_cvs || 0}</td>
                  <td className="px-4 py-4"><StatusBadge status={user.status} /></td>
                  <td className="px-4 py-4">{user.registered_at ? new Date(user.registered_at).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => setSelected(user)} className="rounded-xl bg-blue-50 p-2 text-blue-700" title="View details"><Eye className="h-4 w-4" /></button>
                      <button disabled={user.user_id === currentId} onClick={() => void toggleStatus(user)} className="rounded-xl bg-amber-50 p-2 text-amber-700 disabled:opacity-40" title="Activate/Deactivate"><UserX className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selected && (
          <div className="mt-5 rounded-3xl border border-blue-100 bg-blue-50 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-950">{selected.full_name}</h3>
                <p className="font-semibold text-slate-600">{selected.email}</p>
                <p className="mt-3 text-sm font-bold text-blue-700">{selected.user_type} - {selected.status}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-xl bg-white px-4 py-2 font-bold text-blue-700">Close</button>
            </div>
          </div>
        )}
      </Panel>
    </AdminLayout>
  );
};

export default AdminUsers;
