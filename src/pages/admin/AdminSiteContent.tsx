import { useEffect, useState, type FormEvent } from 'react';
import AdminLayout from './AdminLayout';
import { Panel } from './AdminShared';
import { cvService, type TemplateDoc } from '../../services/cvService';
import { showToast } from '../../lib/toast';

const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100';
const labelClass = 'mb-2 block text-xs font-extrabold uppercase tracking-widest text-slate-600';

const AdminSiteContent = () => {
  const [form, setForm] = useState({
    hero_title: '',
    hero_subtitle: '',
    primary_cta_text: '',
    secondary_cta_text: '',
    benefits_title: '',
    benefit_items: '',
    final_cta_title: '',
    final_cta_subtitle: '',
    featured_template_ids: [] as string[],
  });
  const [templates, setTemplates] = useState<TemplateDoc[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([cvService.getSiteContent(), cvService.listTemplates(true)]).then(([content, templateResult]) => {
      setForm({
        hero_title: content.hero_title || '',
        hero_subtitle: content.hero_subtitle || '',
        primary_cta_text: content.primary_cta_text || '',
        secondary_cta_text: content.secondary_cta_text || '',
        benefits_title: content.benefits_title || '',
        benefit_items: content.benefit_items || '',
        final_cta_title: content.final_cta_title || '',
        final_cta_subtitle: content.final_cta_subtitle || '',
        featured_template_ids: content.featured_template_ids || [],
      });
      setTemplates(templateResult.documents);
    });
  }, []);

  const update = (key: keyof typeof form, value: string | string[]) => setForm((current) => ({ ...current, [key]: value }));

  const save = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await cvService.saveSiteContent(form);
      setMessage('Home page content saved.');
      showToast('Home page content saved successfully.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save home page content.', 'error');
    }
  };

  return (
    <AdminLayout title="Home Page Content">
      <Panel title="Edit Home Page Content">
        {message && <div className="mb-5 rounded-2xl bg-green-50 px-4 py-3 font-bold text-green-700">{message}</div>}
        <form onSubmit={save} className="grid gap-5 md:grid-cols-2">
          {[
            ['Hero title', 'hero_title'],
            ['Hero subtitle', 'hero_subtitle'],
            ['Primary CTA text', 'primary_cta_text'],
            ['Secondary CTA text', 'secondary_cta_text'],
            ['Benefits section title', 'benefits_title'],
            ['Benefit items JSON/text', 'benefit_items'],
            ['Final CTA title', 'final_cta_title'],
            ['Final CTA subtitle', 'final_cta_subtitle'],
          ].map(([label, key]) => (
            <div key={key} className={label.includes('subtitle') || key === 'benefit_items' ? 'md:col-span-2' : ''}>
              <label className={labelClass}>{label}</label>
              {label.includes('subtitle') || key === 'benefit_items'
                ? <textarea className={`${inputClass} min-h-28`} value={String(form[key as keyof typeof form])} onChange={(event) => update(key as keyof typeof form, event.target.value)} />
                : <input className={inputClass} value={String(form[key as keyof typeof form])} onChange={(event) => update(key as keyof typeof form, event.target.value)} />}
            </div>
          ))}
          <div className="md:col-span-2 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <p className="mb-3 font-black text-slate-950">Featured template control</p>
            <div className="flex flex-wrap gap-2">
              {templates.map((item) => (
                <label key={item.$id} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-blue-700">
                  <input type="checkbox" checked={form.featured_template_ids.includes(item.$id)} onChange={(event) => {
                    update('featured_template_ids', event.target.checked ? [...form.featured_template_ids, item.$id] : form.featured_template_ids.filter((id) => id !== item.$id));
                  }} className="mr-2 accent-blue-600" />
                  {item.name}
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 flex gap-3">
            <button className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white">Save Changes</button>
            <a href="/" target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 px-6 py-3 font-bold text-slate-700">Preview</a>
          </div>
        </form>
      </Panel>
    </AdminLayout>
  );
};

export default AdminSiteContent;
