'use client';

import { useEffect, useMemo, useState } from 'react';
import { Radio, Search } from 'lucide-react';
import { useDashboardTheme } from '@/components/dashboard/dashboard-shell';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { apiFetch } from '@/lib/auth';
import { orders as seedOrders, formatLkr, type OrderRecord } from '@/lib/dashboard-data';

const statuses = ['All', 'Processing', 'Fulfilled', 'Pending payment', 'Cancelled'] as const;

type BackendOrder = {
  id: string;
  orderNumber: string;
  customerId: string | null;
  totalAmount: number;
  status: string;
  createdAt: string | null;
};

type BackendCustomer = { id: string; fullName: string };

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function mapOrder(record: BackendOrder, customerNames: Map<string, string>): OrderRecord {
  return {
    id: record.orderNumber,
    customer: customerNames.get(record.customerId ?? '') ?? 'Unknown customer',
    // The orders table doesn't track item count or sales channel yet, so live
    // records get sensible defaults until the schema grows to cover them.
    items: 1,
    total: record.totalAmount,
    status: (record.status as OrderRecord['status']) ?? 'Processing',
    channel: 'Direct sales',
    date: formatDate(record.createdAt)
  };
}

export default function OrdersPage() {
  const { darkMode } = useDashboardTheme();
  const [orders, setOrders] = useState<OrderRecord[]>(seedOrders);
  const [dataSource, setDataSource] = useState<'sample' | 'live'>('sample');
  const [status, setStatus] = useState<(typeof statuses)[number]>('All');
  const [query, setQuery] = useState('');
  const cardClass = darkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/80 shadow-sm';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [ordersResponse, customersResponse] = await Promise.all([
          apiFetch('/api/orders'),
          apiFetch('/api/customers')
        ]);
        if (!ordersResponse.ok) return;
        const ordersData: BackendOrder[] = await ordersResponse.json();
        const customersData: BackendCustomer[] = customersResponse.ok ? await customersResponse.json() : [];
        const customerNames = new Map(customersData.map((customer) => [customer.id, customer.fullName]));
        if (!cancelled && Array.isArray(ordersData)) {
          setOrders(ordersData.map((order) => mapOrder(order, customerNames)));
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

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = status === 'All' || order.status === status;
      const matchesQuery = query.trim() === '' || order.customer.toLowerCase().includes(query.toLowerCase()) || order.id.toLowerCase().includes(query.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [orders, status, query]);

  const totals = {
    processing: orders.filter((o) => o.status === 'Processing').length,
    fulfilled: orders.filter((o) => o.status === 'Fulfilled').length,
    value: orders.reduce((sum, o) => sum + o.total, 0)
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sales</p>
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
        <h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${darkMode ? 'text-white' : 'text-slate-950'}`}>Orders</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`rounded-[20px] border p-4 ${cardClass}`}>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>In progress</p>
          <p className={`mt-1 text-2xl font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>{totals.processing}</p>
        </div>
        <div className={`rounded-[20px] border p-4 ${cardClass}`}>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Fulfilled</p>
          <p className={`mt-1 text-2xl font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>{totals.fulfilled}</p>
        </div>
        <div className={`rounded-[20px] border p-4 ${cardClass}`}>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Order value</p>
          <p className={`mt-1 text-2xl font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>{formatLkr(totals.value)}</p>
        </div>
      </div>

      <div className={`flex flex-wrap items-center gap-3 rounded-[24px] border p-4 ${cardClass}`}>
        <div className={`flex flex-1 min-w-[200px] items-center gap-2 rounded-full border px-4 py-2 ${darkMode ? 'border-white/10 bg-slate-950/60 text-slate-300' : 'border-slate-200 bg-white text-slate-500'}`}>
          <Search className="h-4 w-4" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by order ID or customer" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
        </div>
        <div className="flex flex-wrap gap-2">
          {statuses.map((item) => (
            <button
              key={item}
              onClick={() => setStatus(item)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                status === item
                  ? darkMode
                    ? 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/30'
                    : 'bg-slate-950 text-white'
                  : darkMode
                    ? 'border border-white/10 text-slate-300 hover:bg-white/5'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className={`overflow-hidden rounded-[24px] border ${cardClass}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className={darkMode ? 'border-b border-white/10 text-slate-400' : 'border-b border-slate-100 text-slate-500'}>
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Channel</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
              {filtered.map((order) => (
                <tr key={order.id} className={darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}>
                  <td className={`px-5 py-3.5 font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{order.id}</td>
                  <td className={`px-5 py-3.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{order.customer}</td>
                  <td className={`px-5 py-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{order.channel}</td>
                  <td className={`px-5 py-3.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{order.items}</td>
                  <td className={`px-5 py-3.5 font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatLkr(order.total)}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={order.status} darkMode={darkMode} /></td>
                  <td className={`px-5 py-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{order.date}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className={`px-5 py-8 text-center text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {orders.length === 0 ? 'No orders yet.' : 'No orders match your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
