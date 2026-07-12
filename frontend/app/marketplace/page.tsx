'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ShoppingBag, Sparkles, ShieldCheck, Bot } from 'lucide-react';
import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';

const marketplaceHighlights = [
  {
    title: 'Vendor onboarding',
    description: 'Streamline supplier intake, compliance, and onboarding in one workspace.',
    icon: ShieldCheck
  },
  {
    title: 'Catalog intelligence',
    description: 'Surface catalog insights, pricing trends, and replenishment opportunity.',
    icon: Sparkles
  },
  {
    title: 'AI buyer assistance',
    description: 'Let your teams ask questions and receive action-oriented recommendations.',
    icon: Bot
  }
];

export default function MarketplacePage() {
  return (
    <SiteShell title="See how marketplace intelligence accelerates sourcing and supplier collaboration." subtitle="Book a guided walkthrough to see how Ceylon IntelliBiz helps buyers, suppliers, and operations teams work in sync.">
      <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/80 p-8 shadow-[0_35px_100px_-32px_rgba(15,23,42,0.38)] backdrop-blur-xl">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                <Sparkles className="h-4 w-4" />
                Marketplace intelligence
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Power commerce, sourcing, and supplier cooperation from one connected layer.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600">
                Bring buyers, suppliers, and internal teams together with a platform that helps you manage buying, order flow, and vendor performance.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-medium text-white">
                  Explore platform <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/solutions" className="rounded-full border border-slate-200 bg-white px-5 py-3 font-medium text-slate-700">
                  View solutions
                </Link>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_25px_55px_-25px_rgba(2,8,23,0.8)]"
            >
              <div className="rounded-[22px] border border-white/10 bg-white/10 p-5">
                <p className="text-sm uppercase tracking-[0.32em] text-slate-400">Marketplace overview</p>
                <div className="mt-4 space-y-3">
                  {marketplaceHighlights.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="font-semibold">{item.title}</h2>
                            <p className="mt-1 text-sm text-slate-400">{item.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
    </SiteShell>
  );
}
