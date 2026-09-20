'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, PackageCheck, Radio } from 'lucide-react';
import { useDashboardTheme } from '@/components/dashboard/dashboard-shell';
import { apiFetch } from '@/lib/auth';
import { shortId } from '@/lib/utils';
import { inventory as seedInventory, formatLkr, type InventoryRecord } from '@/lib/dashboard-data';

type BackendInventoryItem = {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  warehouse: string | null;
  price: number;
  stockQuantity: number | null;
  reorderLevel: number | null;
};

function mapInventoryItem(record: BackendInventoryItem): InventoryRecord {
  return {
    id: `INV-${shortId(record.id)}`,
    sku: record.sku,
    name: record.name,
    category: record.category ?? 'Uncategorized',
    warehouse: record.warehouse ?? '—',
    stock: record.stockQuantity ?? 0,
    reorderLevel: record.reorderLevel ?? 10,
    unitCost: record.price
  };
}

export default function InventoryPage() {
  const { darkMode } = useDashboardTheme();
  const [inventory, setInventory] = useState<InventoryRecord[]>(seedInventory);
  const [dataSource, setDataSource] = useState<'sample' | 'live'>('sample');
  const cardClass = darkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/80 shadow-sm';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiFetch('/api/inventory');
        if (!response.ok) return;
        const data: BackendInventoryItem[] = await response.json();
        if (!cancelled && Array.isArray(data)) {
          setInventory(data.map(mapInventoryItem));
          setDataSource('live');
        }
      } catch {
        // Backend not reachable — keep showing the bundled sample data.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const lowStockCount = inventory.filter((item) => item.stock <= item.reorderLevel).length;
  const totalValue = inventory.reduce((sum, item) => sum + item.stock * item.unitCost, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Operations</p>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
              dataSource === 'live'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300'
                : darkMode
                  ? 'border-white/10 text-slate-400'
                  : 'border-slate-200 text-slate-500'
            }`}
          >
            <Radio className="h-3 w-3" /> {dataSource === 'live' ? 'Live from API' : 'Sample data'}
          </span>
        </div>
        <h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${darkMode ? 'text-white' : 'text-slate-950'}`}>Inventory</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`rounded-[20px] border p-4 ${cardClass}`}>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>SKUs tracked</p>
          <p className={`mt-1 text-2xl font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>{inventory.length}</p>
        </div>
        <div className={`rounded-[20px] border p-4 ${cardClass}`}>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Below reorder level</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-300">{lowStockCount}</p>
        </div>
        <div className={`rounded-[20px] border p-4 ${cardClass}`}>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Stock value on hand</p>
          <p className={`mt-1 text-2xl font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>{formatLkr(totalValue)}</p>
        </div>
      </div>

      {inventory.length === 0 && (
        <div className={`rounded-[24px] border p-8 text-center text-sm ${cardClass} ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          No inventory items yet.
        </div>
      )}

      <div className="grid gap-4">
        {inventory.map((item, index) => {
          const ratio = Math.min(100, Math.round((item.stock / (item.reorderLevel * 2)) * 100));
          const isLow = item.stock <= item.reorderLevel;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.35 }}
              className={`rounded-[24px] border p-5 ${cardClass}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className={`text-xs font-medium uppercase tracking-wide ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{item.sku} · {item.category}</p>
                  <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.name}</h3>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.warehouse} · unit cost {formatLkr(item.unitCost)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isLow ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
                      <AlertTriangle className="h-3.5 w-3.5" /> Reorder now
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                      <PackageCheck className="h-3.5 w-3.5" /> Healthy stock
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className={`h-2 flex-1 overflow-hidden rounded-full ${darkMode ? 'bg-white/10' : 'bg-slate-100'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${ratio}%` }}
                    transition={{ delay: 0.15 + index * 0.05, duration: 0.6 }}
                    className={`h-full rounded-full ${isLow ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  />
                </div>
                <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{item.stock} units</span>
                <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>reorder at {item.reorderLevel}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
