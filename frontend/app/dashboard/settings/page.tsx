'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Building2, CheckCircle2, CircleAlert, Loader2, LogOut, MoonStar, Palette, RefreshCw, Sun, UserRound, Wifi } from 'lucide-react';
import { useDashboardTheme } from '@/components/dashboard/dashboard-shell';
import { API_BASE_URL, apiFetch, getSession, logout, refreshUser, type AuthUser } from '@/lib/auth';
import { ROLE_DESCRIPTIONS, normaliseRole, roleLabel, type Role } from '@/lib/roles';

const WORKSPACE_KEY = 'intellibiz-workspace';
const NOTIFICATIONS_KEY = 'intellibiz-notifications';

const timezones = ['Asia/Colombo', 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London'];

const defaultWorkspace = { company: '', timezone: 'Asia/Colombo' };
const defaultNotifications = { lowStock: true, overdueInvoices: true, weeklySummary: false };

const notificationOptions = [
  { key: 'lowStock', title: 'Low-stock alerts', description: 'Flag items that fall to their reorder level.' },
  { key: 'overdueInvoices', title: 'Overdue invoice alerts', description: 'Flag invoices that are past their due date.' },
  { key: 'weeklySummary', title: 'Weekly summary', description: 'A short recap of sales, stock and invoices.' }
] as const;

type ConnectionState = 'checking' | 'connected' | 'unavailable';

function readStored<T extends object>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: object) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be blocked (private mode); the setting simply won't persist.
  }
}

async function checkBackend(): Promise<ConnectionState> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, { signal: AbortSignal.timeout(4000) });
    return response.ok ? 'connected' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

async function checkAiService(): Promise<ConnectionState> {
  try {
    const response = await apiFetch('/api/ai/insights', { signal: AbortSignal.timeout(6000) });
    return response.ok ? 'connected' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

export default function SettingsPage() {
  const { darkMode, toggleDarkMode } = useDashboardTheme();
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [workspace, setWorkspace] = useState(defaultWorkspace);
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [saved, setSaved] = useState(false);
  const [backend, setBackend] = useState<ConnectionState>('checking');
  const [aiService, setAiService] = useState<ConnectionState>('checking');

  const runChecks = useCallback(async () => {
    setBackend('checking');
    setAiService('checking');
    const [backendState, aiState] = await Promise.all([checkBackend(), checkAiService()]);
    setBackend(backendState);
    setAiService(aiState);
  }, []);

  useEffect(() => {
    setUser(getSession()?.user ?? null);
    void refreshUser().then((fresh) => fresh && setUser(fresh));
    setWorkspace(readStored(WORKSPACE_KEY, defaultWorkspace));
    setNotifications(readStored(NOTIFICATIONS_KEY, defaultNotifications));
    void runChecks();
  }, [runChecks]);

  const cardClass = `rounded-[24px] border p-5 ${darkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/80 shadow-sm'}`;
  const heading = darkMode ? 'text-white' : 'text-slate-900';
  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';
  const inputClass = `rounded-xl border px-3 py-2 text-sm outline-none ${darkMode ? 'border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900'}`;
  const iconBox = `flex h-10 w-10 items-center justify-center rounded-2xl ${darkMode ? 'bg-cyan-400/10 text-cyan-300' : 'bg-slate-950 text-white'}`;
  const primaryButton = `inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${darkMode ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'bg-slate-950 text-white hover:bg-slate-800'}`;
  const outlineButton = `inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${darkMode ? 'border-white/10 text-slate-200 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`;

  const saveWorkspace = (event: React.FormEvent) => {
    event.preventDefault();
    writeStored(WORKSPACE_KEY, workspace);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const toggleNotification = (key: keyof typeof defaultNotifications) => {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    writeStored(NOTIFICATIONS_KEY, next);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className={`text-sm ${muted}`}>Workspace</p>
        <h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${darkMode ? 'text-white' : 'text-slate-950'}`}>Settings</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={cardClass}>
          <div className="flex items-center gap-3">
            <span className={iconBox}><UserRound className="h-5 w-5" /></span>
            <div>
              <h2 className={`text-base font-semibold ${heading}`}>Your account</h2>
              <p className={`text-sm ${muted}`}>Signed in on this device</p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
            <dt className={muted}>Username</dt>
            <dd className={`font-medium ${heading}`}>{user?.username ?? '—'}</dd>
            <dt className={muted}>Email</dt>
            <dd className={`truncate font-medium ${heading}`}>{user?.email ?? '—'}</dd>
            <dt className={muted}>Role</dt>
            <dd className={`font-medium ${heading}`}>{user ? roleLabel(user.role) : '—'}</dd>
          </dl>
          {user && <p className={`mt-3 text-xs leading-5 ${muted}`}>{ROLE_DESCRIPTIONS[normaliseRole(user.role) as Role]}</p>}
          <button onClick={handleLogout} className={`${outlineButton} mt-5`}>
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </section>

        <section className={cardClass}>
          <div className="flex items-center gap-3">
            <span className={iconBox}><Building2 className="h-5 w-5" /></span>
            <div>
              <h2 className={`text-base font-semibold ${heading}`}>Workspace profile</h2>
              <p className={`text-sm ${muted}`}>Saved on this device</p>
            </div>
          </div>
          <form onSubmit={saveWorkspace} className="mt-5 grid gap-3">
            <label className={`flex flex-col gap-1.5 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Company name
              <input value={workspace.company} onChange={(e) => setWorkspace({ ...workspace, company: e.target.value })} placeholder="Your company" className={inputClass} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`flex flex-col gap-1.5 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Currency
                <input value="LKR" disabled className={`${inputClass} opacity-70`} />
              </label>
              <label className={`flex flex-col gap-1.5 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Time zone
                <select value={workspace.timezone} onChange={(e) => setWorkspace({ ...workspace, timezone: e.target.value })} className={inputClass}>
                  {timezones.map((zone) => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" className={primaryButton}>Save changes</button>
              {saved && (
                <span role="status" className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" /> Saved
                </span>
              )}
            </div>
          </form>
        </section>

        <section className={cardClass}>
          <div className="flex items-center gap-3">
            <span className={iconBox}><Bell className="h-5 w-5" /></span>
            <div>
              <h2 className={`text-base font-semibold ${heading}`}>Notifications</h2>
              <p className={`text-sm ${muted}`}>Choose what you want to hear about</p>
            </div>
          </div>
          <ul className={`mt-4 divide-y ${darkMode ? 'divide-white/10' : 'divide-slate-100'}`}>
            {notificationOptions.map((option) => {
              const on = notifications[option.key];
              return (
                <li key={option.key} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className={`text-sm font-medium ${heading}`}>{option.title}</p>
                    <p className={`text-xs ${muted}`}>{option.description}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={option.title}
                    onClick={() => toggleNotification(option.key)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? (darkMode ? 'bg-cyan-400' : 'bg-slate-950') : darkMode ? 'bg-white/15' : 'bg-slate-200'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </li>
              );
            })}
          </ul>
          <p className={`mt-2 text-xs ${muted}`}>Preferences are stored on this device. Delivery by email or SMS isn&apos;t available yet.</p>
        </section>

        <section className={cardClass}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={iconBox}><Wifi className="h-5 w-5" /></span>
              <div>
                <h2 className={`text-base font-semibold ${heading}`}>Connections</h2>
                <p className={`text-sm ${muted}`}>Live status of the services behind this workspace</p>
              </div>
            </div>
            <button onClick={() => void runChecks()} className={outlineButton} aria-label="Re-check connections">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <ul className="mt-4 space-y-3">
            <ConnectionRow label="Business API" detail="Customers, orders, invoices, inventory" state={backend} darkMode={darkMode} />
            <ConnectionRow label="AI service" detail="Assistant and insights" state={aiService} darkMode={darkMode} />
          </ul>
          <p className={`mt-4 text-xs ${muted}`}>Payment gateways (PayHere, Stripe, Genie) are not connected yet.</p>
        </section>
      </div>

      <section className={`${cardClass} flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <span className={iconBox}><Palette className="h-5 w-5" /></span>
          <div>
            <h2 className={`text-base font-semibold ${heading}`}>Appearance</h2>
            <p className={`text-sm ${muted}`}>Currently using {darkMode ? 'dark' : 'light'} mode. Your choice is remembered on this device.</p>
          </div>
        </div>
        <button onClick={toggleDarkMode} className={primaryButton}>
          {darkMode ? <Sun className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          Switch to {darkMode ? 'light' : 'dark'} mode
        </button>
      </section>
    </div>
  );
}

function ConnectionRow({ label, detail, state, darkMode }: { label: string; detail: string; state: ConnectionState; darkMode: boolean }) {
  const badge =
    state === 'connected'
      ? { text: 'Connected', icon: CheckCircle2, cls: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300' }
      : state === 'unavailable'
        ? { text: 'Unavailable', icon: CircleAlert, cls: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300' }
        : { text: 'Checking…', icon: Loader2, cls: darkMode ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500' };
  const Icon = badge.icon;

  return (
    <li className="flex items-center justify-between gap-3">
      <div>
        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{label}</p>
        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{detail}</p>
      </div>
      <span role="status" className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${badge.cls}`}>
        <Icon className={`h-3.5 w-3.5 ${state === 'checking' ? 'animate-spin' : ''}`} /> {badge.text}
      </span>
    </li>
  );
}
