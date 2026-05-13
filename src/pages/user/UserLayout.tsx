import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, FileText, LayoutDashboard, LogOut, Menu, PenLine, ReceiptText, UserRound, WalletCards, X, Grid2X2, PlusCircle } from 'lucide-react';
import { authService } from '../../services/authService';

const navItems = [
  { label: 'Dashboard', to: '/user/dashboard', icon: LayoutDashboard },
  { label: 'Create CV', to: '/user/cv/create', icon: PlusCircle },
  { label: 'My CVs', to: '/user/dashboard#my-cvs', icon: FileText },
  { label: 'Templates', to: '/user/templates', icon: Grid2X2 },
  { label: 'View Plans', to: '/user/plans', icon: WalletCards },
  { label: 'Billing History', to: '/user/billing-history', icon: ReceiptText },
  { label: 'Profile', to: '/user/profile', icon: UserRound },
];

const UserLayout = ({ children, title }: { children: ReactNode; title: string }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [initials, setInitials] = useState('U');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    authService.getCurrentUser().then((user) => {
      const source = user?.name || user?.email || 'User';
      setInitials(source.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase());
    });
  }, []);

  const logout = async () => {
    await authService.logout();
    navigate('/login', { replace: true });
  };

  const sidebar = (
    <aside className="flex h-full flex-col border-r border-blue-100 bg-white">
      <Link to="/" className="flex items-center gap-3 border-b border-blue-100 px-6 py-5">
        <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-2 shadow-lg shadow-blue-600/20">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-lg font-black text-gray-950">CareerCraft</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">User Workspace</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-2 px-4 py-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <button onClick={() => void logout()} className="m-4 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-100">
        <LogOut className="h-5 w-5" />
        Logout
      </button>
    </aside>
  );

  return (
    <div className="min-h-screen bg-blue-50/50">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:block">{sidebar}</div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-gray-950/40 lg:hidden">
          <div className="h-full w-80 max-w-[86vw]">{sidebar}</div>
        </div>
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-blue-100 bg-white/90 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setMenuOpen(!menuOpen)} className="shrink-0 rounded-xl bg-blue-50 p-2.5 text-blue-700 lg:hidden">
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 sm:text-xs">Dashboard</p>
                <h1 className="truncate text-lg font-black text-gray-950 sm:text-2xl">{title}</h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button onClick={() => navigate('/user/cv/create')} className="hidden items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 sm:flex">
                <PenLine className="h-4 w-4" />
                Create New CV
              </button>
              <button onClick={() => navigate('/user/plans')} className="hidden items-center gap-2 rounded-2xl bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 ring-1 ring-blue-100 transition-all hover:bg-blue-100 sm:flex">
                <CreditCard className="h-4 w-4" />
                Upgrade
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-blue-700 sm:h-11 sm:w-11">{initials}</div>
            </div>
          </div>
        </header>

        <main className="px-3 py-4 pb-24 sm:px-6 sm:py-6 lg:px-8 lg:pb-6">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-blue-100 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-18px_40px_-30px_rgba(30,64,175,0.7)] backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to || (item.to.includes('#') && location.pathname === item.to.split('#')[0]);
            return (
              <Link key={item.label} to={item.to} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-black ${active ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate">{item.label.replace('View ', '').replace('Create ', 'Create')}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default UserLayout;
