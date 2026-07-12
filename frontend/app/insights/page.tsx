'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, Sparkles } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';

const insightCards = [
  {
    title: 'Live dashboards',
    description: 'Track business health in real time with executive-level visibility.',
    value: '24/7'
  },
  {
    title: 'Forecast confidence',
    description: 'Use AI signal modeling to anticipate demand and performance.',
    value: '98%'
  },
  {
    title: 'Actionable summaries',
    description: 'Turn complex data into concise guidance for leaders and teams.',
    value: 'Instant'
  }
];

export default function InsightsPage() {
  return (
    <SiteShell title="See how live insights can guide every important decision." subtitle="Experience how Ceylon IntelliBiz turns your operational and marketplace data into confident, AI-assisted action.">
      <section className="rounded-[32px] border border-slate-200/80 bg-white/80 p-8 shadow-[0_35px_100px_-32px_rgba(15,23,42,0.38)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-sm font-medium text-pink-700">
                <Sparkles className="h-4 w-4" />
                Insight intelligence
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Make better decisions with real-time intelligence and AI guidance.
              </h1>
              <p className="text-lg leading-8 text-slate-600">
                Connect your data streams into a single layer of insight that leaders can trust and teams can act on.
              </p>
            </div>
            <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-medium text-white">
              View platform <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {insightCards.map((card) => (
              <div key={card.title} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
                <p className="text-3xl font-semibold text-slate-950">{card.value}</p>
                <h2 className="mt-3 text-lg font-semibold text-slate-900">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
              </div>
            ))}
          </div>
        </section>
    </SiteShell>
  );
}
