import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, Search } from 'lucide-react';
import UserLayout from './UserLayout';
import { authService } from '../../services/authService';
import { cvService, type TemplateDoc } from '../../services/cvService';
import { isTemplateAvailableToUsers } from '../../lib/templateConfig';
import TemplatePreviewModal from '../../components/cv/TemplatePreviewModal';
import { isPremiumTemplate } from '../../services/revenueService';

const filters = ['Simple', 'Modern', 'ATS Friendly', 'One Page', 'With Photo', 'Without Photo'];

const templateAudienceScore = (template: TemplateDoc, userType: string) => {
  const haystack = `${template.category} ${(template.tags || []).join(' ')} ${template.name}`.toLowerCase();
  const target = userType.toLowerCase();
  if (haystack.includes(target)) return 0;
  if (target === 'fresh graduate' && (haystack.includes('graduate') || haystack.includes('entry'))) return 0;
  if (target === 'student' && (haystack.includes('internship') || haystack.includes('academic'))) return 1;
  if (target === 'professional' && (haystack.includes('experienced') || haystack.includes('executive') || haystack.includes('senior'))) return 1;
  return 2;
};

const UserTemplates = () => {
  const [category, setCategory] = useState('All');
  const [activeFilter, setActiveFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [templates, setTemplates] = useState<TemplateDoc[]>([]);
  const [userType, setUserType] = useState('Student');
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [previewTemplate, setPreviewTemplate] = useState<TemplateDoc | null>(null);

  useEffect(() => {
    Promise.all([
      authService.getCurrentUser(),
      cvService.listTemplates(true),
    ])
      .then(async ([user, result]) => {
        const profile = user ? await cvService.getUserProfile(user.$id).catch(() => null) : null;
        const nextUserType = profile?.user_type || 'Student';
        setUserType(nextUserType);
        setTemplates(
          result.documents
            .filter(isTemplateAvailableToUsers)
            .toSorted((a, b) => templateAudienceScore(a, nextUserType) - templateAudienceScore(b, nextUserType)),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const previewId = searchParams.get('preview');
    if (!previewId || !templates.length) return;
    setPreviewTemplate(templates.find((template) => template.$id === previewId) || null);
  }, [searchParams, templates]);

  const openPreview = (template: TemplateDoc) => {
    setPreviewTemplate(template);
    setSearchParams({ preview: template.$id });
  };

  const closePreview = () => {
    setPreviewTemplate(null);
    setSearchParams({});
  };

  const visibleTemplates = useMemo(() => {
    return templates.filter((template) => {
      const categoryMatch = category === 'All' || template.category === category;
      const filterMatch = activeFilter === 'All' || (template.tags || []).includes(activeFilter);
      const queryMatch = `${template.name} ${template.category} ${(template.tags || []).join(' ')}`.toLowerCase().includes(query.toLowerCase());
      return categoryMatch && filterMatch && queryMatch;
    });
  }, [activeFilter, category, query, templates]);
  const categories = useMemo(() => ['All', ...Array.from(new Set(templates.map((template) => template.category))).sort()], [templates]);

  return (
    <UserLayout title="Choose a CV Template">
      <section className="mb-6 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-900/5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">Template Selection</p>
            <h2 className="text-3xl font-black text-gray-950">Choose a CV Template</h2>
            <p className="mt-2 max-w-2xl text-gray-600">Pick a template and start filling your CV step by step. Recommended options for {userType} appear first.</p>
          </div>
          <div className="flex w-full items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-gray-500 lg:max-w-sm">
            <Search className="h-5 w-5 text-blue-600" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search templates" className="w-full bg-transparent text-sm font-semibold outline-none" />
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-900/5">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
          {categories.map((item) => (
            <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all ${category === item ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
          {['All', ...filters].map((item) => (
            <button key={item} onClick={() => setActiveFilter(item)} className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-bold transition-all ${activeFilter === item ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-blue-100 bg-white text-gray-600 hover:bg-blue-50'}`}>
              {item}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="rounded-3xl border border-blue-100 bg-white p-10 text-center font-bold text-blue-700">Loading templates...</div>
      ) : visibleTemplates.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-10 text-center">
          <p className="font-bold text-gray-700">No templates found.</p>
          <button onClick={() => { setCategory('All'); setActiveFilter('All'); setQuery(''); }} className="mt-4 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white">Reset Filters</button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleTemplates.map((template) => (
            <article key={template.$id} className="group overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm shadow-blue-900/5 transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/10">
              <div className="relative m-3 aspect-[3/4] overflow-hidden rounded-2xl bg-slate-100">
                <img src={template.preview_image} alt={template.name} className="h-full w-full object-contain p-2 transition-transform duration-700 group-hover:scale-[1.03]" />
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/55 to-transparent" />
                <div className="absolute inset-0 bg-slate-950/45 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => openPreview(template)} className="flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-blue-700 shadow-xl shadow-blue-950/20 hover:bg-blue-50">
                    <Eye className="h-5 w-5" />
                    Preview
                  </button>
                </div>
                <span className="absolute left-4 top-4 max-w-[calc(100%-2rem)] rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-blue-700 shadow ring-1 ring-blue-100 backdrop-blur">{template.category}</span>
                {isPremiumTemplate(template) && <span className="absolute right-4 top-4 rounded-full bg-purple-600 px-3 py-1 text-xs font-black text-white shadow">Premium</span>}
              </div>
              <div className="p-5 pt-2">
                <h3 className="text-xl font-black text-gray-950">{template.name}</h3>
                <div className="my-4 flex flex-wrap gap-2">
                  {(template.tags || []).map((tag) => (
                    <span key={tag} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{tag}</span>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button onClick={() => openPreview(template)} className="flex items-center justify-center gap-2 rounded-2xl border border-blue-100 px-4 py-3 font-bold text-blue-700 hover:bg-blue-50">
                    <Eye className="h-4 w-4" />
                    Preview
                  </button>
                  <Link to={`/user/cv/create?template=${template.$id}`} className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-center font-bold text-white shadow-lg shadow-blue-600/20">
                    Use Template
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {previewTemplate && <TemplatePreviewModal template={previewTemplate} onClose={closePreview} />}
    </UserLayout>
  );
};

export default UserTemplates;
