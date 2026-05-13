import { Download, FileEdit, Search, UserPlus } from 'lucide-react';

const steps = [
  {
    icon: <Search className="w-7 h-7" />,
    title: 'Choose a Template',
    desc: 'Student, graduate or professional template select করুন।',
  },
  {
    icon: <UserPlus className="w-7 h-7" />,
    title: 'Login or Register',
    desc: 'আপনার CV save করার জন্য account তৈরি করুন।',
  },
  {
    icon: <FileEdit className="w-7 h-7" />,
    title: 'Fill Your Information',
    desc: 'Step-by-step form পূরণ করুন।',
  },
  {
    icon: <Download className="w-7 h-7" />,
    title: 'Download PDF',
    desc: 'Download your CV as a polished PDF file.',
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="border-y border-blue-100 bg-gradient-to-b from-blue-50/80 to-white py-16 sm:py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
          <span className="mb-4 inline-flex rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-blue-700 shadow-sm">
            Simple Process
          </span>
          <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">Build Your CV in 4 Easy Steps</h2>
          <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
            আমাদের প্রসেস একদম সহজ এবং দ্রুত। কোনো ঝামেলা ছাড়াই প্রফেশনাল CV তৈরি করুন।
          </p>
        </div>

        <div className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="absolute left-0 right-0 top-16 hidden h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent lg:block" />

          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              <div className="h-full rounded-2xl border border-blue-100 bg-white p-5 shadow-lg shadow-blue-900/5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/10 sm:rounded-3xl sm:p-7">
                <div className="mb-5 flex items-center justify-between sm:mb-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 sm:h-14 sm:w-14 sm:rounded-2xl">
                    {step.icon}
                  </div>
                  <span className="text-3xl font-black text-blue-100 sm:text-4xl">0{index + 1}</span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-950">{step.title}</h3>
                <p className="text-sm font-medium leading-relaxed text-gray-600">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center sm:mt-12">
          <a href="#templates" className="inline-flex w-full items-center justify-center rounded-2xl bg-gray-950 px-8 py-3.5 font-bold text-white shadow-xl shadow-gray-900/15 transition-all hover:-translate-y-1 hover:bg-blue-700 hover:shadow-blue-600/25 active:scale-95 sm:w-auto sm:px-9 sm:py-4">
            Start Now
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
