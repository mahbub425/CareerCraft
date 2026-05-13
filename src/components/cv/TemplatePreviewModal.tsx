import { ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TemplateDoc } from '../../services/cvService';

const TemplatePreviewModal = ({ template, onClose }: { template: TemplateDoc; onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] bg-slate-950/75 p-2 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true">
    <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-950/30 sm:rounded-3xl">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">{template.category}</p>
          <h3 className="truncate text-xl font-black text-slate-950 sm:text-2xl">{template.name}</h3>
          {!!template.tags?.length && (
            <div className="mt-2 flex flex-wrap gap-2">
              {template.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">{tag}</span>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2 sm:flex">
          <Link to={`/user/cv/create?template=${template.$id}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">
            Use Template
            <ChevronRight className="h-4 w-4" />
          </Link>
          <button onClick={onClose} className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-3 text-slate-700 hover:bg-slate-200" aria-label="Close preview">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-2 sm:p-6">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-2 shadow-xl shadow-slate-950/10 ring-1 ring-slate-200 sm:p-3">
          <img src={template.preview_image} alt={template.name} className="mx-auto max-h-[calc(100vh-14rem)] w-full object-contain" />
        </div>
      </div>
    </div>
  </div>
);

export default TemplatePreviewModal;
