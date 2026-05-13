import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Crown } from 'lucide-react';
import { defaultPlans, getPlanKey, revenueService, type PlanDoc } from '../../services/revenueService';

const featureLines = (features?: string) => (features || '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean);

const PricingSection = () => {
  const [plans, setPlans] = useState<PlanDoc[]>(defaultPlans as PlanDoc[]);

  useEffect(() => {
    revenueService.listPlans(true)
      .then((result) => setPlans(result.documents.length ? result.documents : defaultPlans as PlanDoc[]))
      .catch(() => setPlans(defaultPlans as PlanDoc[]));
  }, []);

  return (
    <section id="pricing" className="border-y border-blue-100 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="mb-2 text-xs font-black uppercase tracking-widest text-blue-600">Pricing</p>
          <h2 className="text-3xl font-black text-gray-950 sm:text-4xl">Start free, upgrade when you need more.</h2>
          <p className="mt-3 text-lg font-medium leading-relaxed text-gray-600">Manual bKash payment, admin approval, and instant package access after confirmation.</p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <article key={plan.$id || plan.name} className={`rounded-3xl border p-6 shadow-sm ${plan.premium_templates ? 'border-blue-200 bg-blue-50/60 shadow-blue-900/10' : 'border-blue-100 bg-white'}`}>
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-black text-gray-950">{plan.name}</h3>
                  <p className="mt-1 text-sm font-bold text-gray-500">{plan.duration_days} days access</p>
                </div>
                {plan.premium_templates && <Crown className="h-6 w-6 text-blue-600" />}
              </div>
              <p className="mb-5 text-4xl font-black text-gray-950">BDT {plan.price_bdt}<span className="text-sm font-bold text-gray-500">/month</span></p>
              <ul className="mb-6 space-y-3">
                {(featureLines(plan.features).length ? featureLines(plan.features) : [
                  `${plan.ai_credits} AI credits/month`,
                  plan.download_limit < 0 ? 'Unlimited downloads' : `${plan.download_limit} downloads/month`,
                  plan.premium_templates ? 'Premium template downloads' : 'Premium template preview only',
                ]).map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm font-bold text-gray-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to={plan.price_bdt === 0 ? '/register' : `/user/billing?plan=${encodeURIComponent(getPlanKey(plan))}`} className="block rounded-2xl bg-blue-600 px-5 py-3 text-center font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">
                {plan.price_bdt === 0 ? 'Start Free' : 'Upgrade'}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
