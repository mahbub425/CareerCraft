import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, Code2, CreditCard, FileText, FolderOpen, Globe, Home, LayoutDashboard, LogOut, Menu, Newspaper, PenLine, Settings, ShieldCheck, UserRound, UsersRound, WalletCards, X } from 'lucide-react';
import { authService } from '../../services/authService';

const navItems = [
  { label: 'Overview', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', to: '/admin/users', icon: UsersRound },
  { label: 'Template Builder', to: '/admin/template-builder', icon: Code2 },
  { label: 'Template Gallery', to: '/admin/template-gallery', icon: FileText },
  { label: 'Categories', to: '/admin/categories', icon: FolderOpen },
  { label: 'CV Activity', to: '/admin/cv-activity', icon: BarChart3 },
  { label: 'Packages', to: '/admin/packages', icon: WalletCards },
  { label: 'Payments', to: '/admin/payments', icon: CreditCard },
  { label: 'Subscribers', to: '/admin/subscribers', icon: UsersRound },
  { label: 'Home Page Content', to: '/admin/site-content', icon: Home },
  { label: 'About Developer', to: '/admin/about-developer', icon: Newspaper },
  { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
];

const AdminLayout = ({ children, title }: { children: ReactNode; title: string }) => {
  const [open, setOpen] = useState(false);
  const [adminName, setAdminName] = useState('Admin');
  const navigate = useNavigate();

  useEffect(() => {
    authService.getCurrentUser().then((user) => setAdminName(user?.name || 'Admin'));
  }, []);

  const logout = async () => {
    await authService.logout();
    navigate('/login', { replace: true });
  };

  const sidebar = (
    <aside className="flex h-full flex-col border-r border-slate-800 bg-slate-950 text-white">
      <Link to="/admin/dashboard" className="flex items-center gap-3 border-b border-slate-800 px-6 py-5">
        <div className="rounded-xl bg-blue-600 p-2 shadow-lg shadow-blue-950/40">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-lg font-black">Admin Panel</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">CareerCraft</p>
        </div>
      </Link>
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
        <div className="mb-4 rounded-3xl border border-blue-500/20 bg-blue-500/10 p-3">
          <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-widest text-blue-300">User Workspace</p>
          <Link to="/user/dashboard" onClick={() => setOpen(false)} className="mb-2 flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-blue-600">
            <UserRound className="h-5 w-5" />
            My User Dashboard
          </Link>
          <Link to="/user/cv/create" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition-all hover:bg-blue-500">
            <PenLine className="h-5 w-5" />
            Create CV
          </Link>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30' : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <button onClick={() => void logout()} className="m-4 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
        <LogOut className="h-5 w-5" />
        Logout
      </button>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 lg:hidden">
          <div className="h-full w-80 max-w-[86vw]">{sidebar}</div>
        </div>
      )}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setOpen(!open)} className="shrink-0 rounded-xl bg-blue-50 p-2 text-blue-700 lg:hidden">
                {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 sm:text-xs">Admin</p>
                <h1 className="truncate text-lg font-black text-slate-950 sm:text-2xl">{title}</h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Link to="/" className="hidden items-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 sm:flex">
                <Globe className="h-4 w-4" />
                View Website
              </Link>
              <Link to="/user/dashboard" className="hidden items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white sm:flex">
                <UserRound className="h-4 w-4" />
                User Mode
              </Link>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white sm:h-11 sm:w-11">{adminName.slice(0, 2).toUpperCase()}</div>
            </div>
          </div>
        </header>
        <main className="px-3 py-4 sm:px-6 sm:py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
