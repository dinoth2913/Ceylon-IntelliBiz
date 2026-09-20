'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, CircleAlert, Inbox, Loader2, Mail, RefreshCw } from 'lucide-react';
import { useDashboardTheme } from '@/components/dashboard/dashboard-shell';
import { apiFetch } from '@/lib/auth';

type ContactRequest = {
  id: number;
  name: string;
  email: string;
  company: string;
  message: string | null;
  status: string;
  createdAt: string | null;
};

type LoadState = 'loading' | 'ready' | 'error';

function relativeTime(iso: string | null) {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function LeadsPage() {
  const { darkMode } = useDashboardTheme();
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const response = await apiFetch('/api/contact-requests');
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const data = await response.json();
      setRequests(Array.isArray(data) ? data : []);
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cardClass = darkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/80 shadow-sm';
  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';
  const heading = darkMode ? 'text-white' : 'text-slate-900';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className={`text-sm ${muted}`}>CRM</p>
          <h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${darkMode ? 'text-white' : 'text-slate-950'}`}>Demo requests</h1>
          <p className={`mt-1 text-sm ${muted}`}>People who asked for a demo through the website form.</p>
        </div>
        <button
          onClick={() => void load()}
          disabled={state === 'loading'}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition disabled:opacity-60 ${darkMode ? 'border-white/10 text-slate-200 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
        >
          <RefreshCw className={`h-4 w-4 ${state === 'loading' ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {state === 'loading' && requests.length === 0 && (
        <div className={`flex items-center justify-center gap-2 rounded-[24px] border p-10 text-sm ${cardClass} ${muted}`}>
          <Loader2 className="h-4 w-4 animate-spin" /> Loading requests…
        </div>
      )}

      {state === 'error' && (
        <div role="alert" className="flex items-start gap-3 rounded-[24px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>We couldn&apos;t load demo requests. Check that the backend is running and that you are signed in, then try again.</p>
        </div>
      )}

      {state === 'ready' && requests.length === 0 && (
        <div className={`flex flex-col items-center gap-3 rounded-[24px] border p-12 text-center ${cardClass}`}>
          <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${darkMode ? 'bg-cyan-400/10 text-cyan-300' : 'bg-slate-950 text-white'}`}>
            <Inbox className="h-5 w-5" />
          </span>
          <p className={`text-base font-semibold ${heading}`}>No demo requests yet</p>
          <p className={`max-w-sm text-sm ${muted}`}>When someone fills in the &ldquo;Request a demo&rdquo; form on the website, it will show up here.</p>
        </div>
      )}

      {requests.length > 0 && (
        <>
          <p className={`text-sm ${muted}`}>
            {requests.length} {requests.length === 1 ? 'request' : 'requests'}, newest first
          </p>
          <ul className="grid gap-4">
            {requests.map((request, index) => (
              <motion.li
                key={request.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.3 }}
                className={`rounded-[24px] border p-5 ${cardClass}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className={`truncate text-base font-semibold ${heading}`}>{request.name}</h2>
                    <p className={`mt-0.5 flex items-center gap-1.5 text-sm ${muted}`}>
                      <Building2 className="h-3.5 w-3.5 shrink-0" /> {request.company}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300">{request.status}</span>
                    <span className={`text-xs ${muted}`}>{relativeTime(request.createdAt)}</span>
                  </div>
                </div>
                {request.message && <p className={`mt-3 whitespace-pre-line text-sm leading-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{request.message}</p>}
                <a
                  href={`mailto:${request.email}?subject=${encodeURIComponent('Your Ceylon IntelliBiz demo request')}`}
                  className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${darkMode ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
                >
                  <Mail className="h-4 w-4" /> Reply to {request.email}
                </a>
              </motion.li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
