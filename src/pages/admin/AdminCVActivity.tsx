import { useEffect, useMemo, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Panel, StatusBadge } from './AdminShared';
import { cvService, type CVDoc } from '../../services/cvService';
import { showToast } from '../../lib/toast';
import { useConfirm } from '../../components/ui/useConfirm';

const AdminCVActivity = () => {
  const [query, setQuery] = useState('');
  const [cvs, setCvs] = useState<CVDoc[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const { confirm, ConfirmationDialog } = useConfirm();

  const load = () => cvService.listAllCVs().then((result) => setCvs(result.documents));

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => cvs.filter((cv) => `${cv.title} ${cv.user_id} ${cv.template_name}`.toLowerCase().includes(query.toLowerCase())), [cvs, query]);
  const allVisibleSelected = visible.length > 0 && visible.every((cv) => selected.includes(cv.$id));

  const toggleOne = (cvId: string) => {
    setSelected((current) => current.includes(cvId) ? current.filter((id) => id !== cvId) : [...current, cvId]);
  };

  const toggleVisible = () => {
    setSelected((current) => {
      if (allVisibleSelected) return current.filter((id) => !visible.some((cv) => cv.$id === id));
      return Array.from(new Set([...current, ...visible.map((cv) => cv.$id)]));
    });
  };

  const deleteCVs = async (ids: string[]) => {
    if (!ids.length) return;
    const shouldDelete = await confirm({
      title: `Delete ${ids.length} CV${ids.length > 1 ? 's' : ''}?`,
      message: 'This will remove the selected CV data from user dashboards too.',
    });
    if (!shouldDelete) return;
    await Promise.all(ids.map((id) => cvService.deleteCV(id)));
    setSelected((current) => current.filter((id) => !ids.includes(id)));
    showToast(`${ids.length} CV${ids.length > 1 ? 's' : ''} deleted successfully.`);
    await load();
  };

  return (
    <AdminLayout title="CV Activity">
      <Panel title="CV Usage Monitor">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search className="h-5 w-5 text-blue-600" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by user id, template, or CV title" className="w-full bg-transparent font-medium outline-none" />
          </div>
          <button disabled={selected.length === 0} onClick={() => void deleteCVs(selected)} className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-bold text-white disabled:opacity-40">
            <Trash2 className="h-4 w-4" />
            Delete Selected ({selected.length})
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="text-xs uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-4 py-3"><input type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} className="accent-blue-600" /></th>
                {['CV Title', 'User ID', 'Template', 'Status', 'PDF', 'DOCX', 'Created', 'Updated', 'Action'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
              </tr>
            </thead>
            <tbody>
              {visible.map((cv) => (
                <tr key={cv.$id} className="border-t border-slate-100">
                  <td className="px-4 py-4"><input type="checkbox" checked={selected.includes(cv.$id)} onChange={() => toggleOne(cv.$id)} className="accent-blue-600" /></td>
                  <td className="px-4 py-4 font-bold text-slate-950">{cv.title}</td>
                  <td className="px-4 py-4">{cv.user_id}</td>
                  <td className="px-4 py-4">{cv.template_name}</td>
                  <td className="px-4 py-4"><StatusBadge status={cv.status} /></td>
                  <td className="px-4 py-4">{cv.pdf_downloads || 0}</td>
                  <td className="px-4 py-4">{cv.docx_downloads || 0}</td>
                  <td className="px-4 py-4">{cv.created_at ? new Date(cv.created_at).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-4">{cv.updated_at ? new Date(cv.updated_at).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-4">
                    <button onClick={() => void deleteCVs([cv.$id])} className="rounded-xl bg-red-50 p-2 text-red-600" title="Delete CV"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500">Privacy MVP: admin sees metadata only, not full private CV content.</p>
      </Panel>
      <ConfirmationDialog />
    </AdminLayout>
  );
};

export default AdminCVActivity;
