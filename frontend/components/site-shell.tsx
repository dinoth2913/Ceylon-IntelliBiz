'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowRight, Bot, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '@/lib/auth';

type SiteShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

const navItems = [
  { label: 'Platform', href: '/' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Insights', href: '/insights' },
  { label: 'Dashboard', href: '/dashboard' }
];

const initialFormState = {
  name: '',
  email: '',
  company: '',
  message: '',
  // Honeypot: hidden from people, so only bots fill it in.
  website: ''
};

type SubmitState = 'idle' | 'sending' | 'sent' | 'error';

export function SiteShell({ children, title, subtitle, ctaLabel = 'Book a demo', ctaHref = '/#contact' }: SiteShellProps) {
  const [formState, setFormState] = useState(initialFormState);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitState === 'sending') return;

    setSubmitState('sending');
    try {
      const response = await fetch(`${API_BASE_URL}/api/contact-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      setSubmitState('sent');
      setFormState(initialFormState);
    } catch {
      setSubmitState('error');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_30%),linear-gradient(135deg,#f8fafc_0%,#eff6ff_100%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-slate-200/80 bg-white/70 px-4 py-3 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold text-slate-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            Ceylon IntelliBiz
          </Link>
          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="rounded-full px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        {children}

        <motion.section
          id="contact"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-slate-950 p-8 text-white shadow-[0_35px_100px_-32px_rgba(2,8,23,0.8)]"
        >
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.32em] text-slate-400">Ready to see it live?</p>
              <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">{title ?? 'Bring your team into one intelligent operating layer.'}</h2>
              <p className="mt-3 text-lg leading-8 text-slate-300">
                {subtitle ?? 'Book a live walkthrough and discover how Ceylon IntelliBiz can connect your operations, marketplace, and AI workflows.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={ctaHref} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-medium text-slate-950">
                  {ctaLabel} <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="mailto:hello@ceylonintellibiz.com" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 font-medium text-white">
                  <Bot className="h-4 w-4" /> Contact sales
                </a>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>
                  Leave this field empty
                  <input type="text" name="website" value={formState.website} onChange={handleChange} tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
                  Name
                  <input
                    type="text"
                    name="name"
                    maxLength={255}
                    value={formState.name}
                    onChange={handleChange}
                    placeholder="Asha Perera"
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none ring-0 placeholder:text-slate-500"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
                  Work email
                  <input
                    type="email"
                    name="email"
                    maxLength={255}
                    value={formState.email}
                    onChange={handleChange}
                    placeholder="you@company.com"
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none ring-0 placeholder:text-slate-500"
                    required
                  />
                </label>
              </div>

              <label className="mt-3 flex flex-col gap-2 text-sm font-medium text-slate-200">
                Company
                <input
                  type="text"
                  name="company"
                  maxLength={255}
                  value={formState.company}
                  onChange={handleChange}
                  placeholder="Your company"
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none ring-0 placeholder:text-slate-500"
                  required
                />
              </label>

              <label className="mt-3 flex flex-col gap-2 text-sm font-medium text-slate-200">
                What are you looking to improve?
                <textarea
                  name="message"
                  maxLength={2000}
                  value={formState.message}
                  onChange={handleChange}
                  placeholder="Tell us about your workflow, growth goals, or operational challenge."
                  rows={4}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none ring-0 placeholder:text-slate-500"
                />
              </label>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={submitState === 'sending'}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-300 disabled:opacity-70"
                >
                  {submitState === 'sending' ? 'Sending…' : submitState === 'sent' ? 'Request received' : 'Request a demo'} <ArrowRight className="h-4 w-4" />
                </button>
                <p role="status" className={`text-sm ${submitState === 'error' ? 'text-rose-300' : 'text-slate-400'}`}>
                  {submitState === 'sent'
                    ? 'Thanks — we will reach out shortly.'
                    : submitState === 'error'
                      ? 'We could not send your request. Please try again, or email hello@ceylonintellibiz.com.'
                      : 'No spam. Just a tailored follow-up.'}
                </p>
              </div>
            </form>
          </div>
        </motion.section>

        <footer className="flex flex-col gap-2 rounded-[24px] border border-slate-200 bg-white/70 px-4 py-4 text-sm text-slate-600 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Ceylon IntelliBiz. Built for modern operations.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/marketplace" className="transition hover:text-slate-900">Marketplace</Link>
            <Link href="/solutions" className="transition hover:text-slate-900">Solutions</Link>
            <Link href="/insights" className="transition hover:text-slate-900">Insights</Link>
            <Link href="/privacy" className="transition hover:text-slate-900">Privacy</Link>
            <Link href="/security" className="transition hover:text-slate-900">Security</Link>
            <Link href="/contact" className="transition hover:text-slate-900">Contact</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
