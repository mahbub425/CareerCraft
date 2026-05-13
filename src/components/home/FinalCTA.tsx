import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cvService, type SiteContentDoc } from '../../services/cvService';

const FinalCTA = () => {
  const [content, setContent] = useState<SiteContentDoc | null>(null);

  useEffect(() => {
    cvService.getSiteContent().then(setContent).catch(() => setContent(null));
  }, []);

  return (
    <section className="relative overflow-hidden bg-blue-700 py-16 sm:py-20 lg:py-28">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:52px_52px] opacity-35" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/30" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur sm:mb-8 sm:text-sm">
          <Sparkles className="h-4 w-4" />
          <span>Launch Your Career Today</span>
        </div>
        <h2 className="mb-5 text-3xl font-black leading-tight text-white sm:text-4xl lg:text-6xl">
          {content?.final_cta_title || 'Ready to Create Your CV?'}
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-base font-medium leading-relaxed text-blue-100 sm:mb-10 sm:text-xl">
          {content?.final_cta_subtitle || 'Select a template and create your CV in a few minutes.'}
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href="#templates" className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-8 py-3.5 font-black text-blue-700 shadow-2xl shadow-blue-950/20 transition-all hover:-translate-y-1 hover:bg-blue-50 active:scale-95 sm:w-auto sm:px-9 sm:py-4">
            Browse Templates
          </a>
          <Link to="/register" className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/30 bg-blue-950/25 px-8 py-3.5 font-black text-white shadow-xl shadow-blue-950/10 transition-all hover:-translate-y-1 hover:bg-white/10 active:scale-95 sm:w-auto sm:px-9 sm:py-4">
            Register Now
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
