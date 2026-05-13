import { useEffect, useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import { account } from '../../lib/appwrite';
import { authService } from '../../services/authService';
import { cvService } from '../../services/cvService';
import { showToast } from '../../lib/toast';
import UserLayout from './UserLayout';

const inputClass = 'w-full rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 font-medium text-gray-950 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100';
const labelClass = 'mb-2 block text-xs font-extrabold uppercase tracking-widest text-gray-700';

const UserProfile = () => {
  const [userId, setUserId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('Student');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      const user = await authService.getCurrentUser();
      if (!user) return;
      setUserId(user.$id);
      setFullName(user.name);
      setEmail(user.email);
      try {
        const profile = await cvService.getUserProfile(user.$id);
        setUserType(profile.user_type || 'Student');
      } catch {
        await cvService.createUserProfile(user);
      }
    };
    void load();
  }, []);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    try {
      await account.updateName(fullName);
      await cvService.updateUserProfile(userId, {
        full_name: fullName,
        email,
        user_type: userType as 'Student' | 'Fresh Graduate' | 'Professional',
      });
      setMessage('Profile updated successfully.');
      showToast('Profile updated successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update profile.');
      showToast(error instanceof Error ? error.message : 'Failed to update profile.', 'error');
    }
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 6) {
      setMessage('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('New password and confirm password do not match.');
      return;
    }
    try {
      await account.updatePassword(newPassword, currentPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password updated successfully.');
      showToast('Password updated successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update password.');
      showToast(error instanceof Error ? error.message : 'Failed to update password.', 'error');
    }
  };

  return (
    <UserLayout title="Profile">
      {message && <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 font-bold text-blue-700">{message}</div>}
      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm shadow-blue-900/5">
          <h2 className="mb-5 text-2xl font-black text-gray-950">Basic Info</h2>
          <form onSubmit={saveProfile}>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>Full Name</label>
                <input className={inputClass} value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input className={inputClass} value={email} readOnly />
              </div>
              <div>
                <label className={labelClass}>User Type</label>
                <select className={inputClass} value={userType} onChange={(event) => setUserType(event.target.value)}>
                  <option>Student</option>
                  <option>Fresh Graduate</option>
                  <option>Professional</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white"><Save className="h-4 w-4" /> Save Changes</button>
              <button type="button" onClick={() => window.location.reload()} className="rounded-xl border border-blue-100 px-5 py-3 font-bold text-blue-700">Cancel</button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm shadow-blue-900/5">
          <h2 className="mb-5 text-2xl font-black text-gray-950">Change Password</h2>
          <form onSubmit={savePassword} className="space-y-5">
            <div>
              <label className={labelClass}>Current Password</label>
              <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={inputClass} placeholder="Current password" />
            </div>
            <div>
              <label className={labelClass}>New Password</label>
              <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={inputClass} placeholder="Minimum 6 characters" />
            </div>
            <div>
              <label className={labelClass}>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} placeholder="Confirm password" />
            </div>
            <button className="w-full rounded-xl bg-gray-950 px-5 py-3 font-bold text-white">Update Password</button>
          </form>
        </section>
      </div>
    </UserLayout>
  );
};

export default UserProfile;
