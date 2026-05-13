import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, MailWarning, XCircle } from 'lucide-react';
import Header from '../../components/home/Header';
import { authService } from '../../services/authService';

type VerificationStatus = 'loading' | 'success' | 'error';

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return 'Email verification failed. Please request a new verification email.';
};

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');

    if (!userId || !secret) {
      setStatus('error');
      setMessage('Verification link is missing required information.');
      return;
    }

    authService.verifyEmail(userId, secret)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified successfully. You can now log in.');
      })
      .catch((error) => {
        setStatus('error');
        setMessage(getErrorMessage(error));
      });
  }, [searchParams]);

  const Icon = status === 'loading' ? Loader2 : status === 'success' ? CheckCircle2 : XCircle;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white text-gray-950">
      <Header />

      <main className="flex min-h-screen items-center justify-center px-5 pt-28">
        <section className="w-full max-w-lg rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-2xl shadow-blue-900/10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Icon className={`h-9 w-9 ${status === 'loading' ? 'animate-spin' : ''}`} />
          </div>

          <h1 className="mb-3 text-3xl font-black tracking-tight text-gray-950">
            {status === 'success' ? 'Email Verified' : status === 'error' ? 'Verification Failed' : 'Please Wait'}
          </h1>

          <p className="mx-auto mb-7 max-w-sm text-base font-medium leading-relaxed text-gray-600">
            {message}
          </p>

          {status === 'error' && (
            <div className="mb-7 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-left text-sm font-semibold text-amber-700">
              <MailWarning className="mt-0.5 h-5 w-5 shrink-0" />
              <span>Please log in and request a fresh verification email if this link has expired.</span>
            </div>
          )}

          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 font-extrabold text-white shadow-xl shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-600/30 active:scale-95"
          >
            Go to Login
          </Link>
        </section>
      </main>
    </div>
  );
};

export default VerifyEmail;
