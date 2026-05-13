import { useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import { Panel, StatCard } from './AdminShared';
import { revenueService, type PaymentRequestDoc } from '../../services/revenueService';
import { showToast } from '../../lib/toast';

const AdminPayments = () => {
  const [payments, setPayments] = useState<PaymentRequestDoc[]>([]);
  const [note, setNote] = useState('');

  const load = () => revenueService.listPayments().then((result) => {
    const statusRank = { pending: 0, approved: 1, rejected: 2 };
    setPayments(result.documents.toSorted((a, b) => statusRank[a.status] - statusRank[b.status]));
  });

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(() => ({
    pending: payments.filter((payment) => payment.status === 'pending').length,
    approvedRevenue: payments.filter((payment) => payment.status === 'approved').reduce((sum, payment) => sum + (payment.amount_bdt || 0), 0),
  }), [payments]);

  const approve = async (payment: PaymentRequestDoc) => {
    await revenueService.approvePayment(payment, note);
    setNote('');
    showToast('Payment approved and package activated.');
    await load();
  };

  const reject = async (payment: PaymentRequestDoc) => {
    const defaultNote = payment.status === 'approved'
      ? 'Payment approval was reversed by admin. Package access has been cancelled.'
      : 'Payment information could not be verified.';
    await revenueService.rejectPayment(payment, note || defaultNote);
    setNote('');
    showToast(payment.status === 'approved' ? 'Approved payment reversed and rejected.' : 'Payment rejected.');
    await load();
  };

  return (
    <AdminLayout title="Payments">
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Pending Payments" value={stats.pending} tone="amber" />
        <StatCard label="Approved Revenue" value={`BDT ${stats.approvedRevenue}`} tone="green" />
        <StatCard label="Total Requests" value={payments.length} />
      </div>

      <Panel title="Manual bKash Payment Review">
        <div className="mb-4">
          <label className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-slate-600">Admin Note</label>
          <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional approval/rejection note" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" />
        </div>
        <div className="space-y-4">
          {payments.map((payment) => (
            <article key={payment.$id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr_0.7fr_0.7fr_auto] lg:items-center">
                <div>
                  <p className="font-black text-slate-950">{payment.user_name || payment.user_email}</p>
                  <p className="text-sm font-semibold text-slate-500">{payment.user_email}</p>
                  <p className="mt-1 text-sm font-bold text-blue-700">{payment.plan_name} - BDT {payment.amount_bdt}</p>
                </div>
                <p className="min-w-0 break-words font-bold text-slate-700">Sender: {payment.sender_number}</p>
                <p className="min-w-0 break-words font-bold text-slate-700">Txn: {payment.transaction_id}</p>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${payment.status === 'approved' ? 'bg-green-100 text-green-700' : payment.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{payment.status}</span>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                  {payment.screenshot_url && <a href={payment.screenshot_url} target="_blank" rel="noreferrer" className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">Proof</a>}
                  {payment.status !== 'approved' && (
                    <>
                      <button onClick={() => void approve(payment)} className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white">Approve</button>
                    </>
                  )}
                  {payment.status !== 'rejected' && (
                    <>
                      <button onClick={() => void reject(payment)} className="rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600">Reject</button>
                    </>
                  )}
                </div>
              </div>
              {payment.admin_note && <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">Note: {payment.admin_note}</p>}
            </article>
          ))}
        </div>
      </Panel>
    </AdminLayout>
  );
};

export default AdminPayments;
