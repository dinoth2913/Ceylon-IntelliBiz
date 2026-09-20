import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Briefcase,
  CheckCircle2,
  Layers3,
  PlugZap,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Workflow
} from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { PageHero, SectionHeading, cardClass, panelClass } from '@/components/marketing';

export const metadata: Metadata = {
  title: 'Solutions | Ceylon IntelliBiz',
  description: 'CRM, ERP, marketplace and AI modules that bring Sri Lankan business teams into one platform.'
};

const teams = [
  {
    title: 'Finance and control',
    description: 'Track paid, outstanding and overdue invoices in one place, with the overdue ones surfaced first.',
    icon: ShieldCheck
  },
  {
    title: 'Operational alignment',
    description: 'Keep sales orders, stock levels and customer records lined up instead of split across spreadsheets.',
    icon: Layers3
  },
  {
    title: 'AI-powered automation',
    description: 'An assistant that answers questions from your own data and flags what needs attention today.',
    icon: Sparkles
  }
];

const modules = [
  {
    id: 'crm',
    title: 'CRM',
    tagline: 'Know every customer and never lose a relationship in a spreadsheet.',
    icon: Briefcase,
    accent: 'border-sky-200 bg-sky-50 text-sky-700',
    points: [
      'One record per customer with company, email and phone',
      'Search by name or company and filter by segment',
      'Add a customer in seconds, straight from the dashboard'
    ],
    link: { label: 'Open customers', href: '/dashboard/customers' }
  },
  {
    id: 'erp',
    title: 'ERP',
    tagline: 'Stock, orders and invoices that agree with each other.',
    icon: ShieldCheck,
    accent: 'border-violet-200 bg-violet-50 text-violet-700',
    points: [
      'Inventory with reorder levels and a clear "reorder now" flag',
      'Orders grouped by status: processing, fulfilled, pending payment, cancelled',
      'Invoices split into paid, outstanding, overdue and draft'
    ],
    link: { label: 'Open inventory', href: '/dashboard/inventory' }
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    tagline: 'Sell to other businesses through a catalogue your vendors can grow.',
    icon: ShoppingCart,
    accent: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    points: [
      'Browse and search products by category',
      'Product pages with ratings, reviews and key features',
      'Vendor records kept alongside your customers'
    ],
    link: { label: 'Browse the marketplace', href: '/marketplace' }
  },
  {
    id: 'ai',
    title: 'AI',
    tagline: 'Ask a question, get an answer from your own numbers.',
    icon: Bot,
    accent: 'border-amber-200 bg-amber-50 text-amber-700',
    points: [
      'An assistant that reads your orders, invoices and stock',
      'Insights that flag low stock, overdue invoices and unpaid orders',
      'Transparent, rule-based logic today; you can see why it says what it says'
    ],
    link: { label: 'Try the assistant', href: '/dashboard/ai' }
  }
];

const industries = ['Spices & export', 'Textiles', 'Hardware & building supplies', 'Fresh foods', 'Logistics', 'Retail'];

const steps = [
  { title: 'Bring your records in', description: 'Add customers, products and invoices, or start with the sample workspace to look around.', icon: PlugZap },
  { title: 'Work from one dashboard', description: 'Sales, stock and finance share the same data, so nobody is reconciling spreadsheets.', icon: Workflow },
  { title: 'Let the assistant do the watching', description: 'Insights point out what needs attention before it becomes a problem.', icon: Sparkles }
];

export default function SolutionsPage() {
  return (
    <SiteShell
      title="See how customized solutions can unify your operating model."
      subtitle="Let us show you how Ceylon IntelliBiz brings finance, operations, and growth teams together inside one secure platform."
    >
      <PageHero
        badge="Solutions for every team"
        badgeIcon={Sparkles}
        tone="violet"
        title="One platform that supports operations, finance, and growth."
        description="Tailor workflows by department while preserving one source of truth for reporting and governance."
        cta={{ label: 'See platform overview', href: '/' }}
      >
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {teams.map((team) => {
            const Icon = team.icon;
            return (
              <div key={team.title} className={cardClass}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">{team.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{team.description}</p>
              </div>
            );
          })}
        </div>
      </PageHero>

      <section className={panelClass}>
        <SectionHeading
          eyebrow="Modules"
          title="Four modules, one login"
          description="Each module works on its own and shares the same customers, products and invoices with the others."
        />
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <article key={module.id} id={module.id} className={`${cardClass} scroll-mt-8 p-6`}>
                <div className="flex items-center gap-3">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${module.accent}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-xl font-semibold text-slate-950">{module.title}</h3>
                </div>
                <p className="mt-4 text-base font-medium leading-7 text-slate-800">{module.tagline}</p>
                <ul className="mt-4 space-y-2.5">
                  {module.points.map((point) => (
                    <li key={point} className="flex gap-2.5 text-sm leading-6 text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link href={module.link.href} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900">
                  {module.link.label} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className={panelClass}>
        <SectionHeading eyebrow="How it works" title="From spreadsheets to one source of truth" />
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className={cardClass}>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">{index + 1}</span>
                  <Icon className="h-5 w-5 text-slate-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className={panelClass}>
        <SectionHeading eyebrow="Built for local business" title="Made for the way Sri Lankan companies trade" description="LKR is the default currency, and the sample workspace is modelled on the sectors below." />
        <div className="mt-6 flex flex-wrap gap-2.5">
          {industries.map((industry) => (
            <span key={industry} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
              {industry}
            </span>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
