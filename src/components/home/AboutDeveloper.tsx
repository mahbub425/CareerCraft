import { useEffect, useState } from 'react';
import { ExternalLink, Globe, Mail, Phone, X } from 'lucide-react';
import { cvService, type AboutDeveloperDoc } from '../../services/cvService';

const FacebookIcon = ({ className = 'h-6 w-6', official = false }: { className?: string; official?: boolean }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill={official ? '#1877F2' : 'currentColor'} d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.49 0-1.956.931-1.956 1.886v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z" />
  </svg>
);

const LinkedInIcon = ({ className = 'h-6 w-6', official = false }: { className?: string; official?: boolean }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill={official ? '#0A66C2' : 'currentColor'} d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.447-2.136 2.941v5.665H9.351V9h3.414v1.561h.049c.476-.9 1.637-1.852 3.37-1.852 3.602 0 4.267 2.371 4.267 5.455v6.288h-.004ZM5.337 7.433a2.063 2.063 0 1 1 0-4.126 2.063 2.063 0 0 1 0 4.126ZM7.119 20.452H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.226.792 24 1.771 24h20.451C23.2 24 24 23.226 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
  </svg>
);

const AboutDeveloper = () => {
  const [developer, setDeveloper] = useState<AboutDeveloperDoc | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    cvService.getAboutDeveloper().then(setDeveloper).catch(() => setDeveloper(null));
  }, []);

  const skills = developer?.skills?.length
    ? developer.skills
    : ['Web Development', 'UI/UX Design', 'Backend Development', 'Database Design'];

  const contactLinks = [
    { label: 'Email', value: developer?.email || 'contact@example.com', href: `mailto:${developer?.email || 'contact@example.com'}`, icon: Mail },
    { label: 'Phone', value: developer?.phone || 'Not added yet', href: developer?.phone ? `tel:${developer.phone}` : '#', icon: Phone },
    { label: 'Facebook', value: developer?.github || 'Not added yet', href: developer?.github || '#', brand: 'facebook' },
    { label: 'LinkedIn', value: developer?.linkedin || 'Not added yet', href: developer?.linkedin || '#', brand: 'linkedin' },
    { label: 'Portfolio', value: developer?.portfolio_url || 'Not added yet', href: developer?.portfolio_url || '#', icon: Globe },
  ];

  return (
    <section id="about-developer" className="relative overflow-hidden bg-gray-950 py-16 text-white sm:py-20 lg:py-28">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:56px_56px] opacity-50" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:gap-16 lg:grid-cols-2 lg:items-center">
          <div className="order-2 flex justify-center lg:order-1 lg:justify-end">
            <div className="relative group">
              <div className="absolute inset-0 rotate-6 rounded-3xl bg-blue-600/20 transition-transform duration-500 group-hover:rotate-10" />
              <div className="relative h-56 w-56 overflow-hidden rounded-3xl border-4 border-gray-800 shadow-2xl shadow-blue-950/30 sm:h-80 sm:w-80">
                <img
                  src={developer?.profile_image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'}
                  alt={developer?.developer_name || 'Developer'}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-5 -right-5 rounded-2xl border-4 border-gray-950 bg-blue-600 p-4 shadow-xl shadow-blue-950/40 animate-float sm:-bottom-6 sm:-right-6 sm:p-5">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-blue-100">{developer?.expertise_label || 'Expertise'}</p>
                <p className="text-lg font-black sm:text-xl">{developer?.expertise_value || 'Full Stack'}</p>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="mb-6 inline-block rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-300">
              The Developer
            </div>
            <h2 className="mb-6 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              {(developer?.developer_name || 'Developer')} for Your <span className="text-blue-500">Career Growth</span>
            </h2>

            <p className="mb-8 text-base font-medium leading-relaxed text-gray-300 sm:mb-9 sm:text-lg">
              {developer?.short_bio || 'This CV Builder helps students, fresh graduates, and professionals create polished CVs quickly.'}
            </p>

            <div className="mb-10 flex flex-wrap gap-3">
              {skills.map((skill) => (
                <span key={skill} className="rounded-full border border-blue-500/20 bg-white/5 px-5 py-2 text-sm font-bold text-gray-200">
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-5 sm:flex-row">
              <button onClick={() => setContactOpen(true)} className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3.5 font-bold text-white shadow-xl shadow-blue-950/30 transition-all hover:-translate-y-1 hover:shadow-blue-600/25 active:scale-95 sm:w-auto sm:py-4">
                <Mail className="h-5 w-5" />
                Contact Developer
              </button>
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <a href={developer?.github || '#'} title="Facebook" aria-label="Facebook" className="rounded-2xl border border-white/10 bg-white/5 p-4 text-gray-300 transition-all hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-white">
                  <FacebookIcon />
                </a>
                <a href={developer?.linkedin || '#'} title="LinkedIn" aria-label="LinkedIn" className="rounded-2xl border border-white/10 bg-white/5 p-4 text-gray-300 transition-all hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-white">
                  <LinkedInIcon />
                </a>
                <a href={developer?.portfolio_url || '#'} title="Portfolio" aria-label="Portfolio" className="rounded-2xl border border-white/10 bg-white/5 p-4 text-gray-300 transition-all hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-white">
                  <Globe className="h-6 w-6" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {contactOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-blue-100 bg-white p-5 text-slate-950 shadow-2xl shadow-blue-950/30 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-blue-600">Developer Contact</p>
                <h3 className="text-2xl font-black">{developer?.developer_name || 'Developer Information'}</h3>
              </div>
              <button onClick={() => setContactOpen(false)} className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200" aria-label="Close contact popup">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {contactLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a key={item.label} href={item.href} className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 transition hover:bg-blue-50">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                      {item.brand === 'facebook' ? <FacebookIcon className="h-5 w-5" official /> : item.brand === 'linkedin' ? <LinkedInIcon className="h-5 w-5" official /> : Icon ? <Icon className="h-5 w-5 text-blue-700" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-black uppercase tracking-widest text-slate-500">{item.label}</span>
                      <span className="block truncate font-bold text-slate-900">{item.value}</span>
                    </span>
                    <ExternalLink className="h-4 w-4 text-blue-600" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AboutDeveloper;
