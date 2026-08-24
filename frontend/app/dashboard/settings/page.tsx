'use client';

import { Building2, KeyRound, Palette, ShieldCheck } from 'lucide-react';
import { useDashboardTheme } from '@/components/dashboard/dashboard-shell';

const sections = [
  {
    icon: Building2,
    title: 'Workspace profile',
    description: 'Company name, registration details, and default currency (LKR) for Ceylon IntelliBiz.'
  },
  {
    icon: ShieldCheck,
    title: 'Security & access',
    description: 'Manage roles (Admin, Sales, Finance, Support), 2FA, and SSO once the Authentication Service is connected.'
  },
  {
    icon: KeyRound,
    title: 'API & integrations',
    description: 'Connect the Java backend, AI service, and payment gateways (PayHere, Stripe, Genie).'
  },
  {
    icon: Palette,
    title: 'Appearance',
    description: 'Toggle light and dark mode from the top bar — your preference is remembered on this device.'
  }
];

export default function SettingsPage() {
  const { darkMode, toggleDarkMode } = useDashboardTheme();
  const cardClass = darkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/80 shadow-sm';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Workspace</p>
        <h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${darkMode ? 'text-white' : 'text-slate-950'}`}>Settings</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className={`rounded-[24px] border p-5 ${cardClass}`}>
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${darkMode ? 'bg-cyan-400/10 text-cyan-300' : 'bg-slate-950 text-white'}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className={`mt-4 text-base font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{section.title}</h3>
              <p className={`mt-2 text-sm leading-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{section.description}</p>
            </div>
          );
        })}
      </div>

      <div className={`flex flex-wrap items-center justify-between gap-4 rounded-[24px] border p-5 ${cardClass}`}>
        <div>
          <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Theme</p>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Currently using {darkMode ? 'dark' : 'light'} mode.</p>
        </div>
        <button
          onClick={toggleDarkMode}
          className={`rounded-full px-4 py-2.5 text-sm font-medium ${darkMode ? 'bg-cyan-400 text-slate-950' : 'bg-slate-950 text-white'}`}
        >
          Switch to {darkMode ? 'light' : 'dark'} mode
        </button>
      </div>
    </div>
  );
}
