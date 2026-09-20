'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, CircleAlert, Loader2, RefreshCw, ShieldCheck, UserRoundCheck } from 'lucide-react';
import { useDashboardTheme, useDashboardUser } from '@/components/dashboard/dashboard-shell';
import { apiFetch } from '@/lib/auth';
import { ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, normaliseRole, type Role } from '@/lib/roles';

type TeamMember = {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string | null;
};

type LoadState = 'loading' | 'ready' | 'error';

function joined(iso: string | null) {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

async function errorMessage(response: Response, fallback: string) {
  try {
    const body = await response.json();
    return typeof body?.message === 'string' ? body.message : fallback;
  } catch {
    return fallback;
  }
}

export default function TeamPage() {
  const { darkMode } = useDashboardTheme();
  const { user } = useDashboardUser();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const response = await apiFetch('/api/users');
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const data = await response.json();
      setMembers(Array.isArray(data) ? data : []);
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const changeRole = async (member: TeamMember, role: string) => {
    if (role === normaliseRole(member.role)) return;
    setSavingId(member.id);
    setNotice(null);
    try {
      const response = await apiFetch(`/api/users/${member.id}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
      if (!response.ok) {
        setNotice({ kind: 'error', text: await errorMessage(response, 'Could not change that role.') });
        return;
      }
      const updated: TeamMember = await response.json();
      setMembers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setNotice({ kind: 'ok', text: `${updated.username} is now ${ROLE_LABELS[normaliseRole(updated.role) as Role] ?? updated.role}.` });
    } catch {
      setNotice({ kind: 'error', text: 'The server could not be reached. Nothing was changed.' });
    } finally {
      setSavingId(null);
    }
  };

  const cardClass = darkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/80 shadow-sm';
  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';
  const heading = darkMode ? 'text-white' : 'text-slate-900';
  const waiting = members.filter((member) => normaliseRole(member.role) === 'STAFF').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className={`text-sm ${muted}`}>Workspace</p>
          <h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${darkMode ? 'text-white' : 'text-slate-950'}`}>Team &amp; roles</h1>
          <p className={`mt-1 text-sm ${muted}`}>Anyone can sign up, but new accounts have no access to business data until you give them a role.</p>
        </div>
        <button
          onClick={() => void load()}
          disabled={state === 'loading'}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition disabled:opacity-60 ${darkMode ? 'border-white/10 text-slate-200 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
        >
          <RefreshCw className={`h-4 w-4 ${state === 'loading' ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ROLES.map((role) => (
          <div key={role} className={`rounded-[20px] border p-4 ${cardClass}`}>
            <p className={`flex items-center gap-2 text-sm font-semibold ${heading}`}>
              <ShieldCheck className="h-4 w-4 text-cyan-500" /> {ROLE_LABELS[role]}
            </p>
            <p className={`mt-1.5 text-xs leading-5 ${muted}`}>{ROLE_DESCRIPTIONS[role]}</p>
          </div>
        ))}
      </section>

      {notice && (
        <p
          role={notice.kind === 'error' ? 'alert' : 'status'}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${
            notice.kind === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200'
              : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200'
          }`}
        >
          {notice.kind === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />} {notice.text}
        </p>
      )}

      {state === 'loading' && members.length === 0 && (
        <div className={`flex items-center justify-center gap-2 rounded-[24px] border p-10 text-sm ${cardClass} ${muted}`}>
          <Loader2 className="h-4 w-4 animate-spin" /> Loading team…
        </div>
      )}

      {state === 'error' && (
        <div role="alert" className="flex items-start gap-3 rounded-[24px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>We couldn&apos;t load the team. Check that the backend is running, then try again.</p>
        </div>
      )}

      {members.length > 0 && (
        <>
          <p className={`flex items-center gap-2 text-sm ${muted}`}>
            {members.length} {members.length === 1 ? 'person' : 'people'}
            {waiting > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
                <UserRoundCheck className="h-3 w-3" /> {waiting} waiting for a role
              </span>
            )}
          </p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`overflow-hidden rounded-[24px] border ${cardClass}`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className={darkMode ? 'border-b border-white/10 text-slate-400' : 'border-b border-slate-100 text-slate-500'}>
                    <th className="px-5 py-3 font-medium">Person</th>
                    <th className="px-5 py-3 font-medium">Joined</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                  {members.map((member) => {
                    const role = normaliseRole(member.role);
                    const isYou = user?.username === member.username;
                    return (
                      <tr key={member.id} className={darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}>
                        <td className="px-5 py-3.5">
                          <p className={`font-medium ${heading}`}>
                            {member.username} {isYou && <span className={`ml-1 text-xs font-normal ${muted}`}>(you)</span>}
                          </p>
                          {member.email !== member.username && <p className={`text-xs ${muted}`}>{member.email}</p>}
                        </td>
                        <td className={`px-5 py-3.5 ${muted}`}>{joined(member.createdAt)}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <select
                              aria-label={`Role for ${member.username}`}
                              value={ROLES.includes(role as Role) ? role : ''}
                              disabled={savingId === member.id}
                              onChange={(event) => void changeRole(member, event.target.value)}
                              className={`rounded-xl border px-3 py-1.5 text-sm outline-none disabled:opacity-60 ${darkMode ? 'border-white/10 bg-slate-950/60 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
                            >
                              {!ROLES.includes(role as Role) && <option value="">{member.role}</option>}
                              {ROLES.map((option) => (
                                <option key={option} value={option}>
                                  {ROLE_LABELS[option]}
                                </option>
                              ))}
                            </select>
                            {savingId === member.id && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
