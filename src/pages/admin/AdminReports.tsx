import { useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import { Panel, StatCard } from './AdminShared';
import { cvService, type CVDoc, type TemplateDoc, type UserProfile } from '../../services/cvService';
import { revenueService, type PaymentRequestDoc } from '../../services/revenueService';

const AdminReports = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [cvs, setCvs] = useState<CVDoc[]>([]);
  const [templates, setTemplates] = useState<TemplateDoc[]>([]);
  const [payments, setPayments] = useState<PaymentRequestDoc[]>([]);

  useEffect(() => {
    Promise.all([cvService.listUserProfiles(), cvService.listAllCVs(), cvService.listTemplates(false), revenueService.listPayments().catch(() => ({ documents: [] as PaymentRequestDoc[] }))])
      .then(([userResult, cvResult, templateResult, paymentResult]) => {
        setUsers(userResult.documents);
        setCvs(cvResult.documents);
        setTemplates(templateResult.documents);
        setPayments(paymentResult.documents);
      });
  }, []);

  const mostUsed = useMemo(() => {
    const counts = new Map<string, number>();
    cvs.forEach((cv) => counts.set(cv.template_name || 'Unknown', (counts.get(cv.template_name || 'Unknown') || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
  }, [cvs]);

  const approvedRevenue = payments.filter((payment) => payment.status === 'approved').reduce((sum, payment) => sum + (payment.amount_bdt || 0), 0);
  const pendingAmount = payments.filter((payment) => payment.status === 'pending').reduce((sum, payment) => sum + (payment.amount_bdt || 0), 0);

  return (
    <AdminLayout title="Reports">
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Users" value={users.length} />
        <StatCard label="New Users This Month" value={users.length} tone="green" />
        <StatCard label="Total CVs Created" value={cvs.length} />
        <StatCard label="CVs This Month" value={cvs.length} tone="amber" />
        <StatCard label="Most Used Template" value={mostUsed} tone="slate" />
        <StatCard label="Total Downloads" value={cvs.reduce((sum, cv) => sum + (cv.pdf_downloads || 0) + (cv.docx_downloads || 0), 0)} />
        <StatCard label="PDF Downloads" value={cvs.reduce((sum, cv) => sum + (cv.pdf_downloads || 0), 0)} />
        <StatCard label="DOCX Downloads" value={cvs.reduce((sum, cv) => sum + (cv.docx_downloads || 0), 0)} />
        <StatCard label="Approved Revenue" value={`BDT ${approvedRevenue}`} tone="green" />
        <StatCard label="Pending Amount" value={`BDT ${pendingAmount}`} tone="amber" />
        <StatCard label="Payment Requests" value={payments.length} tone="slate" />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Top 5 Templates">
          <div className="space-y-3">
            {templates.slice(0, 5).map((template) => <div key={template.$id} className="rounded-2xl bg-slate-50 px-4 py-3 font-bold text-slate-700">{template.name}</div>)}
          </div>
        </Panel>
        <Panel title="Users by Type">
          <div className="space-y-3">{['Student', 'Fresh Graduate', 'Professional'].map((type) => <div key={type} className="flex justify-between rounded-2xl bg-blue-50 px-4 py-3 font-bold"><span>{type}</span><span>{users.filter((user) => user.user_type === type).length}</span></div>)}</div>
        </Panel>
        <Panel title="CVs by Status">
          <div className="space-y-3">{['Draft', 'Completed'].map((status) => <div key={status} className="flex justify-between rounded-2xl bg-green-50 px-4 py-3 font-bold"><span>{status}</span><span>{cvs.filter((cv) => cv.status === status).length}</span></div>)}</div>
        </Panel>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
