'use client';

const toneClasses: Record<string, { light: string; dark: string }> = {
  positive: { light: 'border-emerald-200 bg-emerald-50 text-emerald-700', dark: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' },
  neutral: { light: 'border-sky-200 bg-sky-50 text-sky-700', dark: 'border-sky-400/20 bg-sky-400/10 text-sky-300' },
  warning: { light: 'border-amber-200 bg-amber-50 text-amber-700', dark: 'border-amber-400/20 bg-amber-400/10 text-amber-300' },
  negative: { light: 'border-rose-200 bg-rose-50 text-rose-700', dark: 'border-rose-400/20 bg-rose-400/10 text-rose-300' },
  muted: { light: 'border-slate-200 bg-slate-50 text-slate-600', dark: 'border-white/10 bg-white/5 text-slate-300' }
};

const statusToneMap: Record<string, keyof typeof toneClasses> = {
  Active: 'positive',
  Fulfilled: 'positive',
  Paid: 'positive',
  Processing: 'neutral',
  Prospect: 'neutral',
  Draft: 'muted',
  'Pending payment': 'warning',
  'At risk': 'warning',
  Outstanding: 'warning',
  Cancelled: 'negative',
  Overdue: 'negative'
};

export function StatusBadge({ status, darkMode = false }: { status: string; darkMode?: boolean }) {
  const tone = statusToneMap[status] ?? 'muted';
  const classes = toneClasses[tone];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${darkMode ? classes.dark : classes.light}`}>
      {status}
    </span>
  );
}
