import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Upload } from 'lucide-react';
import UserLayout from './UserLayout';
import { getPlanKey, revenueService, type BillingSettingsDoc, type PlanDoc } from '../../services/revenueService';
import { authService } from '../../services/authService';
import { showToast } from '../../lib/toast';

const inputClass = 'w-full rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 font-semibold text-gray-950 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100';

const BillingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedPlanId = searchParams.get('plan') || '';
  const [plans, setPlans] = useState<PlanDoc[]>([]);
  const [settings, setSettings] = useState<BillingSettingsDoc | null>(null);
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    Promise.all([revenueService.listPlans(true), revenueService.getBillingSettings()])
      .then(([planResult, billing]) => {
        setPlans(planResult.documents.filter((plan) => plan.price_bdt > 0));
        setSettings(billing);
      });
  }, []);

  const selectedPlan = useMemo(() => {
    if (!plans.length) return null;
    if (!selectedPlanId) return plans[0];
    return plans.find((plan) => getPlanKey(plan) === selectedPlanId || plan.$id === selectedPlanId || plan.name === selectedPlanId) || plans[0];
  }, [plans, selectedPlanId]);

  const submitPayment = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedPlan) return;
    if (!senderNumber.trim() || !transactionId.trim()) {
      showToast('Sender number and transaction ID are required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Please login before submitting payment.');
      const screenshotUrl = screenshot ? await revenueService.uploadPaymentProof(screenshot, user.$id) : '';
      await revenueService.submitPayment(selectedPlan, { senderNumber, transactionId, screenshotUrl });
      setSuccessOpen(true);
      setSenderNumber('');
      setTransactionId('');
      setScreenshot(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Payment submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <UserLayout title="Billing">
      <section className="mb-6 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-900/5">
        <Link to="/user/plans" className="mb-4 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700"><ArrowLeft className="h-4 w-4" /> Back to plans</Link>
        <h2 className="text-3xl font-black text-gray-950">Billing Information</h2>
        <p className="mt-2 text-gray-600">Submit your bKash payment proof for admin review.</p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1fr]">
        <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-900/5">
          <h3 className="mb-4 text-2xl font-black text-gray-950">Selected Package</h3>
          {selectedPlan ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-2xl font-black text-gray-950">{selectedPlan.name}</p>
              <p className="mt-2 text-4xl font-black text-blue-700">BDT {selectedPlan.price_bdt}</p>
              <div className="mt-5 space-y-2 text-sm font-bold text-gray-700">
                <p><CheckCircle2 className="mr-2 inline h-4 w-4 text-blue-600" /> {selectedPlan.ai_credits} AI credits</p>
                <p><CheckCircle2 className="mr-2 inline h-4 w-4 text-blue-600" /> {selectedPlan.download_limit < 0 ? 'Unlimited downloads' : `${selectedPlan.download_limit} downloads`}</p>
                <p><CheckCircle2 className="mr-2 inline h-4 w-4 text-blue-600" /> Premium template downloads</p>
              </div>
            </div>
          ) : <p className="font-bold text-gray-500">Loading package...</p>}
        </section>

        <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-900/5">
          <h3 className="mb-4 text-2xl font-black text-gray-950">Manual bKash Payment</h3>
          <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
            <p>bKash Number: {settings?.bkash_number || '01XXXXXXXXX'}</p>
            <p>Amount: BDT {selectedPlan?.price_bdt || 0}</p>
            <p className="mt-2 font-semibold text-blue-600">{settings?.payment_instruction}</p>
          </div>
          <form onSubmit={submitPayment} className="space-y-4">
            <input className={inputClass} value={senderNumber} onChange={(event) => setSenderNumber(event.target.value)} placeholder="Sender bKash number" />
            <input className={inputClass} value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder="Transaction ID" />
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-black text-blue-700 hover:bg-blue-100">
              <Upload className="h-4 w-4" />
              {screenshot ? screenshot.name : 'Upload payment screenshot'}
              <input type="file" accept="image/*" onChange={(event) => setScreenshot(event.target.files?.[0] || null)} className="hidden" />
            </label>
            <button disabled={submitting || !selectedPlan} className="w-full rounded-xl bg-blue-600 px-6 py-4 font-black text-white shadow-lg shadow-blue-600/20 disabled:opacity-60">
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </form>
        </section>
      </div>

      {successOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-600" />
            <h3 className="mb-3 text-2xl font-black text-gray-950">Payment Submitted</h3>
            <p className="mb-6 font-semibold leading-relaxed text-gray-600">Thanks. Admin will review your payment very soon. You can check the status in Billing History.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button onClick={() => navigate('/user/billing-history')} className="rounded-xl bg-blue-600 px-5 py-3 font-black text-white">Billing History</button>
              <button onClick={() => setSuccessOpen(false)} className="rounded-xl bg-slate-100 px-5 py-3 font-black text-slate-700">Close</button>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
};

export default BillingPage;
