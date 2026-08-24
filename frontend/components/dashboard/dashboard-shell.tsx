'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Bot,
  LayoutDashboard,
  LogOut,
  Menu,
  MoonStar,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Sun,
  Users,
  Wallet,
  X,
  ArrowLeft
} from 'lucide-react';
import { getSession, logout, type AuthUser } from '@/lib/auth';

type DashboardThemeContextValue = {
  darkMode: boolean;
  toggleDarkMode: () => void;
};

const DashboardThemeContext = createContext<DashboardThemeContextValue>({
  darkMode: false,
  toggleDarkMode: () => {}
});

export function useDashboardTheme() {
  return useContext(DashboardThemeContext);
}

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Customers', href: '/dashboard/customers', icon: Users },
  { label: 'Orders', href: '/dashboard/orders', icon: ShoppingBag },
  { label: 'Inventory', href: '/dashboard/inventory', icon: Package },
  { label: 'Finance', href: '/dashboard/finance', icon: Wallet },
  { label: 'AI Assistant', href: '/dashboard/ai', icon: Bot }
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('intellibiz-theme');
    if (storedTheme === 'dark') setDarkMode(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    window.localStorage.setItem('intellibiz-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    // The middleware already redirects unauthenticated requests to /auth; this is
    // a client-side fallback (e.g. if cookies are blocked) plus how we populate
    // the signed-in user's name in the top bar.
    const session = getSession();
    if (!session) {
      router.replace('/auth');
      return;
    }
    setUser(session.user);
  }, [router]);

  const toggleDarkMode = () => setDarkMode((value) => !value);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '··';

  const pageBg = darkMode
    ? 'bg-slate-950 text-slate-100'
    : 'bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_34%),linear-gradient(135deg,#f8fafc_0%,#eef4ff_100%)] text-slate-900';

  const sidebarClass = darkMode
    ? 'border-white/10 bg-slate-900/70'
    : 'border-slate-200/80 bg-white/80';

  const topbarClass = darkMode
    ? 'border-white/10 bg-slate-900/60'
    : 'border-slate-200/80 bg-white/70';

  return (
    <DashboardThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <div className={`min-h-screen ${pageBg}`}>
        <div className="mx-auto flex max-w-[1600px]">
          {/* Desktop sidebar */}
          <aside className={`sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r px-4 py-6 backdrop-blur-xl lg:flex ${sidebarClass}`}>
            <Link href="/" className={`flex items-center gap-3 px-2 text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <span className={`flex h-10 w-10 items-center justify-center rounded-full ${darkMode ? 'bg-cyan-400/10 text-cyan-300' : 'bg-slate-950 text-white'}`}>
                <Sparkles className="h-5 w-5" />
              </span>
              <span>
                Ceylon IntelliBiz
                <span className={`block text-xs font-normal ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Workspace</span>
              </span>
            </Link>

            <nav className="mt-8 flex flex-1 flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? darkMode
                          ? 'bg-cyan-400/10 text-cyan-300'
                          : 'bg-slate-950 text-white shadow-sm'
                        : darkMode
                          ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex flex-col gap-1 border-t pt-3 text-sm font-medium border-slate-200/70 dark:border-white/10">
              <Link
                href="/dashboard/settings"
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition ${darkMode ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                <Settings className="h-4 w-4" /> Settings
              </Link>
              <Link
                href="/"
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition ${darkMode ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                <ArrowLeft className="h-4 w-4" /> Back to site
              </Link>
            </div>
          </aside>

          {/* Mobile nav drawer */}
          <AnimatePresence>
            {mobileNavOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileNavOpen(false)}
                  className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
                />
                <motion.aside
                  initial={{ x: -280 }}
                  animate={{ x: 0 }}
                  exit={{ x: -280 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r px-4 py-6 backdrop-blur-xl lg:hidden ${sidebarClass} ${darkMode ? 'bg-slate-950' : 'bg-white'}`}
                >
                  <div className="flex items-center justify-between px-1">
                    <Link href="/" className={`flex items-center gap-2 text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${darkMode ? 'bg-cyan-400/10 text-cyan-300' : 'bg-slate-950 text-white'}`}>
                        <Sparkles className="h-4 w-4" />
                      </span>
                      Ceylon IntelliBiz
                    </Link>
                    <button onClick={() => setMobileNavOpen(false)} className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <nav className="mt-6 flex flex-1 flex-col gap-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileNavOpen(false)}
                          className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                            active
                              ? darkMode
                                ? 'bg-cyan-400/10 text-cyan-300'
                                : 'bg-slate-950 text-white'
                              : darkMode
                                ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Main column */}
          <div className="flex min-h-screen flex-1 flex-col">
            <header className={`sticky top-0 z-30 flex items-center gap-3 border-b px-4 py-3 backdrop-blur-xl sm:px-6 ${topbarClass}`}>
              <button
                onClick={() => setMobileNavOpen(true)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border lg:hidden ${darkMode ? 'border-white/10 bg-white/10 text-white' : 'border-slate-200 bg-white text-slate-700'}`}
              >
                <Menu className="h-4 w-4" />
              </button>

              <div className={`flex flex-1 items-center gap-2 rounded-full border px-4 py-2 ${darkMode ? 'border-white/10 bg-slate-950/60 text-slate-300' : 'border-slate-200 bg-white text-slate-500'}`}>
                <Search className="h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search customers, orders, invoices…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>

              <button
                onClick={toggleDarkMode}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${darkMode ? 'border-white/10 bg-white/10 text-slate-100 hover:bg-white/15' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
              </button>

              <button
                className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border ${darkMode ? 'border-white/10 bg-white/10 text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-400" />
              </button>

              <div className={`hidden items-center gap-2 rounded-full border py-1 pl-1 pr-3 sm:flex ${darkMode ? 'border-white/10 bg-white/10' : 'border-slate-200 bg-white'}`}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-xs font-semibold text-white">{initials}</span>
                <div className="leading-tight">
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{user?.username ?? 'Signing in…'}</p>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{user?.role ?? '—'}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className={`hidden h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition sm:flex ${darkMode ? 'border-white/10 bg-white/10 text-slate-100 hover:bg-white/15' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </header>

            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          </div>
        </div>
      </div>
    </DashboardThemeContext.Provider>
  );
}
