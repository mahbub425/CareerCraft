import { useEffect, useState, type FormEvent } from 'react';
import AdminLayout from './AdminLayout';
import { Panel } from './AdminShared';
import { account } from '../../lib/appwrite';
import { authService } from '../../services/authService';
import { showToast } from '../../lib/toast';

const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100';
const labelClass = 'mb-2 block text-xs font-extrabold uppercase tracking-widest text-slate-600';

const AdminSettings = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    authService.getCurrentUser().then((user) => {
      if (!user) return;
      setName(user.name);
      setEmail(user.email);
    });
  }, []);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    await account.updateName(name);
    setMessage('Admin profile updated.');
    showToast('Admin profile updated successfully.');
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    await account.updatePassword(newPassword, currentPassword);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage('Password updated.');
    showToast('Password updated successfully.');
  };

  return (
    <AdminLayout title="Settings">
      {message && <div className="mb-5 rounded-2xl bg-blue-50 px-4 py-3 font-bold text-blue-700">{message}</div>}
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Admin Profile">
          <form onSubmit={saveProfile} className="space-y-5">
            <div><label className={labelClass}>Admin Name</label><input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} /></div>
            <div><label className={labelClass}>Email</label><input className={inputClass} value={email} readOnly /></div>
            <button className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white">Save Profile</button>
          </form>
        </Panel>
        <Panel title="Change Password">
          <form onSubmit={savePassword} className="space-y-5">
            <div><label className={labelClass}>Current Password</label><input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={inputClass} placeholder="Current password" /></div>
            <div><label className={labelClass}>New Password</label><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={inputClass} placeholder="Minimum 6 characters" /></div>
            <div><label className={labelClass}>Confirm Password</label><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} placeholder="Confirm password" /></div>
            <button className="rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Update Password</button>
          </form>
        </Panel>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
