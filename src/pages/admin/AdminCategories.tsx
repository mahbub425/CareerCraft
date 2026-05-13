import { useEffect, useState } from 'react';
import { Edit, ToggleLeft } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Panel, StatusBadge } from './AdminShared';
import { cvService, type CategoryDoc } from '../../services/cvService';
import { showToast } from '../../lib/toast';

const AdminCategories = () => {
  const [categories, setCategories] = useState<CategoryDoc[]>([]);

  const load = () => cvService.listCategories().then((result) => setCategories(result.documents));

  useEffect(() => {
    void load();
  }, []);

  const editDescription = async (category: CategoryDoc) => {
    const description = prompt('Category description', category.description || '');
    if (description === null) return;
    await cvService.saveCategory(category.$id, { description });
    showToast('Category description updated.');
    await load();
  };

  const toggle = async (category: CategoryDoc) => {
    await cvService.saveCategory(category.$id, { status: category.status === 'Active' ? 'Inactive' : 'Active' });
    showToast('Category status updated.');
    await load();
  };

  return (
    <AdminLayout title="Categories">
      <Panel title="Category Management">
        <div className="grid gap-4 lg:grid-cols-3">
          {categories.map((category) => (
            <div key={category.$id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-slate-950">{category.name}</h3>
                  <p className="text-sm text-slate-600">{category.description}</p>
                </div>
                <StatusBadge status={category.status} />
              </div>
              <p className="mb-5 font-bold text-blue-700">{category.templates_count || 0} templates</p>
              <div className="flex gap-2">
                <button onClick={() => void editDescription(category)} className="flex-1 rounded-xl bg-blue-50 px-4 py-3 font-bold text-blue-700"><Edit className="mx-auto h-4 w-4" /></button>
                <button onClick={() => void toggle(category)} className="flex-1 rounded-xl bg-amber-50 px-4 py-3 font-bold text-amber-700"><ToggleLeft className="mx-auto h-4 w-4" /></button>
              </div>
              {category.is_default && <p className="mt-3 text-xs font-bold text-slate-400">Default category cannot be deleted.</p>}
            </div>
          ))}
        </div>
      </Panel>
    </AdminLayout>
  );
};

export default AdminCategories;
