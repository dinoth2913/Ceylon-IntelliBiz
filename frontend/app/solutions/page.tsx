'use client';

import Link from 'next/link';
import { ArrowRight, Layers3, ShieldCheck, Sparkles } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';

const solutions = [
  {
    title: 'Finance and control',
    description: 'Automate approvals, budgets, and forecasting with deep visibility.',
    icon: ShieldCheck
  },
  {
    title: 'Operational alignment',
    description: 'Keep sales, supply chain, and service teams aligned in real time.',
    icon: Layers3
  },
  {
    title: 'AI-powered automation',
    description: 'Deploy copilots and workflow automation tailored to your business.',
    icon: Sparkles
  }
];

export default function SolutionsPage() {
  return (
    <SiteShell title="See how customized solutions can unify your operating model." subtitle="Let us show you how Ceylon IntelliBiz brings finance, operations, and growth teams together inside one secure platform.">
      <section className="rounded-[32px] border border-slate-200/80 bg-white/80 p-8 shadow-[0_35px_100px_-32px_rgba(15,23,42,0.38)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700">
                <Sparkles className="h-4 w-4" />
                Solutions for every team
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                One platform that supports operations, finance, and growth.
              </h1>
              <p className="text-lg leading-8 text-slate-600">
                Tailor workflows by department while preserving one source of truth for reporting and governance.
              </p>
            </div>
            <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-medium text-white">
              See platform overview <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {solutions.map((solution) => {
              const Icon = solution.icon;
              return (
                <div key={solution.title} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-slate-900">{solution.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{solution.description}</p>
                </div>
              );
            })}
          </div>
        </section>
    </SiteShell>
  );
}
