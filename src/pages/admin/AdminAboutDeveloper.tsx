import { useEffect, useState, type FormEvent } from 'react';
import AdminLayout from './AdminLayout';
import { Panel } from './AdminShared';
import { cvService } from '../../services/cvService';
import { showToast } from '../../lib/toast';

const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100';
const labelClass = 'mb-2 block text-xs font-extrabold uppercase tracking-widest text-slate-600';

const AdminAboutDeveloper = () => {
  const [form, setForm] = useState({
    developer_name: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    portfolio_url: '',
    expertise_label: 'Expertise',
    expertise_value: 'Full Stack',
    short_bio: '',
    profile_image: '',
    skills: '',
  });
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    cvService.getAboutDeveloper().then((content) => {
      setForm({
        developer_name: content.developer_name || '',
        email: content.email || '',
        phone: content.phone || '',
        linkedin: content.linkedin || '',
        github: content.github || '',
        portfolio_url: content.portfolio_url || '',
        expertise_label: content.expertise_label || 'Expertise',
        expertise_value: content.expertise_value || 'Full Stack',
        short_bio: content.short_bio || '',
        profile_image: content.profile_image || '',
        skills: (content.skills || []).join(', '),
      });
    });
  }, []);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const uploadProfileImage = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await cvService.uploadAsset(file);
      update('profile_image', url);
      showToast('Profile image uploaded successfully.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to upload profile image.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await cvService.saveAboutDeveloper({
        ...form,
        skills: form.skills.split(',').map((item) => item.trim()).filter(Boolean),
      });
      setMessage('Developer section saved.');
      showToast('Developer section saved successfully.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save developer section.', 'error');
    }
  };

  return (
    <AdminLayout title="About Developer">
      <Panel title="Developer Section Content">
        {message && <div className="mb-5 rounded-2xl bg-green-50 px-4 py-3 font-bold text-green-700">{message}</div>}
        <form onSubmit={save} className="grid gap-5 md:grid-cols-2">
          {[
            ['Developer name', 'developer_name'],
            ['Email', 'email'],
            ['Phone', 'phone'],
            ['LinkedIn', 'linkedin'],
            ['Facebook', 'github'],
            ['Portfolio URL', 'portfolio_url'],
            ['Expertise label', 'expertise_label'],
            ['Expertise value', 'expertise_value'],
          ].map(([label, key]) => (
            <div key={key}>
              <label className={labelClass}>{label}</label>
              <input className={inputClass} value={form[key as keyof typeof form]} onChange={(event) => update(key as keyof typeof form, event.target.value)} />
            </div>
          ))}
          <div className="md:col-span-2">
            <label className={labelClass}>Short Bio</label>
            <textarea className={`${inputClass} min-h-32`} value={form.short_bio} onChange={(event) => update('short_bio', event.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Profile Image URL</label>
            <div className="grid gap-3">
              <input className={inputClass} value={form.profile_image} onChange={(event) => update('profile_image', event.target.value)} placeholder="Paste image URL" />
              <label className="flex items-center justify-center rounded-xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 hover:bg-blue-100">
                {uploading ? 'Uploading...' : 'Upload Image'}
                <input type="file" accept="image/*" disabled={uploading} onChange={(event) => void uploadProfileImage(event.target.files?.[0])} className="hidden" />
              </label>
            </div>
            {form.profile_image && <img src={form.profile_image} alt="Developer preview" className="mt-4 h-28 w-28 rounded-2xl object-cover ring-1 ring-slate-200" />}
          </div>
          <div>
            <label className={labelClass}>Skills List</label>
            <textarea className={`${inputClass} min-h-32`} value={form.skills} onChange={(event) => update('skills', event.target.value)} placeholder="Web Development, UI/UX Design, Backend Development" />
          </div>
          <div className="md:col-span-2 flex gap-3">
            <button className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white">Save</button>
            <a href="/#about-developer" target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 px-6 py-3 font-bold text-slate-700">Preview on Home Page</a>
          </div>
        </form>
      </Panel>
    </AdminLayout>
  );
};

export default AdminAboutDeveloper;
