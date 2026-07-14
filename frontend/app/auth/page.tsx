'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { ArrowRight, Bot, Eye, EyeOff, Lock, Mail, Sparkles, UserPlus } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [submitted, setSubmitted] = useState(false);

  const title = useMemo(() => (mode === 'login' ? 'Welcome back' : 'Create your account'), [mode]);
  const subtitle = useMemo(
    () =>
      mode === 'login'
        ? 'Access your workspace, insights, and AI recommendations.'
        : 'Open your operating workspace in minutes and start collaborating.',
    [mode]
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_35%),linear-gradient(135deg,#f8fafc_0%,#eef4ff_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white/80 shadow-[0_35px_100px_-32px_rgba(15,23,42,0.4)] backdrop-blur-xl">
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="hidden w-[46%] flex-col justify-between bg-slate-950 p-8 text-white lg:flex"
        >
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm font-medium text-slate-200">
              <Sparkles className="h-4 w-4" />
              Secure AI operating workspace
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight">Run your business from one intelligent dashboard.</h1>
              <p className="max-w-md text-lg leading-8 text-slate-300">
                Connect your teams, workflows, and insights under one trusted platform designed for fast-moving organizations.
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">AI-guided operations</p>
                <p className="mt-1 text-sm text-slate-400">Stay ahead with proactive recommendations and live decision support.</p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="flex-1 p-6 sm:p-8 lg:p-10"
        >
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white">
                <Sparkles className="h-5 w-5" />
              </span>
              Ceylon IntelliBiz
            </Link>
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setSubmitted(false);
              }}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              {mode === 'login' ? 'Create account' : 'Sign in'}
            </button>
          </div>

          <div className="mx-auto mt-10 max-w-md">
            <div className="mb-6">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
              <p className="mt-2 text-base leading-7 text-slate-600">{subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Full name
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                    <UserPlus className="h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Asha Perera"
                      className="w-full bg-transparent outline-none"
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      required
                    />
                  </div>
                </label>
              )}

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Email address
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="you@company.com"
                    className="w-full bg-transparent outline-none"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    required
                  />
                </div>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Password
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                  <Lock className="h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="w-full bg-transparent outline-none"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-slate-400">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <motion.button
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white shadow-lg shadow-slate-950/15"
              >
                {mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight className="h-4 w-4" />
              </motion.button>
            </form>

            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                {mode === 'login'
                  ? 'You are now ready to continue into your workspace.'
                  : 'Your account has been prepared. Please check your inbox to confirm your email.'}
              </motion.div>
            )}
          </div>
        </motion.section>
      </div>
    </main>
  );
}
