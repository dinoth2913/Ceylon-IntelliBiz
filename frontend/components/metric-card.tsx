'use client';

import { motion } from 'framer-motion';

type MetricCardProps = {
  title: string;
  value: string;
  trend: string;
  accent: string;
  index?: number;
  darkMode?: boolean;
};

export function MetricCard({ title, value, trend, accent, index = 0, darkMode = false }: MetricCardProps) {
  const barColor = accent.includes('emerald')
    ? 'bg-emerald-400'
    : accent.includes('blue')
      ? 'bg-sky-400'
      : accent.includes('violet')
        ? 'bg-violet-400'
        : 'bg-amber-400';

  const cardClass = darkMode
    ? 'border-white/10 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
    : 'border-white/20 bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 + index * 0.06, duration: 0.45 }}
      whileHover={{ y: -6, scale: 1.02, boxShadow: '0 18px 40px -18px rgba(15,23,42,0.3)' }}
      className={`group rounded-[22px] border p-5 backdrop-blur-sm ${cardClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className={`mt-3 text-2xl font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{value}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-sm font-medium ${accent}`}>
          {trend}
        </span>
      </div>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: '72%' }}
          transition={{ delay: 0.3 + index * 0.08, duration: 0.7 }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
      <p className="mt-3 text-sm text-slate-400">Updated 5 mins ago</p>
    </motion.div>
  );
}
