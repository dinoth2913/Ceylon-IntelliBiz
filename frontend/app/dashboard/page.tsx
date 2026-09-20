'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, ArrowUpRight, Bot, CircleDollarSign, Radio, ShoppingBag, Sparkles, Users, Wallet } from 'lucide-react';
import { useDashboardTheme } from '@/components/dashboard/dashboard-shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { AreaChart } from '@/components/dashboard/area-chart';
import { BarList } from '@/components/dashboard/bar-list';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { apiFetch, getSession } from '@/lib/auth';
import { fetchInsights } from '@/lib/ai';
import {
  activity,
  aiInsights as sampleInsights,
  channelBreakdown,
  customers as sampleCustomers,
  formatLkr,
  inventory as sampleInventory,
  invoices as sampleInvoices,
  orders as sampleOrders,
  revenueTrend,
  revenueTrendLabels,
  type AiInsight
} from '@/lib/dashboard-data';

type OrderRow = { id: string; customer: string; total: number; status: string };
type InvoiceRow = { amount: number; status: string };
type StockRow = { id: string; name: string; warehouse: string; stock: number; reorderLevel: number };

type Snapshot = {
  customers: number;
  orders: OrderRow[];
  invoices: InvoiceRow[];
  stock: StockRow[];
};

type BackendCustomer = { id: number; fullName: string };
type BackendOrder = { id: number; orderNumber: string; customerId: number | null; totalAmount: number; status: string; createdAt: string | null };
type BackendInvoice = { totalAmount: number; status: string };
type BackendInventoryItem = { id: number; name: string; warehouse: string | null; stockQuantity: number | null; reorderLevel: number | null };

const sampleSnapshot: Snapshot = {
  customers: sampleCustomers.length,
  orders: sampleOrders.map((order) => ({ id: order.id, customer: order.customer, total: order.total, status: order.status })),
  invoices: sampleInvoices.map((invoice) => ({ amount: invoice.amount, status: invoice.status })),
  stock: sampleInventory.map((item) => ({ id: item.id, name: item.name, warehouse: item.warehouse, stock: item.stock, reorderLevel: item.reorderLevel }))
};

const norm = (status: string) => status.trim().toLowerCase();

async function loadLiveSnapshot(): Promise<Snapshot | null> {
  try {
    const responses = await Promise.all(['/api/customers', '/api/orders', '/api/invoices', '/api/inventory'].map((path) => apiFetch(path)));
    if (responses.some((response) => !response.ok)) return null;
    const [customers, orders, invoices, inventory] = (await Promise.all(responses.map((response) => response.json()))) as [
      BackendCustomer[],
      BackendOrder[],
      BackendInvoice[],
      BackendInventoryItem[]
    ];
    if (![customers, orders, invoices, inventory].every(Array.isArray)) return null;

    const names = new Map(customers.map((customer) => [customer.id, customer.fullName]));
    const newestFirst = [...orders].sort((a, b) => (Date.parse(b.createdAt ?? '') || 0) - (Date.parse(a.createdAt ?? '') || 0));

    return {
      customers: customers.length,
      orders: newestFirst.map((order) => ({
        id: order.orderNumber,
        customer: names.get(order.customerId ?? -1) ?? 'Unknown customer',
        total: order.totalAmount,
        status: order.status
      })),
      invoices: invoices.map((invoice) => ({ amount: invoice.totalAmount, status: invoice.status })),
      stock: inventory.map((item) => ({
        id: `INV-${item.id}`,
        name: item.name,
        warehouse: item.warehouse ?? '—',
        stock: item.stockQuantity ?? 0,
        reorderLevel: item.reorderLevel ?? 0
      }))
    };
  } catch {
    return null;
  }
}

function toBars(parts: { label: string; count: number; color: string }[]) {
  const total = parts.reduce((sum, part) => sum + part.count, 0);
  return parts.map((part) => ({
    label: `${part.label} (${part.count})`,
    value: total ? Math.round((part.count / total) * 100) : 0,
    color: part.color
  }));
}

const sumAmount = (invoices: InvoiceRow[], statuses: string[]) =>
  invoices.filter((invoice) => statuses.includes(norm(invoice.status))).reduce((sum, invoice) => sum + invoice.amount, 0);

const countStatus = (rows: { status: string }[], status: string) => rows.filter((row) => norm(row.status) === status).length;

export default function DashboardOverviewPage() {
  const { darkMode } = useDashboardTheme();
  const [snapshot, setSnapshot] = useState<Snapshot>(sampleSnapshot);
  const [dataSource, setDataSource] = useState<'sample' | 'live'>('sample');
  const [insights, setInsights] = useState<AiInsight[] | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [today, setToday] = useState('');

  useEffect(() => {
    setUsername(getSession()?.user.username ?? null);
    setToday(new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));

    let cancelled = false;
    (async () => {
      const live = await loadLiveSnapshot();
      if (cancelled || !live) return;
      setSnapshot(live);
      setDataSource('live');
      try {
        const fetched = await fetchInsights();
        if (!cancelled) setInsights(fetched);
      } catch {
        // The AI service may be down; the assistant card explains that.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isLive = dataSource === 'live';
  const { customers, orders, invoices, stock } = snapshot;

  const derived = useMemo(() => {
    const lowStock = stock.filter((item) => item.stock <= item.reorderLevel);
    const openOrders = countStatus(orders, 'processing') + countStatus(orders, 'pending payment');
    return {
      lowStock,
      openOrders,
      collected: sumAmount(invoices, ['paid']),
      outstanding: sumAmount(invoices, ['outstanding', 'overdue']),
      orderBars: toBars([
        { label: 'Fulfilled', count: countStatus(orders, 'fulfilled'), color: 'bg-emerald-400' },
        { label: 'Processing', count: countStatus(orders, 'processing'), color: 'bg-sky-400' },
        { label: 'Pending payment', count: countStatus(orders, 'pending payment'), color: 'bg-amber-400' },
        { label: 'Cancelled', count: countStatus(orders, 'cancelled'), color: 'bg-rose-400' }
      ]),
      invoiceBars: toBars([
        { label: 'Paid', count: countStatus(invoices, 'paid'), color: 'bg-emerald-400' },
        { label: 'Outstanding', count: countStatus(invoices, 'outstanding'), color: 'bg-sky-400' },
        { label: 'Overdue', count: countStatus(invoices, 'overdue'), color: 'bg-rose-400' },
        { label: 'Draft', count: countStatus(invoices, 'draft'), color: 'bg-slate-400' }
      ])
    };
  }, [orders, invoices, stock]);

  const cardClass = darkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/80 shadow-sm';
  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';
  const heading = darkMode ? 'text-white' : 'text-slate-950';
  const panel = `rounded-[28px] border p-6 backdrop-blur-xl ${cardClass}`;
  const assistantInsights = isLive ? (insights ?? []).slice(0, 2) : sampleInsights.slice(0, 2);
  const yearChange = Math.round(((revenueTrend[revenueTrend.length - 1] - revenueTrend[0]) / revenueTrend[0]) * 100);
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-wrap items-center gap-2">
          <p className={`min-h-5 text-sm ${muted}`}>{today}</p>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
              isLive
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300'
                : darkMode
                  ? 'border-white/10 text-slate-400'
                  : 'border-slate-200 text-slate-500'
            }`}
          >
            <Radio className="h-3 w-3" /> {isLive ? 'Live from API' : 'Sample data'}
          </span>
        </div>
        <h1 className={`mt-1 text-2xl font-semibold tracking-tight sm:text-3xl ${heading}`}>
          {username ? `Good to see you, ${username}.` : 'Welcome back.'} Here&apos;s how the business is doing.
        </h1>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Customers" value={String(customers)} icon={Users} accent="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300" index={0} />
        <StatCard label="Open orders" value={String(derived.openOrders)} icon={ShoppingBag} accent="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300" index={1} />
        <StatCard label="Collected (paid invoices)" value={formatLkr(derived.collected)} icon={CircleDollarSign} accent="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300" index={2} />
        <StatCard label="Outstanding invoices" value={formatLkr(derived.outstanding)} icon={Wallet} accent="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300" index={3} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {isLive ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.45 }} className={panel}>
            <p className={`text-sm font-medium ${muted}`}>Orders by status</p>
            <h2 className={`text-xl font-semibold ${heading}`}>Where your orders stand</h2>
            <div className="mt-5">
              {orders.length > 0 ? <BarList items={derived.orderBars} darkMode={darkMode} /> : <p className={`text-sm ${muted}`}>No orders yet. They will appear here as you add them.</p>}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.45 }} className={panel}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className={`text-sm font-medium ${muted}`}>Revenue trend (sample)</p>
                <h2 className={`text-xl font-semibold ${heading}`}>Last 12 months</h2>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                <ArrowUpRight className="h-3.5 w-3.5" /> +{yearChange}% over the period
              </span>
            </div>
            <div className="mt-4">
              <AreaChart data={revenueTrend} labels={revenueTrendLabels} darkMode={darkMode} />
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.45 }} className={panel}>
          {isLive ? (
            <>
              <p className={`text-sm font-medium ${muted}`}>Invoices by status</p>
              <h2 className={`text-xl font-semibold ${heading}`}>Where your billing stands</h2>
              <div className="mt-5">
                {invoices.length > 0 ? <BarList items={derived.invoiceBars} darkMode={darkMode} /> : <p className={`text-sm ${muted}`}>No invoices yet.</p>}
              </div>
            </>
          ) : (
            <>
              <p className={`text-sm font-medium ${muted}`}>Orders by channel (sample)</p>
              <h2 className={`text-xl font-semibold ${heading}`}>Where revenue comes from</h2>
              <div className="mt-5">
                <BarList items={channelBreakdown} darkMode={darkMode} />
              </div>
            </>
          )}
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.45 }} className={panel}>
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-semibold ${heading}`}>Recent orders</h2>
            <Link href="/dashboard/orders" className={`inline-flex items-center gap-1 text-sm font-medium ${darkMode ? 'text-cyan-300' : 'text-blue-700'}`}>
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className={`mt-4 text-sm ${muted}`}>No orders yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[460px] text-left text-sm">
                <thead>
                  <tr className={muted}>
                    <th className="pb-2 font-medium">Order</th>
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Total</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                  {recentOrders.map((order) => (
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
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.45 }} className={panel}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className={`text-lg font-semibold ${heading}`}>Low stock alerts</h2>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {derived.lowStock.length === 0 && <p className={`text-sm ${muted}`}>Nothing is at or below its reorder level.</p>}
            {derived.lowStock.map((item) => (
              <div key={item.id} className={`rounded-2xl border p-3 ${darkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.name}</p>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-300">{item.stock} left</span>
                </div>
                <p className={`mt-1 text-xs ${muted}`}>
                  {item.warehouse} · reorder at {item.reorderLevel}
                </p>
              </div>
            ))}
            <Link href="/dashboard/inventory" className={`mt-1 inline-flex items-center gap-1 text-sm font-medium ${darkMode ? 'text-cyan-300' : 'text-blue-700'}`}>
              Manage inventory <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>

      <div className={`grid gap-4 ${isLive ? '' : 'lg:grid-cols-[1fr_1.2fr]'}`}>
        {!isLive && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.45 }} className={panel}>
            <h2 className={`text-lg font-semibold ${heading}`}>Recent activity (sample)</h2>
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
        )}

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
            {assistantInsights.length === 0 && (
              <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
                Insights will appear here once the AI service is connected. You can still ask the assistant questions from the AI page.
              </p>
            )}
            {assistantInsights.map((insight) => (
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
