import { useEffect, useState, type FormEvent } from 'react';
import AdminLayout from './AdminLayout';
import { Panel, StatusBadge } from './AdminShared';
import { defaultBillingSettings, revenueService, type BillingSettingsDoc, type PlanDoc } from '../../services/revenueService';
import { showToast } from '../../lib/toast';

const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100';
const labelClass = 'mb-2 block text-xs font-extrabold uppercase tracking-widest text-slate-600';

const emptyPlan: Partial<PlanDoc> = {
  name: '',
  price_bdt: 99,
  duration_days: 30,
  ai_credits: 80,
  download_limit: 20,
  premium_templates: true,
  priority_support: false,
  status: 'Active',
  sort_order: 1,
  features: '',
};

const AdminPackages = () => {
  const [plans, setPlans] = useState<PlanDoc[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<PlanDoc>>(emptyPlan);
  const [settings, setSettings] = useState<Partial<BillingSettingsDoc>>(defaultBillingSettings);

  const load = async () => {
    const [planResult, billing] = await Promise.all([
      revenueService.listPlans(false),
      revenueService.getBillingSettings(),
    ]);
    setPlans(planResult.documents);
    setSettings(billing);
  };

  useEffect(() => {
    void load();
  }, []);

  const edit = (plan: PlanDoc) => {
    setEditingId(plan.$id);
    setForm(plan);
  };

  const savePlan = async (event: FormEvent) => {
    event.preventDefault();
    await revenueService.savePlan(editingId, form);
    showToast('Package saved successfully.');
    setEditingId(null);
    setForm(emptyPlan);
    await load();
  };

  const saveSettings = async (event: FormEvent) => {
    event.preventDefault();
    await revenueService.saveBillingSettings(settings);
    showToast('Billing settings saved.');
    await load();
  };

  return (
    <AdminLayout title="Packages">
      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Panel title={editingId ? 'Edit Package' : 'Create Package'}>
          <form onSubmit={savePlan} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div><label className={labelClass}>Name</label><input className={inputClass} value={form.name || ''} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
              <div><label className={labelClass}>Price BDT</label><input type="number" className={inputClass} value={form.price_bdt ?? 0} onChange={(event) => setForm({ ...form, price_bdt: Number(event.target.value) })} /></div>
              <div><label className={labelClass}>Duration Days</label><input type="number" className={inputClass} value={form.duration_days ?? 30} onChange={(event) => setForm({ ...form, duration_days: Number(event.target.value) })} /></div>
              <div><label className={labelClass}>AI Credits</label><input type="number" className={inputClass} value={form.ai_credits ?? 0} onChange={(event) => setForm({ ...form, ai_credits: Number(event.target.value) })} /></div>
              <div><label className={labelClass}>Download Limit (-1 unlimited)</label><input type="number" className={inputClass} value={form.download_limit ?? 0} onChange={(event) => setForm({ ...form, download_limit: Number(event.target.value) })} /></div>
              <div><label className={labelClass}>Sort Order</label><input type="number" className={inputClass} value={form.sort_order ?? 0} onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) })} /></div>
              <div><label className={labelClass}>Status</label><select className={inputClass} value={form.status || 'Active'} onChange={(event) => setForm({ ...form, status: event.target.value as 'Active' | 'Inactive' })}><option>Active</option><option>Inactive</option></select></div>
            </div>
            <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-2">
              <label className="font-bold text-slate-700"><input type="checkbox" checked={Boolean(form.premium_templates)} onChange={(event) => setForm({ ...form, premium_templates: event.target.checked })} className="mr-2 accent-blue-600" /> Premium templates</label>
              <label className="font-bold text-slate-700"><input type="checkbox" checked={Boolean(form.priority_support)} onChange={(event) => setForm({ ...form, priority_support: event.target.checked })} className="mr-2 accent-blue-600" /> Priority support</label>
            </div>
            <div><label className={labelClass}>Features one per line</label><textarea className={`${inputClass} min-h-28`} value={form.features || ''} onChange={(event) => setForm({ ...form, features: event.target.value })} /></div>
            <div className="grid gap-3 sm:flex">
              <button className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white">Save Package</button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyPlan); }} className="rounded-xl border border-slate-200 px-6 py-3 font-bold text-slate-700">Cancel</button>}
            </div>
          </form>
        </Panel>

        <Panel title="Billing Settings">
          <form onSubmit={saveSettings} className="space-y-4">
            <div><label className={labelClass}>Free AI Credits</label><input type="number" className={inputClass} value={settings.free_ai_credits ?? 10} onChange={(event) => setSettings({ ...settings, free_ai_credits: Number(event.target.value) })} /></div>
            <div><label className={labelClass}>Free Download Limit</label><input type="number" className={inputClass} value={settings.free_download_limit ?? 2} onChange={(event) => setSettings({ ...settings, free_download_limit: Number(event.target.value) })} /></div>
            <div><label className={labelClass}>bKash Number</label><input className={inputClass} value={settings.bkash_number || ''} onChange={(event) => setSettings({ ...settings, bkash_number: event.target.value })} /></div>
            <div><label className={labelClass}>Payment Instruction</label><textarea className={`${inputClass} min-h-28`} value={settings.payment_instruction || ''} onChange={(event) => setSettings({ ...settings, payment_instruction: event.target.value })} /></div>
            <button className="rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Save Settings</button>
          </form>
        </Panel>
      </div>

      <Panel title="All Packages">
        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.$id || plan.name} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_0.7fr_0.7fr_0.7fr_auto] md:items-center">
              <div><p className="font-black text-slate-950">{plan.name}</p><p className="text-sm font-semibold text-slate-500">{plan.premium_templates ? 'Premium access' : 'Free/basic access'}</p></div>
              <p className="font-bold text-blue-700">BDT {plan.price_bdt}</p>
              <p className="font-bold text-slate-700">{plan.ai_credits} AI</p>
              <StatusBadge status={plan.status} />
              <button onClick={() => edit(plan)} className="rounded-xl bg-blue-50 px-4 py-2 font-bold text-blue-700">Edit</button>
            </div>
          ))}
        </div>
      </Panel>
    </AdminLayout>
  );
};

export default AdminPackages;
