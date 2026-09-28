'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, CircleAlert, Inbox, Loader2, Mail, RefreshCw, Search } from 'lucide-react';
import { useDashboardTheme } from '@/components/dashboard/dashboard-shell';
import { apiFetch } from '@/lib/auth';

type ContactRequest = {
  id: string;
  name: string;
  email: string;
  company: string;
  message: string | null;
  status: string;
  createdAt: string | null;
};

type LoadState = 'loading' | 'ready' | 'error';

const STATUSES = ['New', 'In Progress', 'Resolved', 'Closed'];

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
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const updateStatus = async (id: string, nextStatus: string) => {
    setUpdatingId(id);
    try {
      const response = await apiFetch(`/api/contact-requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });
      if (!response.ok) throw new Error(`Update failed (${response.status})`);
      const updated = await response.json();
      setRequests((current) => current.map((request) => (request.id === id ? updated : request)));
    } catch {
      // The dropdown will simply keep showing the old status if this fails; the user can retry.
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => {
    return requests.filter((request) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q || request.name.toLowerCase().includes(q) || request.company.toLowerCase().includes(q) || request.email.toLowerCase().includes(q);
      const matchesStatus = status === 'All' || request.status === status;
      const createdAt = request.createdAt ? new Date(request.createdAt).getTime() : null;
      const matchesFrom = !dateFrom || (createdAt !== null && createdAt >= new Date(dateFrom).getTime());
      const matchesTo = !dateTo || (createdAt !== null && createdAt <= new Date(dateTo).getTime() + 86_400_000 - 1);
      return matchesQuery && matchesStatus && matchesFrom && matchesTo;
    });
  }, [requests, query, status, dateFrom, dateTo]);

  const cardClass = darkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/80 shadow-sm';
  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';
  const heading = darkMode ? 'text-white' : 'text-slate-900';
  const filterInputClass = darkMode
    ? 'rounded-full border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-200 outline-none'
    : 'rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none';

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
          <div className={`flex flex-wrap items-center gap-3 rounded-[24px] border p-4 ${cardClass}`}>
            <div className={`flex flex-1 min-w-[200px] items-center gap-2 rounded-full border px-4 py-2 ${darkMode ? 'border-white/10 bg-slate-950/60 text-slate-300' : 'border-slate-200 bg-white text-slate-500'}`}>
              <Search className="h-4 w-4" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, company or email"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={filterInputClass}>
              <option value="All">All statuses</option>
              {STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="From date" className={filterInputClass} />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="To date" className={filterInputClass} />
          </div>

          <p className={`text-sm ${muted}`}>
            {filtered.length} of {requests.length} {requests.length === 1 ? 'request' : 'requests'}, newest first
          </p>

          {filtered.length === 0 ? (
            <div className={`rounded-[24px] border p-10 text-center text-sm ${cardClass} ${muted}`}>No requests match your filters.</div>
          ) : (
            <ul className="grid gap-4">
              {filtered.map((request, index) => (
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
                      <select
                        value={request.status}
                        disabled={updatingId === request.id}
                        onChange={(e) => void updateStatus(request.id, e.target.value)}
                        className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 outline-none disabled:opacity-60 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300"
                      >
                        {STATUSES.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
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
          )}
        </>
      )}
    </div>
  );
}
