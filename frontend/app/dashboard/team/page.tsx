'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, CircleAlert, Copy, KeyRound, Loader2, RefreshCw, ShieldCheck, UserRoundCheck, X } from 'lucide-react';
import { useDashboardTheme, useDashboardUser } from '@/components/dashboard/dashboard-shell';
import { apiFetch } from '@/lib/auth';
import { ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, normaliseRole, type Role } from '@/lib/roles';

type TeamMember = {
  id: string;
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
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<{ username: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const confirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
    };
  }, []);

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

  const handleResetClick = (member: TeamMember) => {
    if (confirmingId !== member.id) {
      setConfirmingId(member.id);
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
      confirmTimeout.current = setTimeout(() => setConfirmingId(null), 4000);
      return;
    }
    if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
    setConfirmingId(null);
    void resetPassword(member);
  };

  const resetPassword = async (member: TeamMember) => {
    setResettingId(member.id);
    setNotice(null);
    try {
      const response = await apiFetch(`/api/users/${member.id}/reset-password`, { method: 'POST' });
      if (!response.ok) {
        setNotice({ kind: 'error', text: await errorMessage(response, "Could not reset that person's password.") });
        return;
      }
      const result: { username: string; temporaryPassword: string } = await response.json();
      setResetResult({ username: result.username, password: result.temporaryPassword });
      setCopied(false);
    } catch {
      setNotice({ kind: 'error', text: 'The server could not be reached. Nothing was changed.' });
    } finally {
      setResettingId(null);
    }
  };

  const copyPassword = async () => {
    if (!resetResult) return;
    try {
      await navigator.clipboard.writeText(resetResult.password);
      setCopied(true);
    } catch {
      // Clipboard access can be blocked; the password is still selectable/visible in the banner.
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

      {resetResult && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">New password for {resetResult.username}</p>
              <p className="mt-1 text-xs opacity-80">Shown once — copy it now and send it to them directly. It won&apos;t be shown again.</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="rounded-lg bg-white/70 px-2.5 py-1.5 font-mono text-sm dark:bg-black/20">{resetResult.password}</code>
                <button
                  onClick={() => void copyPassword()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-400/30 dark:bg-transparent dark:text-amber-100 dark:hover:bg-amber-400/10"
                >
                  <Copy className="h-3.5 w-3.5" /> {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <button onClick={() => setResetResult(null)} aria-label="Dismiss" className="text-amber-700 hover:text-amber-900 dark:text-amber-200 dark:hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
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
                            <button
                              onClick={() => handleResetClick(member)}
                              disabled={resettingId === member.id}
                              title={confirmingId === member.id ? 'Click again to confirm' : `Reset ${member.username}'s password`}
                              aria-label={confirmingId === member.id ? `Click again to confirm resetting ${member.username}'s password` : `Reset ${member.username}'s password`}
                              className={`flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition disabled:opacity-50 ${
                                confirmingId === member.id
                                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                                  : darkMode
                                    ? 'text-slate-400 hover:bg-white/10 hover:text-white'
                                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                              }`}
                            >
                              {resettingId === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                              {confirmingId === member.id && 'Confirm?'}
                            </button>
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
