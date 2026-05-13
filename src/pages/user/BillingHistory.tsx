import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import { Download, Eye, X } from 'lucide-react';
import UserLayout from './UserLayout';
import { revenueService, type PaymentRequestDoc } from '../../services/revenueService';
import { authService } from '../../services/authService';

const statusClass = (status: PaymentRequestDoc['status']) => (
  status === 'approved' ? 'bg-green-100 text-green-700'
    : status === 'rejected' ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700'
);

const statusLabel = (status: PaymentRequestDoc['status']) => (
  status === 'pending' ? 'In Review' : status === 'approved' ? 'Accepted' : 'Cancelled'
);

const downloadReceipt = (payment: PaymentRequestDoc) => {
  const pdf = new jsPDF();
  pdf.setFontSize(18);
  pdf.text('CareerCraft Payment Receipt', 16, 20);
  pdf.setFontSize(11);
  const rows = [
    ['Package', payment.plan_name],
    ['Amount', `BDT ${payment.amount_bdt}`],
    ['Transaction ID', payment.transaction_id],
    ['Sender Number', payment.sender_number],
    ['Status', statusLabel(payment.status)],
    ['Submitted', new Date(payment.submitted_at).toLocaleString()],
    ['Reviewed', payment.reviewed_at ? new Date(payment.reviewed_at).toLocaleString() : '-'],
    ['Admin Note', payment.admin_note || '-'],
  ];
  rows.forEach(([label, value], index) => {
    const y = 38 + index * 10;
    pdf.text(`${label}:`, 16, y);
    pdf.text(String(value), 58, y);
  });
  pdf.save(`payment-${payment.transaction_id || payment.$id}.pdf`);
};

const BillingHistory = () => {
  const [payments, setPayments] = useState<PaymentRequestDoc[]>([]);
  const [selected, setSelected] = useState<PaymentRequestDoc | null>(null);

  useEffect(() => {
    const load = async () => {
      const user = await authService.getCurrentUser();
      if (!user) return;
      const result = await revenueService.listMyPayments(user.$id);
      setPayments(result.documents);
    };
    void load();
  }, []);

  return (
    <UserLayout title="Billing History">
      <section className="mb-6 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-900/5">
        <h2 className="text-3xl font-black text-gray-950">Billing History</h2>
        <p className="mt-2 text-gray-600">Track every package payment, review status, and receipt.</p>
      </section>

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-900/5">
        <div className="space-y-3">
          {payments.length === 0 ? <p className="font-bold text-gray-500">No billing history yet.</p> : payments.map((payment) => (
            <article key={payment.$id} className="grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 lg:grid-cols-[1fr_0.8fr_0.8fr_0.8fr_auto] lg:items-center">
              <div>
                <p className="font-black text-gray-950">{payment.plan_name}</p>
                <p className="text-sm font-semibold text-gray-500">{new Date(payment.submitted_at).toLocaleDateString()}</p>
              </div>
              <p className="font-bold text-blue-700">BDT {payment.amount_bdt}</p>
              <p className="font-bold text-gray-600">Txn: {payment.transaction_id}</p>
              <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${statusClass(payment.status)}`}>{statusLabel(payment.status)}</span>
              <div className="flex gap-2 lg:justify-end">
                <button onClick={() => setSelected(payment)} className="rounded-xl bg-white p-3 text-blue-700 ring-1 ring-blue-100" title="View"><Eye className="h-4 w-4" /></button>
                <button onClick={() => downloadReceipt(payment)} className="rounded-xl bg-white p-3 text-green-700 ring-1 ring-blue-100" title="Download receipt"><Download className="h-4 w-4" /></button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-gray-950">{selected.plan_name}</h3>
                <p className="font-bold text-blue-700">BDT {selected.amount_bdt}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-xl bg-slate-100 p-2 text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold text-gray-700">
              <p>Status: <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(selected.status)}`}>{statusLabel(selected.status)}</span></p>
              <p>Transaction ID: {selected.transaction_id}</p>
              <p>Sender Number: {selected.sender_number}</p>
              <p>Submitted: {new Date(selected.submitted_at).toLocaleString()}</p>
              <p>Reviewed: {selected.reviewed_at ? new Date(selected.reviewed_at).toLocaleString() : '-'}</p>
              {selected.admin_note && <p>Admin Note: {selected.admin_note}</p>}
              {selected.screenshot_url && <a href={selected.screenshot_url} target="_blank" rel="noreferrer" className="inline-flex rounded-xl bg-white px-4 py-2 text-blue-700 ring-1 ring-blue-100">View screenshot</a>}
            </div>
            <button onClick={() => downloadReceipt(selected)} className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 font-black text-white">Download PDF Receipt</button>
          </div>
        </div>
      )}
    </UserLayout>
  );
};

export default BillingHistory;
