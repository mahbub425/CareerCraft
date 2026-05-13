import { useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import { Panel, StatCard } from './AdminShared';
import { cvService, type CVDoc, type TemplateDoc, type UserProfile } from '../../services/cvService';

const AdminDashboard = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [cvs, setCvs] = useState<CVDoc[]>([]);
  const [templates, setTemplates] = useState<TemplateDoc[]>([]);

  useEffect(() => {
    Promise.all([
      cvService.listUserProfiles(),
      cvService.listAllCVs(),
      cvService.listTemplates(false),
    ]).then(([userResult, cvResult, templateResult]) => {
      setUsers(userResult.documents);
      setCvs(cvResult.documents);
      setTemplates(templateResult.documents);
    });
  }, []);

  const activity = useMemo(() => [
    ...users.slice(0, 3).map((user) => `New user: ${user.full_name || user.email}`),
    ...cvs.slice(0, 3).map((cv) => `CV updated: ${cv.title}`),
    ...templates.slice(0, 2).map((template) => `Template ready: ${template.name}`),
  ], [cvs, templates, users]);

  return (
    <AdminLayout title="Overview">
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Users" value={users.length} />
        <StatCard label="Total CVs" value={cvs.length} tone="green" />
        <StatCard label="Total Templates" value={templates.length} tone="amber" />
        <StatCard label="Active Templates" value={templates.filter((item) => item.status === 'Active').length} />
        <StatCard label="PDF Downloads" value={cvs.reduce((sum, cv) => sum + (cv.pdf_downloads || 0), 0)} />
        <StatCard label="DOCX Downloads" value={cvs.reduce((sum, cv) => sum + (cv.docx_downloads || 0), 0)} tone="slate" />
        <StatCard label="Student Users" value={users.filter((user) => user.user_type === 'Student').length} />
        <StatCard label="Professional Users" value={users.filter((user) => user.user_type === 'Professional').length} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Panel title="Recent Activity">
          <div className="space-y-3">
            {activity.length ? activity.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{item}</div>
            )) : <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm font-bold text-slate-500">No activity yet.</div>}
          </div>
        </Panel>
        <Panel title="Users by Type">
          <div className="space-y-3">
            {['Student', 'Fresh Graduate', 'Professional'].map((type) => (
              <div key={type} className="flex items-center justify-between rounded-2xl bg-blue-50 px-4 py-3">
                <span className="font-bold text-slate-700">{type}</span>
                <span className="font-black text-blue-700">{users.filter((user) => user.user_type === type).length}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
