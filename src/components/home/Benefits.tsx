import { useEffect, useMemo, useState } from 'react';
import { Briefcase, CloudIcon, FileDown, GraduationCap, MousePointer2, PlayCircle, ShieldCheck, TabletSmartphone } from 'lucide-react';
import { cvService, type SiteContentDoc } from '../../services/cvService';

const benefits = [
  { icon: <MousePointer2 className="w-6 h-6" />, title: 'Easy for beginners', desc: 'কোনো টেকনিক্যাল জ্ঞান ছাড়াই আপনি CV তৈরি করতে পারবেন।' },
  { icon: <GraduationCap className="w-6 h-6" />, title: 'Student-friendly templates', desc: 'ছাত্রদের জন্য বিশেষ ইন্টার্নশিপ এবং একাডেমিক টেমপ্লেট।' },
  { icon: <Briefcase className="w-6 h-6" />, title: 'Professional CV layouts', desc: 'অভিজ্ঞ প্রার্থীদের জন্য কর্পোরেট গ্রেড প্রফেশনাল ডিজাইন।' },
  { icon: <PlayCircle className="w-6 h-6" />, title: 'Live preview', desc: 'CV তৈরির সাথে সাথে লাইভ প্রিভিউ দেখার সুবিধা।' },
  { icon: <CloudIcon className="w-6 h-6" />, title: 'Save and edit anytime', desc: 'আপনার CV ক্লাউডে সেভ থাকবে, যেকোনো সময় এডিট করুন।' },
  { icon: <FileDown className="w-6 h-6" />, title: 'PDF download', desc: 'Download a polished PDF CV from your selected template.' },
  { icon: <TabletSmartphone className="w-6 h-6" />, title: 'Mobile responsive', desc: 'যেকোনো ডিভাইস থেকে সহজেই এক্সেস করুন।' },
  { icon: <ShieldCheck className="w-6 h-6" />, title: 'Secure & ATS Friendly', desc: 'আপনার ডাটা সুরক্ষিত এবং টেমপ্লেটগুলো ATS ফ্রেন্ডলি।' },
];

const Benefits = () => {
  const [content, setContent] = useState<SiteContentDoc | null>(null);

  useEffect(() => {
    cvService.getSiteContent().then(setContent).catch(() => setContent(null));
  }, []);

  const visibleBenefits = useMemo(() => {
    if (!content?.benefit_items) return benefits;
    try {
      const items = JSON.parse(content.benefit_items) as string[];
      if (!Array.isArray(items) || !items.length) return benefits;
      return items.map((item, index) => ({
        icon: benefits[index % benefits.length].icon,
        title: item,
        desc: 'Updated from admin content.',
      }));
    } catch {
      return content.benefit_items.split('\n').filter(Boolean).map((item, index) => ({
        icon: benefits[index % benefits.length].icon,
        title: item,
        desc: 'Updated from admin content.',
      }));
    }
  }, [content]);

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-5 sm:mb-14 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="mb-4 inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-blue-700">
              Why CareerCraft
            </span>
            <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">{content?.benefits_title || 'Why Choose Simple CV Builder?'}</h2>
            <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
              আমরা আপনার ক্যারিয়ারের গুরুত্ব বুঝি, তাই সার্ভিসগুলো আপনার প্রয়োজন অনুযায়ী সাজানো।
            </p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-blue-800 shadow-sm sm:rounded-3xl sm:px-6 sm:py-5">
            <p className="text-3xl font-black">8+</p>
            <p className="text-sm font-bold">useful CV features</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {visibleBenefits.map((benefit) => (
            <div key={benefit.title} className="group rounded-2xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-900/5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-xl hover:shadow-blue-900/10 sm:rounded-3xl sm:p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 transition-all group-hover:bg-blue-600 group-hover:text-white group-hover:ring-blue-600 sm:mb-5 sm:h-12 sm:w-12 sm:rounded-2xl">
                {benefit.icon}
              </div>
              <h3 className="mb-3 text-lg font-bold text-gray-950">{benefit.title}</h3>
              <p className="text-sm font-medium leading-relaxed text-gray-600">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
