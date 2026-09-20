'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { useDashboardTheme } from './dashboard-shell';

type StatCardProps = {
  label: string;
  value: string;
  trend?: string;
  trendDirection?: 'up' | 'down';
  icon: LucideIcon;
  accent: string;
  index?: number;
};

export function StatCard({ label, value, trend, trendDirection = 'up', icon: Icon, accent, index = 0 }: StatCardProps) {
  const { darkMode } = useDashboardTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className={`rounded-[24px] border p-5 backdrop-blur-xl ${darkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/80 shadow-sm'}`}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${trendDirection === 'up' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className={`mt-4 text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-slate-950'}`}>{value}</p>
    </motion.div>
  );
}
