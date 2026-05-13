import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Eye, Layout, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cvService, type TemplateDoc } from '../../services/cvService';
import { isTemplateShownOnHome } from '../../lib/templateConfig';
import TemplatePreviewModal from '../cv/TemplatePreviewModal';
import { isPremiumTemplate } from '../../services/revenueService';

const TemplateGrid = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [templates, setTemplates] = useState<TemplateDoc[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateDoc | null>(null);

  useEffect(() => {
    cvService.listTemplates(true).then((result) => setTemplates(result.documents.filter(isTemplateShownOnHome)));
  }, []);

  const filteredTemplates = activeTab === 'All'
    ? templates
    : templates.filter((template) => template.category === activeTab);
  const categories = useMemo(() => [
    { id: 'All', icon: <Users className="w-4 h-4" />, label: 'All Templates', desc: 'Browse all designs' },
    ...Array.from(new Set(templates.map((template) => template.category))).sort().map((category) => ({
      id: category,
      icon: <Layout className="w-4 h-4" />,
      label: category,
      desc: 'CV templates',
    })),
  ], [templates]);

  return (
    <section id="templates" className="bg-white py-16 sm:py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
          <span className="mb-4 inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-blue-700">
            Template Library
          </span>
          <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">Choose Templates by Category</h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
            আপনার ক্যারিয়ার লেভেল অনুযায়ী সেরা টেমপ্লেটটি সিলেক্ট করুন এবং প্রফেশনাল CV তৈরি শুরু করুন।
          </p>
        </div>

        <div className="mb-10 grid gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 p-2 shadow-inner shadow-blue-900/5 sm:mb-12 sm:grid-cols-2 sm:gap-3 sm:rounded-3xl sm:p-3 lg:grid-cols-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left font-bold transition-all sm:rounded-2xl sm:px-5 sm:py-4 ${
                activeTab === cat.id
                  ? 'bg-white text-blue-700 shadow-lg shadow-blue-900/10 ring-1 ring-blue-100'
                  : 'text-gray-600 hover:bg-white/70 hover:text-blue-700'
              }`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${
                activeTab === cat.id ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'
              }`}>
                {cat.icon}
              </span>
              <span>
                <span className="block text-sm leading-tight">{cat.label}</span>
                <span className={`mt-1 block text-[11px] font-semibold ${activeTab === cat.id ? 'text-blue-500' : 'text-gray-400'}`}>
                  {cat.desc}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="grid gap-5 sm:gap-7 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <div key={template.$id} className="group overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-900/5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/10 sm:rounded-3xl">
              <div className="relative m-2 aspect-[3/4] overflow-hidden rounded-xl bg-slate-100 sm:m-3 sm:rounded-2xl">
                <img
                  src={template.preview_image}
                  alt={template.name}
                  className="h-full w-full object-contain p-2 transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/55 to-transparent" />
                <div className="absolute inset-0 bg-slate-950/45 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => setPreviewTemplate(template)} className="flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-blue-700 shadow-xl shadow-blue-950/20 transition-colors hover:bg-blue-50">
                    <Eye className="w-5 h-5" /> Preview
                  </button>
                </div>
                <span className="absolute left-4 top-4 max-w-[calc(100%-2rem)] rounded-full bg-white/95 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-blue-700 shadow-md shadow-blue-950/10 ring-1 ring-blue-100 backdrop-blur">
                  {template.category}
                </span>
                <span className={`absolute right-4 top-4 rounded-full px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-md shadow-blue-950/10 ${isPremiumTemplate(template) ? 'bg-purple-600' : 'bg-emerald-600'}`}>
                  {isPremiumTemplate(template) ? 'Premium' : 'Free'}
                </span>
              </div>

              <div className="p-5 pt-3 sm:p-6">
                <h3 className="mb-3 text-xl font-extrabold text-gray-950">{template.name}</h3>
                <div className="mb-6 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${isPremiumTemplate(template) ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {isPremiumTemplate(template) ? 'Premium' : 'Free'}
                  </span>
                  {(template.tags || []).map((tag) => (
                    <span key={tag} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">
                      {tag}
                    </span>
                  ))}
                </div>

                <Link to={`/user/cv/create?template=${template.$id}`} className="group/btn flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3.5 font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/25 active:scale-95 sm:rounded-2xl sm:py-4">
                  Use Template
                  <ChevronRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
      {previewTemplate && <TemplatePreviewModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} />}
    </section>
  );
};

export default TemplateGrid;
