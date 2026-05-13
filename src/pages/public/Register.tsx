import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, FileText, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/home/Header';
import { isAppwriteConfigured } from '../../lib/appwrite';
import { authService } from '../../services/authService';
import heroImage from '../../assets/images/hero.png';

const userTypes = ['Student', 'Fresh Graduate', 'Professional'] as const;

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.29h6.47a5.53 5.53 0 0 1-2.4 3.63v2.96h3.89c2.27-2.09 3.53-5.17 3.53-8.61Z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.89-2.96c-1.08.72-2.46 1.15-4.06 1.15-3.12 0-5.77-2.1-6.72-4.93H1.27v3.05A12 12 0 0 0 12 24Z" />
    <path fill="#FBBC05" d="M5.28 14.35A7.22 7.22 0 0 1 4.9 12c0-.82.14-1.61.38-2.35V6.6H1.27A12 12 0 0 0 0 12c0 1.94.46 3.78 1.27 5.4l4.01-3.05Z" />
    <path fill="#EA4335" d="M12 4.72c1.76 0 3.34.6 4.58 1.79l3.45-3.45C17.95 1.12 15.23 0 12 0A12 12 0 0 0 1.27 6.6l4.01 3.05C6.23 6.82 8.88 4.72 12 4.72Z" />
  </svg>
);

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
};

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<(typeof userTypes)[number]>('Student');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!isAppwriteConfigured) {
      setError('Appwrite endpoint/project is not configured. Please check your .env file.');
      return;
    }

    if (!name || !email || !password || !confirmPassword) {
      setError('Name, email, password, and confirm password are required.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and confirm password do not match.');
      return;
    }

    if (!acceptedTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.register(email, password, name, userType);
      setSuccessMessage('Account created successfully! Please check your email to verify your account. Redirecting to login page...');
      // Redirect to login page after showing success message
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white text-gray-950">
      <Header />

      <main className="relative overflow-hidden pt-28">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(37,99,235,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.05)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />

        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8 lg:py-20">
          <section className="mx-auto w-full max-w-xl rounded-3xl border border-blue-100 bg-white/90 p-6 shadow-2xl shadow-blue-900/10 backdrop-blur sm:p-8 lg:mx-0">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">
              <Sparkles className="h-4 w-4" />
              Start Your CV Journey
            </div>

            <h1 className="mb-4 text-4xl font-black tracking-tight text-gray-950 sm:text-5xl">Create Account</h1>
            <p className="mb-8 max-w-lg text-lg leading-relaxed text-gray-600">
              Sign up to save your CV, edit anytime, and download professional templates.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="mb-2 block text-xs font-extrabold tracking-widest text-gray-700">Full Name</label>
                <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-4 text-gray-700 shadow-inner shadow-blue-900/5 transition-colors focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                  <UserRound className="h-5 w-5 text-blue-600" />
                  <input id="name" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" className="w-full bg-transparent text-base font-medium text-gray-950 outline-none placeholder:text-gray-400" />
                </div>
              </div>

              <div>
                <label htmlFor="register-email" className="mb-2 block text-xs font-extrabold tracking-widest text-gray-700">Email Address</label>
                <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-4 text-gray-700 shadow-inner shadow-blue-900/5 transition-colors focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <input id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" className="w-full bg-transparent text-base font-medium text-gray-950 outline-none placeholder:text-gray-400" />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="register-password" className="mb-2 block text-xs font-extrabold tracking-widest text-gray-700">Password</label>
                  <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-4 text-gray-700 shadow-inner shadow-blue-900/5 transition-colors focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                    <LockKeyhole className="h-5 w-5 text-blue-600" />
                    <input id="register-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="w-full min-w-0 bg-transparent text-base font-medium text-gray-950 outline-none placeholder:text-gray-400" />
                    <button type="button" onClick={() => setShowPassword((current) => !current)} className="text-gray-400 transition-colors hover:text-blue-700" aria-label="Show password">
                      <Eye className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="mb-2 block text-xs font-extrabold tracking-widest text-gray-700">Confirm</label>
                  <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-4 text-gray-700 shadow-inner shadow-blue-900/5 transition-colors focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                    <LockKeyhole className="h-5 w-5 text-blue-600" />
                    <input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="••••••••" className="w-full min-w-0 bg-transparent text-base font-medium text-gray-950 outline-none placeholder:text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="user-type" className="mb-2 block text-xs font-extrabold tracking-widest text-gray-700">I am a</label>
                <select
                  id="user-type"
                  value={userType}
                  onChange={(event) => setUserType(event.target.value as (typeof userTypes)[number])}
                  className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-4 text-base font-bold text-gray-950 outline-none transition-colors focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  {userTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-3 text-sm font-medium leading-relaxed text-gray-600">
                <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5 h-5 w-5 rounded border-blue-200 bg-white accent-blue-600" />
                <span>
                  I agree to the <a href="#terms" className="font-bold text-blue-700 hover:text-blue-900">Terms of Service</a> and <a href="#privacy" className="font-bold text-blue-700 hover:text-blue-900">Privacy Policy</a>.
                </span>
              </label>

              {successMessage && (
                <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-600">
                  {successMessage}
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                  {error}
                </div>
              )}

              <button disabled={isSubmitting || !!successMessage} className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 font-extrabold text-white shadow-xl shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-600/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70">
                {successMessage ? 'Redirecting...' : isSubmitting ? 'Creating account...' : 'Create Account'}
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>

            <div className="my-8 flex items-center gap-5">
              <div className="h-px flex-1 bg-blue-100" />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">or sign up with</span>
              <div className="h-px flex-1 bg-blue-100" />
            </div>

            <button type="button" className="flex w-full items-center justify-center gap-4 rounded-xl border border-blue-100 bg-white px-6 py-4 font-bold text-gray-700 shadow-sm shadow-blue-900/5 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
              <GoogleIcon />
              Sign up with Google
            </button>

            <p className="mt-8 text-center text-sm font-medium text-gray-600">
              Already have an account? <Link to="/login" className="font-extrabold text-blue-700 hover:text-blue-900">Login</Link>
            </p>
          </section>

          <section className="hidden lg:block">
            <div className="relative ml-auto max-w-2xl rounded-[2rem] border border-blue-100 bg-white/70 p-6 shadow-2xl shadow-blue-900/10 backdrop-blur">
              <div className="relative min-h-[540px] overflow-hidden rounded-3xl border border-blue-100 bg-blue-50">
                <img src={heroImage} alt="Professional CV template preview" className="absolute inset-0 h-full w-full object-cover opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-blue-950/62 to-slate-950/88" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(37,99,235,0.35),transparent_34%)]" />
                <div className="relative z-10 flex min-h-[540px] flex-col justify-end p-10">
                  <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/25">
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                  <h2 className="mb-5 max-w-xl text-4xl font-black leading-tight text-white drop-shadow">
                    Start Strong with a Career-Ready CV
                  </h2>
                  <p className="mb-8 max-w-xl text-xl leading-relaxed text-blue-50 drop-shadow">
                    Save your profile once, customize templates anytime, and download polished CV files when you need them.
                  </p>

                  <div className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/35 bg-white/90 p-5 shadow-xl shadow-blue-950/20 backdrop-blur-md template-card-motion transition-all duration-500 hover:border-blue-200 hover:bg-white hover:shadow-2xl hover:shadow-blue-950/25">
                    <div className="absolute inset-y-0 -left-24 w-20 rotate-12 bg-white/60 blur-xl template-card-shine" />
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                      <FileText className="h-7 w-7 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Free Account Includes</p>
                      <p className="text-lg font-medium text-gray-950">Template preview and saved drafts</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-blue-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 text-sm font-semibold text-gray-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
            <span className="text-xl font-extrabold text-gray-950">CareerCraft</span>
            <span>© 2026 CareerCraft. Professional resume building simplified.</span>
          </div>
          <div className="flex flex-wrap gap-5">
            <a href="#privacy" className="hover:text-blue-700">Privacy Policy</a>
            <a href="#terms" className="hover:text-blue-700">Terms of Service</a>
            <a href="#help" className="hover:text-blue-700">Help Center</a>
            <a href="#cookies" className="hover:text-blue-700">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Register;
