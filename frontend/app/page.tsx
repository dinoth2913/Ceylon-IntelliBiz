'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Briefcase,
  CheckCircle2,
  Menu,
  MoonStar,
  ShoppingCart,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  X
} from 'lucide-react';
import { MetricCard } from '@/components/metric-card';
import { SiteShell } from '@/components/site-shell';

const modules = [
  {
    title: 'CRM',
    description: 'Customer, lead, and opportunity workflows',
    icon: Briefcase,
    gradient: 'from-sky-500/20 via-cyan-400/10 to-transparent',
    accent: 'border-sky-200 bg-sky-50/70 text-sky-700'
  },
  {
    title: 'ERP',
    description: 'Inventory, finance, procurement, HR, and assets',
    icon: ShieldCheck,
    gradient: 'from-violet-500/20 via-fuchsia-400/10 to-transparent',
    accent: 'border-violet-200 bg-violet-50/70 text-violet-700'
  },
  {
    title: 'Marketplace',
    description: 'Vendor onboarding, catalog, orders, and payments',
    icon: ShoppingCart,
    gradient: 'from-emerald-500/20 via-lime-400/10 to-transparent',
    accent: 'border-emerald-200 bg-emerald-50/70 text-emerald-700'
  },
  {
    title: 'AI',
    description: 'Forecasting, OCR, search, and automation',
    icon: Bot,
    gradient: 'from-amber-500/20 via-orange-400/10 to-transparent',
    accent: 'border-amber-200 bg-amber-50/70 text-amber-700'
  }
];

const metrics = [
  { title: 'Revenue', value: 'LKR 28.4M', trend: '+18.2%', accent: 'bg-emerald-50 text-emerald-700' },
  { title: 'Active Customers', value: '13,248', trend: '+7.4%', accent: 'bg-blue-50 text-blue-700' },
  { title: 'Inventory Turns', value: '4.8x', trend: '+12.1%', accent: 'bg-violet-50 text-violet-700' },
  { title: 'Support SLA', value: '97.2%', trend: '+3.1%', accent: 'bg-amber-50 text-amber-700' }
];

const navItems = [
  { label: 'Platform', href: '/' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Insights', href: '/insights' }
];
const particles = [
  { left: '8%', top: '12%', size: '8px', delay: 0 },
  { left: '18%', top: '78%', size: '5px', delay: 0.5 },
  { left: '72%', top: '22%', size: '7px', delay: 1.1 },
  { left: '84%', top: '70%', size: '6px', delay: 1.7 },
  { left: '62%', top: '84%', size: '4px', delay: 0.9 },
  { left: '36%', top: '10%', size: '5px', delay: 1.4 }
];

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('intellibiz-theme');
    if (storedTheme === 'dark') {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    window.localStorage.setItem('intellibiz-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const shellClass = darkMode
    ? 'border-white/10 bg-slate-950/70 text-slate-100 shadow-[0_35px_100px_-32px_rgba(2,8,23,0.85)]'
    : 'border-slate-200/70 bg-white/80 text-slate-900 shadow-[0_35px_100px_-32px_rgba(15,23,42,0.45)]';

  const heroBadgeClass = darkMode
    ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200'
    : 'border-blue-200 bg-blue-50/80 text-blue-700';

  const softCardClass = darkMode
    ? 'border-white/10 bg-slate-900/60 text-slate-100 shadow-[0_15px_40px_-18px_rgba(2,8,23,0.9)]'
    : 'border-slate-200 bg-white/70 text-slate-900 shadow-sm';

  const bodyTextClass = darkMode ? 'text-slate-300' : 'text-slate-600';
  const headingClass = darkMode ? 'text-white' : 'text-slate-950';

  return (
    <main className={`relative min-h-screen overflow-hidden ${darkMode ? 'bg-slate-950 text-slate-50' : 'bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_34%),linear-gradient(135deg,#f8fafc_0%,#eef4ff_100%)] text-slate-900'}`}>
      <div className={`pointer-events-none absolute inset-0 ${darkMode ? 'bg-[linear-gradient(120deg,rgba(15,23,42,0.9)_0%,rgba(15,23,42,0)_70%)]' : 'bg-[linear-gradient(120deg,rgba(255,255,255,0.65)_0%,rgba(255,255,255,0)_72%)]'}`} />
      <div className={`pointer-events-none absolute left-[-6%] top-[-8%] h-64 w-64 rounded-full blur-3xl ${darkMode ? 'bg-cyan-500/20' : 'bg-blue-400/20'}`} />
      <div className={`pointer-events-none absolute bottom-[-5%] right-[-3%] h-72 w-72 rounded-full blur-3xl ${darkMode ? 'bg-violet-500/20' : 'bg-violet-400/20'}`} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((particle, index) => (
          <motion.span
            key={`${particle.left}-${particle.top}`}
            className={`absolute rounded-full ${darkMode ? 'bg-cyan-300/70' : 'bg-slate-400/40'}`}
            style={{ left: particle.left, top: particle.top, width: particle.size, height: particle.size }}
            animate={{ y: [0, -12, 0], x: [0, 6, 0], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 4 + index * 0.45, repeat: Infinity, ease: 'easeInOut', delay: particle.delay }}
          />
        ))}
      </div>

      <SiteShell title="Bring your team into one intelligent operating layer." subtitle="Discover how Ceylon IntelliBiz can connect your operations, marketplace, and AI workflows in one live walkthrough.">
        <section className={`relative mx-auto flex max-w-7xl flex-col gap-8 overflow-hidden rounded-[32px] border p-6 backdrop-blur-xl sm:p-8 lg:p-10 ${shellClass}`}>
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className={`rounded-[24px] border px-4 py-3 ${darkMode ? 'border-white/10 bg-slate-900/70' : 'border-slate-200/80 bg-white/60'}`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${darkMode ? 'bg-cyan-400/10 text-cyan-300' : 'bg-slate-950 text-white'}`}>
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Ceylon IntelliBiz</p>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>AI Operating Platform</p>
              </div>
            </div>

            <nav className="hidden items-center gap-2 md:flex">
              {navItems.map((item) => (
                <a key={item.label} href={item.href} className={`rounded-full px-3 py-2 text-sm font-medium transition ${darkMode ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDarkMode((value) => !value)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${darkMode ? 'border-white/10 bg-white/10 text-slate-100 hover:bg-white/15' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                {darkMode ? 'Light mode' : 'Dark mode'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setMobileMenuOpen((value) => !value)}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border md:hidden ${darkMode ? 'border-white/10 bg-white/10 text-white' : 'border-slate-200 bg-white text-slate-700'}`}
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </motion.button>
            </div>
          </div>

          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-3 flex flex-col gap-2 rounded-2xl border p-3 md:hidden ${darkMode ? 'border-white/10 bg-slate-950/80' : 'border-slate-200 bg-white/80'}`}
            >
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition ${darkMode ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  {item.label}
                </a>
              ))}
            </motion.div>
          )}
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className={`relative overflow-hidden rounded-[30px] border p-6 sm:p-8 lg:p-10 ${darkMode ? 'border-white/10 bg-slate-900/60' : 'border-white/70 bg-white/60'}`}
        >
          <div className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%)] ${darkMode ? 'opacity-80' : 'opacity-100'}`} />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium shadow-sm ${heroBadgeClass}`}>
                <Sparkles className="h-4 w-4" />
                AI-Powered Business Operating Platform for Sri Lanka
              </div>
              <h1 className={`text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl ${headingClass}`}>
                Transform the Way Sri Lankan Businesses Operate
              </h1>
              <p className={`max-w-xl text-lg leading-8 ${bodyTextClass}`}>
                Ceylon IntelliBiz is an all-in-one AI-powered Business Operating Platform designed specifically for Sri Lankan businesses. It combines CRM, ERP, Marketplace, Finance, Inventory, HR, Sales, Customer Support, and AI into a single intelligent ecosystem.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {['Secure by design', 'Zero-friction rollout', 'Actionable insight'].map((item) => (
                  <span key={item} className={`rounded-full border px-3 py-1 text-sm font-medium ${darkMode ? 'border-white/10 bg-white/10 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <motion.a
                href="/auth"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 font-medium shadow-lg ${darkMode ? 'bg-cyan-400 text-slate-950 shadow-cyan-400/20' : 'bg-slate-950 text-white shadow-slate-950/15'}`}
              >
                Explore Platform <ArrowRight className="h-4 w-4" />
              </motion.a>
              <motion.a
                href="/auth"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 font-medium ${darkMode ? 'border-white/10 bg-white/10 text-slate-100' : 'border-slate-200 bg-white text-slate-700 shadow-sm'}`}
              >
                <Bot className="h-4 w-4" /> Try AI Assistant
              </motion.a>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.55 }}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <motion.div
                key={module.title}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.06, duration: 0.45 }}
                whileHover={{ y: -8, scale: 1.02, boxShadow: darkMode ? '0 24px 50px -24px rgba(2, 8, 23, 0.85)' : '0 24px 50px -24px rgba(15, 23, 42, 0.35)' }}
                whileTap={{ scale: 0.98 }}
                className={`group relative overflow-hidden rounded-[24px] border p-5 ${softCardClass}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 transition duration-500 group-hover:opacity-100`} />
                <div className="relative">
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border ${module.accent} shadow-sm transition duration-300 group-hover:scale-110`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{module.title}</h2>
                  <p className={`mt-2 text-sm leading-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{module.description}</p>
                  <div className={`mt-5 flex items-center gap-2 text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Live coordination
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5 }}
          className={`grid gap-4 rounded-[28px] border p-6 sm:p-8 lg:grid-cols-[1.05fr_0.95fr] ${darkMode ? 'border-white/10 bg-slate-900/55' : 'border-slate-200 bg-white/70'}`}
        >
          <div className="space-y-4">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${darkMode ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
              <Sparkles className="h-4 w-4" />
              Product showcase
            </div>
            <h3 className={`text-2xl font-semibold sm:text-3xl ${darkMode ? 'text-white' : 'text-slate-950'}`}>Built for the Challenges Faced by Sri Lankan Businesses</h3>
            <p className={`max-w-xl text-base leading-7 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Many businesses in Sri Lanka still depend on spreadsheets and disconnected software. Ceylon IntelliBiz solves these challenges by providing one secure platform where every department can collaborate and automate workflows.
            </p>
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${darkMode ? 'border-white/10 bg-white/10 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Overcome manual record keeping and poor insights
            </div>
          </div>

          <div className="grid gap-3">
            {[
              { title: 'Manual Record Keeping', description: 'Eliminate the risk of errors and lost information by digitizing customer records, invoices, and inventory.' },
              { title: 'Disconnected Business Systems', description: 'Unify accounting, inventory, and customer management into one collaborative ecosystem.' },
              { title: 'Lack of Business Insights', description: 'Replace guesswork with reliable data, proper reporting, and analytics for important decisions.' }
            ].map((item) => (
              <div key={item.title} className={`rounded-[20px] border p-4 ${darkMode ? 'border-white/10 bg-slate-950/70' : 'border-slate-200 bg-slate-50/80'}`}>
                <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.title}</h4>
                <p className={`mt-2 text-sm leading-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.description}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.55 }}
          className={`relative overflow-hidden rounded-[28px] border p-6 text-white shadow-[0_30px_70px_-30px_rgba(2,8,23,0.8)] sm:p-8 ${darkMode ? 'border-white/10 bg-slate-950' : 'border-slate-200/80 bg-slate-950'}`}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.24),_transparent_38%)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-slate-400">Executive Overview</p>
              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Business performance at a glance</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-200">
              <TrendingUp className="h-4 w-4 text-emerald-400" /> Live insights enabled
            </div>
          </div>

          <div className="relative mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric, index) => (
              <MetricCard key={metric.title} {...metric} index={index} darkMode={darkMode} />
            ))}
          </div>
        </motion.div>

        <motion.footer
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.45 }}
          className={`flex flex-col gap-4 rounded-[24px] border px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between ${darkMode ? 'border-white/10 bg-slate-900/60 text-slate-300' : 'border-slate-200 bg-slate-50/80 text-slate-600'}`}
        >
          <div>
            <p className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Ready to Transform Your Business?</p>
            <p className="mt-1">Experience the future of business management with Ceylon IntelliBiz.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {['Privacy', 'Security', 'Contact'].map((item) => (
              <motion.a
                key={item}
                href="/"
                whileHover={{ y: -1, scale: 1.01 }}
                className={`rounded-full px-3 py-2 transition ${darkMode ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-white hover:text-slate-900'}`}
              >
                {item}
              </motion.a>
            ))}
          </div>
        </motion.footer>
      </section>
      </SiteShell>
    </main>
  );
}
