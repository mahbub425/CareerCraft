import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, CreditCard, FileText, LogIn, LogOut, Menu, User, X } from 'lucide-react';
import { authService } from '../../services/authService';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<{ labels?: string[]; name?: string; email?: string } | null>(null);
  const navigate = useNavigate();
  const dashboardPath = user?.labels?.includes('admin') ? '/admin/dashboard' : '/user/dashboard';
  const initials = (user?.name || user?.email || 'U')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    };
    checkUser();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setAccountOpen(false);
    setIsOpen(false);
    navigate('/');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
      isScrolled ? 'border-blue-100 bg-white/95 py-3 shadow-[0_12px_40px_-28px_rgba(37,99,235,0.55)] backdrop-blur-xl' : 'border-transparent bg-white/85 py-5 backdrop-blur-xl'
    }`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="group flex min-w-0 items-center gap-2">
            <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-2 shadow-lg shadow-blue-600/20 transition-transform group-hover:rotate-6">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-xl font-bold text-gray-900">CareerCraft</span>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Simple CV Builder</span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden items-center gap-5 lg:flex">
            <div className="flex items-center gap-1 rounded-full border border-blue-100 bg-white/70 p-1 shadow-sm shadow-blue-900/5">
              <Link to="/" className="rounded-full px-3 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-700">Home</Link>
              <a href="/#templates" className="rounded-full px-3 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-700">Templates</a>
              <a href="/#pricing" className="rounded-full px-3 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-700">Pricing</a>
              <a href="#how-it-works" className="rounded-full px-3 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-700">How It Works</a>
              <a href="#about-developer" className="rounded-full px-3 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-700">About</a>
            </div>

            <div className="flex items-center gap-3">
              {!user ? (
                <>
                  <Link to="/login" className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700">
                    <LogIn className="h-4 w-4" /> Login
                  </Link>
                  <Link to="/register" className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/25 active:scale-95">
                    Register
                  </Link>
                </>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setAccountOpen((current) => !current)}
                    className="flex items-center gap-3 rounded-full border border-blue-100 bg-white px-2.5 py-2 text-left shadow-sm shadow-blue-900/5 transition-colors hover:bg-blue-50"
                    aria-expanded={accountOpen}
                    aria-label="Open account menu"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">{initials}</span>
                    <span className="hidden min-w-0 max-w-32 xl:block">
                      <span className="block truncate text-sm font-black text-gray-950">{user.name || 'My Account'}</span>
                      <span className="block truncate text-[11px] font-bold text-gray-500">{user.labels?.includes('admin') ? 'Admin' : 'Member'}</span>
                    </span>
                    <ChevronDown className={`h-4 w-4 text-blue-700 transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {accountOpen && (
                    <div className="absolute right-0 top-[calc(100%+0.75rem)] w-72 overflow-hidden rounded-3xl border border-blue-100 bg-white p-2 shadow-2xl shadow-blue-950/15">
                      <div className="rounded-2xl bg-blue-50 p-4">
                        <p className="truncate text-sm font-black text-gray-950">{user.name || 'CareerCraft User'}</p>
                        <p className="truncate text-xs font-semibold text-gray-500">{user.email}</p>
                      </div>
                      <Link to={dashboardPath} onClick={() => setAccountOpen(false)} className="mt-2 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700">
                        <User className="h-4 w-4" />
                        {user.labels?.includes('admin') ? 'Admin Dashboard' : 'My Dashboard'}
                      </Link>
                      {user.labels?.includes('admin') && (
                        <Link to="/user/dashboard" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700">
                          <User className="h-4 w-4" />
                          User Workspace
                        </Link>
                      )}
                      <Link to="/user/plans" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700">
                        <CreditCard className="h-4 w-4" />
                        View Plans
                      </Link>
                      <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50">
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            {user && (
              <Link to={dashboardPath} className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white shadow-lg shadow-blue-600/20" title="User Dashboard">
                {initials}
              </Link>
            )}
            <button onClick={() => setIsOpen(!isOpen)} className="rounded-xl p-2 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-700">
              {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full max-h-[calc(100vh-4.5rem)] overflow-y-auto border-t border-blue-100 bg-white shadow-2xl shadow-blue-900/10 animate-in slide-in-from-top lg:hidden">
          <div className="space-y-3 px-4 py-5">
            <Link to="/" onClick={() => setIsOpen(false)} className="block rounded-xl px-4 py-3 text-lg font-bold text-gray-800 transition-colors hover:bg-blue-50 hover:text-blue-700">Home</Link>
            <a href="/#templates" onClick={() => setIsOpen(false)} className="block rounded-xl px-4 py-3 text-lg font-bold text-gray-800 transition-colors hover:bg-blue-50 hover:text-blue-700">Templates</a>
            <a href="/#pricing" onClick={() => setIsOpen(false)} className="block rounded-xl px-4 py-3 text-lg font-bold text-gray-800 transition-colors hover:bg-blue-50 hover:text-blue-700">Pricing</a>
            <a href="#how-it-works" onClick={() => setIsOpen(false)} className="block rounded-xl px-4 py-3 text-lg font-bold text-gray-800 transition-colors hover:bg-blue-50 hover:text-blue-700">How It Works</a>
            <a href="#about-developer" onClick={() => setIsOpen(false)} className="block rounded-xl px-4 py-3 text-lg font-bold text-gray-800 transition-colors hover:bg-blue-50 hover:text-blue-700">About Developer</a>
            
            <div className="pt-4 border-t border-gray-100">
              {!user ? (
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/login" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-3 font-bold text-blue-700 ring-1 ring-blue-100">
                    <LogIn className="w-5 h-5" /> Login
                  </Link>
                  <Link to="/register" onClick={() => setIsOpen(false)} className="flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 font-bold text-white shadow-lg shadow-blue-600/20">
                    Register
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="truncate font-black text-gray-950">{user.name || 'CareerCraft User'}</p>
                    <p className="truncate text-sm font-semibold text-gray-500">{user.email}</p>
                  </div>
                  <Link to={dashboardPath} onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white shadow-lg shadow-blue-600/20">
                    <User className="h-5 w-5" />
                    {user.labels?.includes('admin') ? 'Admin Dashboard' : 'My Dashboard'}
                  </Link>
                  <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 font-bold text-red-600">
                    <LogOut className="h-5 w-5" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;
