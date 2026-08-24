'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bot,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-react';
import { useDashboardTheme } from '@/components/dashboard/dashboard-shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { AreaChart } from '@/components/dashboard/area-chart';
import { BarList } from '@/components/dashboard/bar-list';
import { StatusBadge } from '@/components/dashboard/status-badge';
import {
  activity,
  aiInsights,
  channelBreakdown,
  formatLkr,
  inventory,
  orders,
  revenueTrend,
  revenueTrendLabels
} from '@/lib/dashboard-data';

export default function DashboardOverviewPage() {
  const { darkMode } = useDashboardTheme();
  const lowStock = inventory.filter((item) => item.stock <= item.reorderLevel);
  const cardClass = darkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/80 shadow-sm';

  return (
    <div className="flex flex-col gap-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sunday, 23 August 2026</p>
        <h1 className={`mt-1 text-2xl font-semibold tracking-tight sm:text-3xl ${darkMode ? 'text-white' : 'text-slate-950'}`}>
          Good to see you, Asha. Here&apos;s how the business is doing.
        </h1>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue (MTD)" value="LKR 28.4M" trend="+18.2%" icon={TrendingUp} accent="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300" index={0} />
        <StatCard label="Active customers" value="13,248" trend="+7.4%" icon={Users} accent="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300" index={1} />
        <StatCard label="Open orders" value="184" trend="+3.1%" icon={ShoppingBag} accent="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300" index={2} />
        <StatCard label="Outstanding invoices" value="LKR 677K" trend="-4.6%" trendDirection="down" icon={Wallet} accent="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300" index={3} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.45 }} className={`rounded-[28px] border p-6 backdrop-blur-xl ${cardClass}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Revenue trend</p>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Last 12 months</h2>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
              <ArrowUpRight className="h-3.5 w-3.5" /> +56% YoY
            </span>
          </div>
          <div className="mt-4">
            <AreaChart data={revenueTrend} labels={revenueTrendLabels} darkMode={darkMode} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.45 }} className={`rounded-[28px] border p-6 backdrop-blur-xl ${cardClass}`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Orders by channel</p>
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Where revenue comes from</h2>
          <div className="mt-5">
            <BarList items={channelBreakdown} darkMode={darkMode} />
          </div>
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.45 }} className={`rounded-[28px] border p-6 backdrop-blur-xl ${cardClass}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Recent orders</h2>
            <Link href="/dashboard/orders" className={`inline-flex items-center gap-1 text-sm font-medium ${darkMode ? 'text-cyan-300' : 'text-blue-700'}`}>
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[460px] text-left text-sm">
              <thead>
                <tr className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                  <th className="pb-2 font-medium">Order</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Total</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td className={`py-3 font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{order.id}</td>
                    <td className={darkMode ? 'text-slate-300' : 'text-slate-600'}>{order.customer}</td>
                    <td className={darkMode ? 'text-slate-300' : 'text-slate-600'}>{formatLkr(order.total)}</td>
                    <td>
                      <StatusBadge status={order.status} darkMode={darkMode} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.45 }} className={`rounded-[28px] border p-6 backdrop-blur-xl ${cardClass}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Low stock alerts</h2>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {lowStock.map((item) => (
              <div key={item.id} className={`rounded-2xl border p-3 ${darkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.name}</p>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-300">{item.stock} left</span>
                </div>
                <p className={`mt-1 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.warehouse} · reorder at {item.reorderLevel}</p>
              </div>
            ))}
            <Link href="/dashboard/inventory" className={`mt-1 inline-flex items-center gap-1 text-sm font-medium ${darkMode ? 'text-cyan-300' : 'text-blue-700'}`}>
              Manage inventory <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.45 }} className={`rounded-[28px] border p-6 backdrop-blur-xl ${cardClass}`}>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Recent activity</h2>
          <div className={`mt-4 flex flex-col gap-4 border-l pl-4 ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
            {activity.map((item) => (
              <div key={item.id} className="relative">
                <span className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ${darkMode ? 'bg-cyan-400' : 'bg-blue-600'}`} />
                <p className={`text-sm ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  <span className="font-semibold">{item.actor}</span> {item.action} <span className="font-medium">{item.target}</span>
                </p>
                <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{item.time}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.45 }}
          className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_30px_70px_-30px_rgba(2,8,23,0.8)] dark:border-white/10"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.24),_transparent_38%)]" />
          <div className="relative flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm font-medium text-cyan-200">
              <Sparkles className="h-4 w-4" /> AI Assistant
            </div>
            <Link href="/dashboard/ai" className="inline-flex items-center gap-1 text-sm font-medium text-slate-200">
              Open assistant <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="relative mt-4 flex flex-col gap-3">
            {aiInsights.slice(0, 2).map((insight) => (
              <div key={insight.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-cyan-300" />
                  <p className="text-sm font-semibold">{insight.title}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{insight.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
