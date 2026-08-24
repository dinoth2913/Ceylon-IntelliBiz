'use client';

import { motion } from 'framer-motion';

type BarListProps = {
  items: { label: string; value: number; color: string }[];
  darkMode?: boolean;
};

export function BarList({ items, darkMode = false }: BarListProps) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item, index) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>{item.label}</span>
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.value}%</span>
          </div>
          <div className={`h-2 overflow-hidden rounded-full ${darkMode ? 'bg-white/10' : 'bg-slate-100'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.value}%` }}
              transition={{ delay: 0.1 + index * 0.08, duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full ${item.color}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
