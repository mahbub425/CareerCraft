import { Resend } from 'resend';

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getSubject = (type, payment) => {
  if (type === 'approved') return `Your ${payment.plan_name} package is active`;
  if (type === 'rejected') return `Payment review update for ${payment.plan_name}`;
  return `Payment submitted for ${payment.plan_name}`;
};

const getHtml = ({ type, payment, expiresAt, appUrl }) => {
  const heading = type === 'approved'
    ? 'Package activated'
    : type === 'rejected'
      ? 'Payment needs attention'
      : 'Payment submitted';

  const body = type === 'approved'
    ? `Your ${escapeHtml(payment.plan_name)} package has been confirmed. It is active until ${escapeHtml(formatDate(expiresAt))}.`
    : type === 'rejected'
      ? `Your payment for ${escapeHtml(payment.plan_name)} was not approved. Please check the note below and submit again if needed.`
      : `Thanks for your payment submission. Admin will review it very soon.`;

  return `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:28px;color:#111827">
      <h1 style="margin:0 0 12px;font-size:26px;color:#1d4ed8">${heading}</h1>
      <p style="font-size:16px;line-height:1.6">${body}</p>
      <div style="margin:22px 0;padding:18px;border:1px solid #dbeafe;border-radius:14px;background:#eff6ff">
        <p><strong>Plan:</strong> ${escapeHtml(payment.plan_name)}</p>
        <p><strong>Amount:</strong> BDT ${escapeHtml(payment.amount_bdt)}</p>
        <p><strong>Transaction ID:</strong> ${escapeHtml(payment.transaction_id)}</p>
        ${payment.admin_note ? `<p><strong>Admin note:</strong> ${escapeHtml(payment.admin_note)}</p>` : ''}
      </div>
      <a href="${escapeHtml(appUrl || '')}/user/dashboard" style="display:inline-block;background:#2563eb;color:white;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:700">Open Dashboard</a>
      <p style="margin-top:24px;color:#6b7280;font-size:13px">CareerCraft CV Builder</p>
    </div>
  `;
};

export const sendPaymentStatusEmail = async ({ type, payment, expiresAt }, env = process.env) => {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    console.warn('Resend email skipped: RESEND_API_KEY or RESEND_FROM_EMAIL is missing.');
    return { skipped: true };
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const subject = getSubject(type, payment);
  const html = getHtml({ type, payment, expiresAt, appUrl: env.APP_URL || env.OPENROUTER_SITE_URL || 'http://localhost:5173' });
  const { data, error } = await resend.emails.send(
    {
      from: env.RESEND_FROM_EMAIL,
      to: [payment.user_email],
      subject,
      html,
      replyTo: env.ADMIN_NOTIFICATION_EMAIL || undefined,
      tags: [
        { name: 'type', value: `payment_${type}` },
        { name: 'payment_id', value: String(payment.$id || payment.transaction_id).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 256) },
      ],
    },
    {
      idempotencyKey: `payment-${type}-${payment.$id || payment.transaction_id}`,
    },
  );

  if (error) throw new Error(error.message || 'Resend email failed.');
  return data;
};
