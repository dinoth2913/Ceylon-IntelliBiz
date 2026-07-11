import { ArrowRight, Bot, Briefcase, ShoppingCart, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { MetricCard } from '@/components/metric-card';

const modules = [
  { title: 'CRM', description: 'Customer, lead, and opportunity workflows' },
  { title: 'ERP', description: 'Inventory, finance, procurement, HR, and assets' },
  { title: 'Marketplace', description: 'Vendor onboarding, catalog, orders, and payments' },
  { title: 'AI', description: 'Forecasting, OCR, search, and automation' }
];

const metrics = [
  { title: 'Revenue', value: 'LKR 28.4M', trend: '+18.2%', accent: 'bg-emerald-50 text-emerald-700' },
  { title: 'Active Customers', value: '13,248', trend: '+7.4%', accent: 'bg-blue-50 text-blue-700' },
  { title: 'Inventory Turns', value: '4.8x', trend: '+12.1%', accent: 'bg-violet-50 text-violet-700' },
  { title: 'Support SLA', value: '97.2%', trend: '+3.1%', accent: 'bg-amber-50 text-amber-700' }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_36%),linear-gradient(135deg,#f8fafc_0%,#eff6ff_100%)] p-6 text-slate-900">
      <section className="mx-auto flex max-w-7xl flex-col gap-8 rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.4)] backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              <Sparkles className="h-4 w-4" />
              AI-Powered Business Operating Platform for Sri Lanka
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Enterprise software for modern business operations.
            </h1>
            <p className="text-lg text-slate-600">
              Ceylon IntelliBiz unifies CRM, ERP, marketplace, finance, HR, analytics, and AI automation in one secure operating platform built for Sri Lankan organizations.
            </p>
          </div>
          <div className="flex gap-3">
            <a href="/" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-medium text-white transition hover:bg-blue-700">
              Explore Platform <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 font-medium text-slate-700 transition hover:border-slate-300">
              <Bot className="h-4 w-4" /> Try AI Assistant
            </a>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {modules.map((module) => (
            <div key={module.title} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {module.title === 'CRM' ? <Briefcase className="h-5 w-5" /> : module.title === 'ERP' ? <ShieldCheck className="h-5 w-5" /> : module.title === 'Marketplace' ? <ShoppingCart className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{module.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{module.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-slate-400">Executive Overview</p>
              <h2 className="mt-2 text-2xl font-semibold">Business performance at a glance</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-200">
              <TrendingUp className="h-4 w-4 text-emerald-400" /> Live insights enabled
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.title} {...metric} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
