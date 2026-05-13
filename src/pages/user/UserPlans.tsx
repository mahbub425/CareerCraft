import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Crown } from 'lucide-react';
import UserLayout from './UserLayout';
import { defaultPlans, getPlanKey, revenueService, type Entitlement, type PlanDoc } from '../../services/revenueService';
import { authService } from '../../services/authService';

const lines = (value?: string) => (value || '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
const isExpired = (expiresAt?: string) => Boolean(expiresAt && new Date(expiresAt).getTime() < Date.now());

const UserPlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanDoc[]>([]);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [renewPlanId, setRenewPlanId] = useState('');

  useEffect(() => {
    const load = async () => {
      const user = await authService.getCurrentUser();
      const [planResult, currentEntitlement, latestPaidSubscription] = await Promise.all([
        revenueService.listPlans(true),
        user ? revenueService.getEntitlement(user.$id) : Promise.resolve(null),
        user ? revenueService.getLatestPaidSubscription(user.$id) : Promise.resolve(null),
      ]);
      const nextPlans = planResult.documents.length ? planResult.documents : defaultPlans as PlanDoc[];
      const latestPaidPlan = latestPaidSubscription
        ? nextPlans.find((plan) => getPlanKey(plan) === latestPaidSubscription.plan_id || plan.$id === latestPaidSubscription.plan_id || plan.name === latestPaidSubscription.plan_name)
        : null;
      setPlans(nextPlans);
      setEntitlement(currentEntitlement);
      setRenewPlanId(latestPaidPlan && isExpired(latestPaidSubscription?.expires_at) ? getPlanKey(latestPaidPlan) : '');
    };
    void load();
  }, []);

  const currentPlanIndex = plans.findIndex((plan) => {
    const planKey = getPlanKey(plan);
    return planKey === (renewPlanId || entitlement?.planId) || plan.$id === (renewPlanId || entitlement?.planId) || plan.name === entitlement?.planName;
  });
  const currentPlan = currentPlanIndex >= 0 ? plans[currentPlanIndex] : null;
  const quotaFinished = Boolean(entitlement && (entitlement.aiRemaining <= 0 || entitlement.downloadsRemaining <= 0));
  const needsRenew = Boolean(renewPlanId || (entitlement && isExpired(entitlement.expiresAt)) || (entitlement?.isPaid && quotaFinished));
  const currentPlanName = currentPlan?.name || entitlement?.planName || 'Free';

  return (
    <UserLayout title="View Plans">
      <section className="mb-6 rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-xl shadow-blue-600/15">
        <p className="mb-2 text-sm font-black uppercase tracking-widest text-blue-100">Plans</p>
        <h2 className="text-3xl font-black">Choose the package that fits your CV work.</h2>
        <p className="mt-3 max-w-2xl text-blue-100">Current plan: {currentPlanName}{needsRenew ? ' - renewal needed' : ''}</p>
      </section>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan, index) => {
          const planKey = getPlanKey(plan);
          const isCurrent = planKey === (renewPlanId || entitlement?.planId) || plan.$id === (renewPlanId || entitlement?.planId) || plan.name === currentPlanName;
          const canRenewCurrent = isCurrent && needsRenew;
          const isDisabledCurrent = isCurrent && !canRenewCurrent;
          const buttonLabel = isDisabledCurrent
            ? 'Current Package'
            : canRenewCurrent
              ? 'Renew Package'
              : currentPlan && index < currentPlanIndex
                ? 'Downgrade Package'
                : currentPlan && index > currentPlanIndex
                  ? 'Upgrade Package'
                  : 'Select Package';
          return (
            <article key={plan.$id || plan.name} className={`rounded-3xl border p-6 shadow-sm ${isCurrent ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-100' : 'border-blue-100 bg-white'}`}>
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-black text-gray-950">{plan.name}</h3>
                  <p className="text-sm font-bold text-gray-500">{plan.duration_days} days</p>
                </div>
                {plan.premium_templates && <Crown className="h-6 w-6 text-blue-600" />}
              </div>
              <p className="mb-5 text-4xl font-black text-gray-950">BDT {plan.price_bdt}</p>
              <ul className="mb-6 space-y-3">
                {(lines(plan.features).length ? lines(plan.features) : [`${plan.ai_credits} AI credits`, plan.download_limit < 0 ? 'Unlimited downloads' : `${plan.download_limit} downloads`, plan.premium_templates ? 'Premium templates' : 'Free templates only']).map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm font-bold text-gray-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /> {feature}</li>
                ))}
              </ul>
              {plan.price_bdt === 0 && !canRenewCurrent ? (
                <button disabled className="w-full rounded-2xl bg-slate-100 px-5 py-3 font-black text-slate-500">{currentPlan && !isCurrent ? buttonLabel : isCurrent ? 'Current Package' : 'Free Package'}</button>
              ) : (
                <button disabled={isDisabledCurrent} onClick={() => navigate(`/user/billing?plan=${encodeURIComponent(planKey)}`)} className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-500 disabled:shadow-none">
                  {buttonLabel}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </UserLayout>
  );
};

export default UserPlans;
