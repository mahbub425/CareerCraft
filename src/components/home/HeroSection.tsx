import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, FileSearch, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImage from '../../assets/images/hero.png';
import { cvService, type SiteContentDoc } from '../../services/cvService';

const HeroSection = () => {
  const [content, setContent] = useState<SiteContentDoc | null>(null);

  useEffect(() => {
    cvService.getSiteContent().then(setContent).catch(() => setContent(null));
  }, []);

  return (
    <section className="relative overflow-hidden border-b border-blue-100 bg-gradient-to-b from-blue-50 via-white to-white pb-16 pt-28 sm:pb-20 sm:pt-32 lg:pb-32 lg:pt-44">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(37,99,235,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.06)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-white" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm shadow-blue-900/5 sm:mb-8 sm:text-sm">
              <Sparkles className="h-4 w-4" />
              <span>Free Template Preview</span>
            </div>

            <h1 className="mb-6 text-3xl font-extrabold leading-[1.08] tracking-tight text-gray-950 sm:mb-7 sm:text-5xl lg:text-7xl">
              {content?.hero_title || <>Create a <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Professional CV</span> in Minutes</>}
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-gray-600 sm:mb-10 sm:text-xl lg:mx-0">
              {content?.hero_subtitle || 'Choose a template, fill your details, preview live, and download your CV.'}
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
              <a href="#templates" className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3.5 text-base font-bold text-white shadow-xl shadow-blue-600/25 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-600/30 active:scale-95 sm:w-auto sm:px-9 sm:py-4 sm:text-lg">
                <FileSearch className="h-6 w-6" />
                {content?.primary_cta_text || 'Browse Templates'}
              </a>
              <Link to="/user/cv/create" className="flex w-full items-center justify-center gap-3 rounded-2xl border border-blue-200 bg-white/90 px-6 py-3.5 text-base font-bold text-blue-700 shadow-lg shadow-blue-900/5 transition-all hover:-translate-y-1 hover:border-blue-300 hover:bg-blue-50 active:scale-95 sm:w-auto sm:px-9 sm:py-4 sm:text-lg">
                {content?.secondary_cta_text || 'Create CV'}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-3">
              {['Easy Step-by-Step', 'ATS Friendly', 'Instant Download'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 font-semibold text-gray-600 shadow-sm">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="group relative mx-auto w-full max-w-md pt-2 lg:max-w-none">
            <div className="absolute -inset-2 rounded-3xl border border-blue-100 bg-white/70 shadow-2xl shadow-blue-900/10 sm:-inset-5" />
            <div className="relative z-10 overflow-hidden rounded-2xl border-[6px] border-white shadow-[0_28px_70px_-30px_rgba(30,64,175,0.65)] ring-1 ring-blue-100 sm:rounded-[1.75rem] sm:border-[10px]">
              <img src={heroImage} alt="CV Template Mockups" className="h-auto w-full object-cover transition-transform duration-1000 group-hover:scale-105" />
            </div>

            <div className="absolute -right-6 -top-5 z-20 hidden items-center gap-4 rounded-2xl border border-blue-100 bg-white p-4 shadow-xl shadow-blue-900/10 animate-float sm:flex">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-600/25">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-gray-900">100% Free Preview</p>
                <p className="text-xs font-medium text-gray-500">No account needed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
