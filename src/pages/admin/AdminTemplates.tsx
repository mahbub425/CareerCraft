import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, PlusCircle, Trash2 } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Panel, StatusBadge } from './AdminShared';
import { cvService, type TemplateDoc } from '../../services/cvService';
import { showToast } from '../../lib/toast';
import { useConfirm } from '../../components/ui/useConfirm';

const AdminTemplates = () => {
  const [templates, setTemplates] = useState<TemplateDoc[]>([]);
  const { confirm, ConfirmationDialog } = useConfirm();

  const load = () => cvService.listTemplates(false).then((result) => setTemplates(result.documents));

  useEffect(() => {
    void load();
  }, []);

  const toggle = async (template: TemplateDoc) => {
    await cvService.saveTemplate(template.$id, {
      ...template,
      status: template.status === 'Active' ? 'Inactive' : 'Active',
    });
    showToast(`Template ${template.status === 'Active' ? 'deactivated' : 'activated'} successfully.`);
    await load();
  };

  const toggleAccess = async (template: TemplateDoc) => {
    const isPremium = template.access_type === 'premium' || template.is_free === false;
    await cvService.saveTemplate(template.$id, {
      ...template,
      access_type: isPremium ? 'free' : 'premium',
      is_free: isPremium,
    });
    showToast(`Template marked as ${isPremium ? 'free' : 'premium'}.`);
    await load();
  };

  const remove = async (template: TemplateDoc) => {
    const shouldDelete = await confirm({
      title: 'Delete template?',
      message: `"${template.name}" will be removed. Used templates should normally be made inactive instead.`,
    });
    if (!shouldDelete) return;
    await cvService.deleteTemplate(template.$id);
    showToast('Template deleted successfully.');
    await load();
  };

  return (
    <AdminLayout title="Template Gallery">
      <Panel title="Template Gallery" action={<Link to="/admin/template-builder" className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white"><PlusCircle className="h-5 w-5" /> Template Builder</Link>}>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="hidden grid-cols-[1.3fr_1fr_0.8fr_0.8fr_1.2fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-500 lg:grid">
            <span>Template</span>
            <span>Category</span>
            <span>Access</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          {templates.map((template) => (
            <article key={template.$id} className="grid gap-4 border-b border-slate-100 px-4 py-4 last:border-b-0 sm:px-5 lg:grid-cols-[1.3fr_1fr_0.8fr_0.8fr_1.2fr] lg:items-center">
              <div className="flex min-w-0 items-center gap-4">
                <img src={template.preview_image} alt={template.name} className="h-16 w-12 rounded-lg object-cover ring-1 ring-slate-200" />
                <div className="min-w-0">
                  <h3 className="truncate text-base font-black text-slate-950">{template.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                  {(template.tags || []).map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{tag}</span>)}
                  </div>
                </div>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400 lg:hidden">Category</p>
                <p className="text-sm font-bold text-blue-700">{template.category}</p>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400 lg:hidden">Access</p>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${(template.access_type === 'premium' || template.is_free === false) ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{(template.access_type === 'premium' || template.is_free === false) ? 'Premium' : 'Free'}</span>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400 lg:hidden">Status</p>
                <StatusBadge status={template.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                <button onClick={() => void toggleAccess(template)} className="rounded-xl bg-purple-50 px-3 py-2 text-xs font-black text-purple-700" title="Toggle free/premium">
                  {(template.access_type === 'premium' || template.is_free === false) ? 'Make Free' : 'Make Paid'}
                </button>
                <button
                  onClick={() => void toggle(template)}
                  className={`flex h-9 w-16 items-center rounded-full p-1 transition-colors ${template.status === 'Active' ? 'justify-end bg-green-500' : 'justify-start bg-red-500'}`}
                  title={template.status === 'Active' ? 'Active' : 'Inactive'}
                >
                  <span className="h-7 w-7 rounded-full bg-white shadow" />
                </button>
                <Link to={`/admin/template-gallery/${template.$id}/edit`} className="rounded-xl bg-slate-100 p-3 text-center text-slate-700" title="Edit/customize"><Edit className="mx-auto h-4 w-4" /></Link>
                <button onClick={() => void remove(template)} className="rounded-xl bg-red-50 p-3 font-bold text-red-600" title="Delete"><Trash2 className="mx-auto h-4 w-4" /></button>
              </div>
            </article>
          ))}
        </div>
      </Panel>
      <ConfirmationDialog />
    </AdminLayout>
  );
};

export default AdminTemplates;
