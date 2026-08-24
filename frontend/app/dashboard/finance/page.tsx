'use client';

import { CircleDollarSign, FileWarning, ReceiptText, Wallet } from 'lucide-react';
import { useDashboardTheme } from '@/components/dashboard/dashboard-shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { formatLkr, invoices } from '@/lib/dashboard-data';

export default function FinancePage() {
  const { darkMode } = useDashboardTheme();
  const cardClass = darkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/80 shadow-sm';

  const paid = invoices.filter((i) => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0);
  const outstanding = invoices.filter((i) => i.status === 'Outstanding').reduce((sum, i) => sum + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === 'Overdue').reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Finance</p>
        <h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${darkMode ? 'text-white' : 'text-slate-950'}`}>Invoices &amp; billing</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Collected this month" value={formatLkr(paid)} trend="+11.4%" icon={CircleDollarSign} accent="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300" index={0} />
        <StatCard label="Outstanding" value={formatLkr(outstanding)} trend="-4.6%" trendDirection="down" icon={Wallet} accent="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300" index={1} />
        <StatCard label="Overdue" value={formatLkr(overdue)} trend="+2.1%" icon={FileWarning} accent="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300" index={2} />
        <StatCard label="Invoices issued" value={String(invoices.length)} trend="+3" icon={ReceiptText} accent="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300" index={3} />
      </div>

      <div className={`overflow-hidden rounded-[24px] border ${cardClass}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className={darkMode ? 'border-b border-white/10 text-slate-400' : 'border-b border-slate-100 text-slate-500'}>
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Issued</th>
                <th className="px-5 py-3 font-medium">Due</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className={darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}>
                  <td className={`px-5 py-3.5 font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{invoice.id}</td>
                  <td className={`px-5 py-3.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{invoice.customer}</td>
                  <td className={`px-5 py-3.5 font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatLkr(invoice.amount)}</td>
                  <td className={`px-5 py-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{invoice.issued}</td>
                  <td className={`px-5 py-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{invoice.due}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={invoice.status} darkMode={darkMode} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`rounded-[24px] border p-5 text-sm ${cardClass} ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
        Connected gateways: PayHere, Stripe, and Genie are referenced in the platform architecture but not yet wired to this
        screen — invoices shown here are illustrative until the Finance Service API is implemented.
      </div>
    </div>
  );
}
