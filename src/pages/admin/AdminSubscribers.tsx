import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { Panel, StatCard } from './AdminShared';
import { revenueService, type SubscriptionDoc } from '../../services/revenueService';

const AdminSubscribers = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionDoc[]>([]);

  useEffect(() => {
    revenueService.listSubscriptions().then((result) => setSubscriptions(result.documents));
  }, []);

  const active = subscriptions.filter((item) => item.status === 'Active' && new Date(item.expires_at).getTime() >= Date.now());

  return (
    <AdminLayout title="Subscribers">
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Active Subscribers" value={active.length} tone="green" />
        <StatCard label="Expired/Inactive" value={subscriptions.length - active.length} tone="amber" />
        <StatCard label="Total Records" value={subscriptions.length} />
      </div>
      <Panel title="Subscription Records">
        <div className="space-y-3">
          {subscriptions.map((subscription) => (
            <div key={subscription.$id} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_1fr_1fr_1fr]">
              <div><p className="font-black text-slate-950">{subscription.plan_name}</p><p className="text-sm font-semibold text-slate-500">{subscription.user_id}</p></div>
              <p className="font-bold text-slate-700">AI used: {subscription.ai_credits_used}</p>
              <p className="font-bold text-slate-700">Downloads: {subscription.downloads_used}</p>
              <p className="font-bold text-blue-700">Expires: {new Date(subscription.expires_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </Panel>
    </AdminLayout>
  );
};

export default AdminSubscribers;
