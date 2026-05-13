import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, Download, Eye, FileText, Pencil, PlusCircle, Sparkles, Trash2, X } from 'lucide-react';
import UserLayout from './UserLayout';
import { authService } from '../../services/authService';
import { cvService, type CVDoc, type TemplateDoc } from '../../services/cvService';
import { isTemplateAvailableToUsers } from '../../lib/templateConfig';
import TemplatePreviewModal from '../../components/cv/TemplatePreviewModal';
import { useConfirm } from '../../components/ui/useConfirm';
import { isPremiumTemplate, revenueService, type Entitlement } from '../../services/revenueService';

const templateAudienceScore = (template: TemplateDoc, userType: string) => {
  const haystack = `${template.category} ${(template.tags || []).join(' ')} ${template.name}`.toLowerCase();
  const target = userType.toLowerCase();
  if (haystack.includes(target)) return 0;
  if (target === 'fresh graduate' && (haystack.includes('graduate') || haystack.includes('entry'))) return 0;
  if (target === 'student' && (haystack.includes('internship') || haystack.includes('academic'))) return 1;
  if (target === 'professional' && (haystack.includes('experienced') || haystack.includes('executive') || haystack.includes('senior'))) return 1;
  return 2;
};

const downloadTextFile = (fileName: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('User');
  const [userType, setUserType] = useState('Student');
  const [cvs, setCvs] = useState<CVDoc[]>([]);
  const [templates, setTemplates] = useState<TemplateDoc[]>([]);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [upgradePrompt, setUpgradePrompt] = useState('');
  const { confirm, ConfirmationDialog } = useConfirm();

  const loadData = async () => {
    setLoading(true);
    setMessage('');
    try {
      const user = await authService.getCurrentUser();
      if (!user) return;
      setName(user.name || 'User');
      const profile = await cvService.getUserProfile(user.$id).catch(() => null);
      const nextUserType = profile?.user_type || 'Student';
      setUserType(nextUserType);
      await cvService.cleanupExpiredDrafts(user.$id);
      const [cvResult, templateResult, currentEntitlement] = await Promise.all([
        cvService.listUserCVs(user.$id),
        cvService.listTemplates(true),
        revenueService.getEntitlement(user.$id),
      ]);
      setCvs(cvResult.documents);
      setEntitlement(currentEntitlement);
      setTemplates(
        templateResult.documents
          .filter(isTemplateAvailableToUsers)
          .toSorted((a, b) => templateAudienceScore(a, nextUserType) - templateAudienceScore(b, nextUserType))
          .slice(0, 3),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const stats = useMemo(() => [
    { label: 'Total CVs', value: cvs.length, tone: 'text-blue-700 bg-blue-50' },
    { label: 'Draft CVs', value: cvs.filter((cv) => cv.status === 'Draft').length, tone: 'text-amber-700 bg-amber-50' },
    { label: 'Completed CVs', value: cvs.filter((cv) => cv.status === 'Completed').length, tone: 'text-green-700 bg-green-50' },
    { label: 'Downloads', value: cvs.reduce((sum, cv) => sum + (cv.pdf_downloads || 0) + (cv.docx_downloads || 0), 0), tone: 'text-indigo-700 bg-indigo-50' },
  ], [cvs]);

  const handleDelete = async (cv: CVDoc) => {
    const shouldDelete = await confirm({
      title: 'Delete CV?',
      message: `"${cv.template_name || cv.title}" will be permanently removed from your dashboard.`,
    });
    if (!shouldDelete) return;
    await cvService.deleteCV(cv.$id);
    setCvs((current) => current.filter((item) => item.$id !== cv.$id));
  };

  const handleDownload = async (cv: CVDoc, format: 'PDF' | 'DOCX') => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Please login before downloading.');
      const currentTemplate = cv.template_id ? await cvService.getTemplate(cv.template_id).catch(() => null) : null;
      await revenueService.assertCanDownload(user.$id, currentTemplate);
      const data = cvService.parseCVData(cv);
      const fileTitle = cv.template_name || cv.title || 'cv';
      const body = data ? JSON.stringify(data, null, 2) : fileTitle;
      downloadTextFile(`${fileTitle}.${format.toLowerCase()}`, body);
      await cvService.recordDownload(cv, format);
      await revenueService.incrementDownloadUsage(user.$id);
      await loadData();
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Download blocked. Please upgrade.';
      setMessage(nextMessage);
      setUpgradePrompt(nextMessage);
    }
  };

  return (
    <UserLayout title="User Dashboard">
      <section className="mb-6 overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-xl shadow-blue-600/15 sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-blue-100">Welcome, {name}</p>
            <h2 className="mb-3 text-3xl font-black sm:text-4xl">Create, edit and download your CV from one place.</h2>
            <p className="max-w-2xl text-blue-100">Manage your drafts, preview your latest CV, and start with templates recommended for {userType} users.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:w-auto">
            <button onClick={() => navigate('/user/plans')} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-950/25 px-6 py-4 font-black text-white ring-1 ring-white/25 transition-all hover:-translate-y-0.5 hover:bg-blue-950/35 md:w-auto">
              <Crown className="h-5 w-5" />
              Upgrade
            </button>
            <button onClick={() => navigate('/user/templates')} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-black text-blue-700 shadow-xl shadow-blue-950/10 transition-all hover:-translate-y-0.5 hover:bg-blue-50 md:w-auto">
              <PlusCircle className="h-5 w-5" />
              Create New CV
            </button>
          </div>
        </div>
      </section>

      {message && <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 font-bold text-red-600">{message}</div>}

      {entitlement && (
        <section className="mb-6 grid gap-4 lg:grid-cols-3">
          <button onClick={() => navigate('/user/plans')} className="rounded-3xl border border-blue-100 bg-white p-5 text-left shadow-sm shadow-blue-900/5 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-900/10">
            <div className="mb-3 flex items-center gap-2 text-blue-700"><Crown className="h-5 w-5" /><span className="text-sm font-black uppercase tracking-widest">Current Plan</span></div>
            <p className="text-3xl font-black text-gray-950">{entitlement.planName}</p>
            <p className="mt-2 text-sm font-bold text-gray-500">{entitlement.expiresAt ? `Expires ${new Date(entitlement.expiresAt).toLocaleDateString()}` : 'Free monthly access'}</p>
          </button>
          <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-900/5">
            <div className="mb-3 flex items-center gap-2 text-blue-700"><Sparkles className="h-5 w-5" /><span className="text-sm font-black uppercase tracking-widest">AI Credits</span></div>
            <p className="text-3xl font-black text-gray-950">{entitlement.aiRemaining} / {entitlement.aiCredits}</p>
            <p className="mt-2 text-sm font-bold text-gray-500">Remaining this period</p>
          </div>
          <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-900/5">
            <div className="mb-3 flex items-center gap-2 text-blue-700"><Download className="h-5 w-5" /><span className="text-sm font-black uppercase tracking-widest">Downloads</span></div>
            <p className="text-3xl font-black text-gray-950">{entitlement.downloadLimit < 0 ? 'Unlimited' : `${entitlement.downloadsRemaining} / ${entitlement.downloadLimit}`}</p>
            <p className="mt-2 text-sm font-bold text-gray-500">{entitlement.premiumTemplates ? 'Premium downloads unlocked' : 'Premium downloads locked'}</p>
          </div>
        </section>
      )}

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm shadow-blue-900/5">
            <div className={`mb-5 inline-flex rounded-2xl px-4 py-2 text-sm font-bold ${stat.tone}`}>{stat.label}</div>
            <p className="text-4xl font-black text-gray-950">{loading ? '...' : stat.value}</p>
          </div>
        ))}
      </section>

      <section id="my-cvs" className="mb-6 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-900/5 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-950">My Recent CVs</h2>
            <p className="text-sm font-medium text-gray-500">Edit, preview, download, or delete your saved CVs.</p>
          </div>
          <Link to="/user/templates" className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 ring-1 ring-blue-100 hover:bg-blue-100">
            Browse Templates
          </Link>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-8 text-center font-bold text-blue-700">Loading CVs...</div>
        ) : cvs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50 p-8 text-center">
            <FileText className="mx-auto mb-4 h-10 w-10 text-blue-600" />
            <p className="mb-4 font-bold text-gray-700">You have not created any CV yet.</p>
            <Link to="/user/templates" className="inline-flex rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white">Create Your First CV</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {cvs.map((cv) => (
              <div key={cv.$id} className="grid gap-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 lg:grid-cols-[1.5fr_1fr_0.8fr_1fr_1.8fr] lg:items-center">
                <div>
                  <p className="font-black text-gray-950">{cv.template_name || cv.title}</p>
                  <p className="text-sm font-medium text-gray-500">{cv.category || 'Professional'}</p>
                </div>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${cv.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{cv.status}</span>
                <p className="text-sm font-semibold text-gray-500">{cv.updated_at ? new Date(cv.updated_at).toLocaleDateString() : 'Today'}</p>
                <p className="text-sm font-semibold text-gray-500">{(cv.pdf_downloads || 0) + (cv.docx_downloads || 0)} downloads</p>
                <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap">
                  <Link to={`/user/cv/${cv.$id}/edit`} className="rounded-xl bg-white p-3 text-center text-blue-700 ring-1 ring-blue-100 hover:bg-blue-50" title="Edit"><Pencil className="mx-auto h-4 w-4" /></Link>
                  <Link to={`/user/cv/${cv.$id}/preview`} className="rounded-xl bg-white p-3 text-center text-gray-700 ring-1 ring-blue-100 hover:bg-blue-50" title="Preview"><Eye className="mx-auto h-4 w-4" /></Link>
                  <button onClick={() => void handleDownload(cv, 'PDF')} className="rounded-xl bg-white p-3 text-green-700 ring-1 ring-blue-100 hover:bg-blue-50" title="Download PDF"><Download className="mx-auto h-4 w-4" /></button>
                  <button onClick={() => void handleDelete(cv)} className="rounded-xl bg-white p-3 text-red-600 ring-1 ring-red-100 hover:bg-red-50" title="Delete"><Trash2 className="mx-auto h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-900/5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-2xl font-black text-gray-950">Recommended Templates</h2>
          <p className="text-sm font-medium text-gray-500">Templates matching your registration category appear first.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {templates.map((template) => (
            <div key={template.$id} className="group overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10">
              <div className="relative aspect-[3/4] bg-slate-100">
                <img src={template.preview_image} alt={template.name} className="h-full w-full object-contain p-2 transition-transform duration-700 group-hover:scale-[1.03]" />
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-slate-950/55 to-transparent" />
                <div className="absolute inset-0 bg-slate-950/45 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => setPreviewTemplate(template)} className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-blue-700 shadow-xl shadow-blue-950/20 hover:bg-blue-50">
                    <Eye className="h-4 w-4" />
                    Preview
                  </button>
                </div>
                <span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-blue-700 shadow ring-1 ring-blue-100 backdrop-blur">{template.category}</span>
                {isPremiumTemplate(template) && <span className="absolute right-3 top-3 rounded-full bg-purple-600 px-3 py-1 text-[11px] font-black text-white shadow">Premium</span>}
              </div>
              <div className="p-4">
                <p className="font-black text-gray-950">{template.name}</p>
                <div className="my-3 flex flex-wrap gap-2">
                  {(template.tags || []).slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 ring-1 ring-blue-100">{tag}</span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPreviewTemplate(template)} className="flex-1 rounded-xl border border-blue-100 px-3 py-2 text-center text-sm font-bold text-blue-700 hover:bg-blue-50">Preview</button>
                  <Link to={`/user/cv/create?template=${template.$id}`} className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-center text-sm font-bold text-white">Use Template</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      {previewTemplate && <TemplatePreviewModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} />}
      {upgradePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
            <button onClick={() => setUpgradePrompt('')} className="ml-auto block rounded-xl bg-slate-100 p-2 text-slate-600"><X className="h-5 w-5" /></button>
            <Crown className="mx-auto mb-4 h-14 w-14 text-blue-600" />
            <h3 className="mb-3 text-2xl font-black text-gray-950">Upgrade Required</h3>
            <p className="mb-6 font-semibold leading-relaxed text-gray-600">{upgradePrompt}</p>
            <button onClick={() => navigate('/user/plans')} className="w-full rounded-xl bg-blue-600 px-5 py-3 font-black text-white">View Plans</button>
          </div>
        </div>
      )}
      <ConfirmationDialog />
    </UserLayout>
  );
};

export default UserDashboard;
