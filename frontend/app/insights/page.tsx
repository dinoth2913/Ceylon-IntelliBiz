'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Bot, Info, ShieldAlert, Sparkles, Target, TrendingUp, Zap } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { AreaChart } from '@/components/dashboard/area-chart';
import { BarList } from '@/components/dashboard/bar-list';
import { PageHero, SectionHeading, cardClass, panelClass } from '@/components/marketing';
import { aiInsights, channelBreakdown, revenueTrend, revenueTrendLabels } from '@/lib/dashboard-data';

const kpis = [
  { label: 'Monthly revenue', value: 'LKR 28.4M' },
  { label: 'Customers', value: '13,248' },
  { label: 'Open orders', value: '184' },
  { label: 'Outstanding invoices', value: 'LKR 677K' }
];

const categoryStyle = {
  Forecast: { icon: TrendingUp, chip: 'border-sky-200 bg-sky-50 text-sky-700' },
  Risk: { icon: ShieldAlert, chip: 'border-rose-200 bg-rose-50 text-rose-700' },
  Opportunity: { icon: Target, chip: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  Automation: { icon: Zap, chip: 'border-violet-200 bg-violet-50 text-violet-700' }
} as const;

const rules = [
  { title: 'Stock at or below its reorder level', result: 'Flagged as a risk, worst item first' },
  { title: 'Invoices past their due date', result: 'Total overdue amount, so you know who to chase' },
  { title: 'Orders waiting on payment', result: 'Suggested for an automated reminder' },
  { title: 'Drafted but unsent invoices', result: 'Shown as billing you can issue today' }
];

const ranges = [
  { label: '6 months', points: 6 },
  { label: '12 months', points: 12 }
] as const;

export default function InsightsPage() {
  const [range, setRange] = useState<(typeof ranges)[number]>(ranges[1]);
  const data = revenueTrend.slice(-range.points);
  const labels = revenueTrendLabels.slice(-range.points);
  const change = Math.round(((data[data.length - 1] - data[0]) / data[0]) * 100);

  return (
    <SiteShell
      title="See how live insights can guide every important decision."
      subtitle="Experience how Ceylon IntelliBiz turns your operational and marketplace data into confident, AI-assisted action."
    >
      <PageHero
        badge="Insight intelligence"
        badgeIcon={Sparkles}
        tone="pink"
        title="Make better decisions with real-time intelligence and AI guidance."
        description="Connect your data streams into a single layer of insight that leaders can trust and teams can act on."
        cta={{ label: 'View platform', href: '/' }}
      >
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className={cardClass}>
              <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{kpi.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
          <Info className="h-3.5 w-3.5" /> Figures on this page come from the sample workspace, not from a live account.
        </p>
      </PageHero>

      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className={panelClass}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Revenue trend (LKR millions)</p>
              <h2 className="text-xl font-semibold text-slate-950">Last {range.label}</h2>
            </div>
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-1" role="group" aria-label="Chart range">
              {ranges.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={range.label === option.label}
                  onClick={() => setRange(option)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${range.label === option.label ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <p className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            <TrendingUp className="h-3.5 w-3.5" /> {change >= 0 ? '+' : ''}
            {change}% over the period
          </p>
          <div className="mt-4">
            <AreaChart data={data} labels={labels} />
          </div>
        </div>

        <div className={panelClass}>
          <p className="text-sm font-medium text-slate-500">Orders by channel</p>
          <h2 className="text-xl font-semibold text-slate-950">Where revenue comes from</h2>
          <div className="mt-6">
            <BarList items={channelBreakdown} />
          </div>
        </div>
      </section>

      <section className={panelClass}>
        <SectionHeading eyebrow="AI insights" title="What the assistant surfaces" description="Examples of the guidance your team sees each morning, each tagged by type." />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {aiInsights.map((insight) => {
            const style = categoryStyle[insight.category];
            const Icon = style.icon;
            return (
              <article key={insight.id} className={cardClass}>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${style.chip}`}>
                  <Icon className="h-3.5 w-3.5" /> {insight.category}
                </span>
                <h3 className="mt-3 text-base font-semibold text-slate-900">{insight.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{insight.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className={panelClass}>
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <SectionHeading
              eyebrow="How it works"
              title="Insights you can explain"
              description="Insights in your workspace are produced by clear rules over your live data, not a black box. If the assistant flags something, you can see exactly why."
            />
            <Link href="/dashboard/ai" className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
              <Bot className="h-4 w-4" /> Open the assistant <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="grid gap-3">
            {rules.map((rule) => (
              <li key={rule.title} className={cardClass}>
                <p className="text-sm font-semibold text-slate-900">{rule.title}</p>
                <p className="mt-1 text-sm text-slate-600">{rule.result}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </SiteShell>
  );
}
