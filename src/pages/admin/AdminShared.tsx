import type { ReactNode } from 'react';

export const StatCard = ({ label, value, tone = 'blue' }: { label: string; value: string | number; tone?: 'blue' | 'green' | 'amber' | 'slate' }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className={`mb-5 inline-flex rounded-2xl px-4 py-2 text-sm font-bold ${tones[tone]}`}>{label}</span>
      <p className="text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
};

export const Panel = ({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-2xl font-black text-slate-950">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

export const StatusBadge = ({ status }: { status: string }) => (
  <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${status === 'Active' || status === 'Completed' ? 'bg-green-100 text-green-700' : status === 'Draft' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
    {status}
  </span>
);
