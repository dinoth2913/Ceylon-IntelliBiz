'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CircleDollarSign, FileWarning, Plus, Radio, ReceiptText, Wallet, X } from 'lucide-react';
import { useDashboardTheme, useDashboardUser } from '@/components/dashboard/dashboard-shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { apiFetch } from '@/lib/auth';
import { canWrite } from '@/lib/roles';
import { invoices as seedInvoices, formatLkr, type InvoiceRecord } from '@/lib/dashboard-data';

const invoiceStatuses = ['Draft', 'Outstanding', 'Paid', 'Overdue'] as const;

type BackendInvoice = {
  id: string;
  invoiceNumber: string;
  customerId: string | null;
  totalAmount: number;
  status: string;
  dueDate: string | null;
  createdAt: string | null;
};

type BackendCustomer = { id: string; fullName: string };

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function mapInvoice(record: BackendInvoice, customerNames: Map<string, string>): InvoiceRecord {
  return {
    id: record.invoiceNumber,
    customer: customerNames.get(record.customerId ?? '') ?? 'Unknown customer',
    amount: record.totalAmount,
    status: (record.status as InvoiceRecord['status']) ?? 'Draft',
    issued: formatDate(record.createdAt),
    due: formatDate(record.dueDate)
  };
}

function suggestInvoiceNumber() {
  return `INV-${Date.now().toString().slice(-6)}`;
}

const emptyForm = { invoiceNumber: suggestInvoiceNumber(), customerId: '', totalAmount: '', status: 'Draft' as string, dueDate: '' };

export default function FinancePage() {
  const { darkMode } = useDashboardTheme();
  const { user } = useDashboardUser();
  const canAdd = canWrite('invoices', user?.role);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(seedInvoices);
  const [dataSource, setDataSource] = useState<'sample' | 'live'>('sample');
  const cardClass = darkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/80 shadow-sm';
  const inputClass = `rounded-xl border px-3 py-2 text-sm outline-none ${darkMode ? 'border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900'}`;
  const labelClass = `flex flex-col gap-1.5 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`;

  const [customers, setCustomers] = useState<BackendCustomer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [invoicesResponse, customersResponse] = await Promise.all([
          apiFetch('/api/invoices'),
          apiFetch('/api/customers')
        ]);
        if (!invoicesResponse.ok) return;
        const invoicesData: BackendInvoice[] = await invoicesResponse.json();
        const customersData: BackendCustomer[] = customersResponse.ok ? await customersResponse.json() : [];
        if (!cancelled) setCustomers(customersData);
        const customerNames = new Map(customersData.map((customer) => [customer.id, customer.fullName]));
        if (!cancelled && Array.isArray(invoicesData)) {
          setInvoices(invoicesData.map((invoice) => mapInvoice(invoice, customerNames)));
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

  const paid = invoices.filter((i) => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0);
  const outstanding = invoices.filter((i) => i.status === 'Outstanding').reduce((sum, i) => sum + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === 'Overdue').reduce((sum, i) => sum + i.amount, 0);

  const handleAddInvoice = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const totalAmount = Number(form.totalAmount);
    if (!form.invoiceNumber.trim() || !Number.isFinite(totalAmount) || totalAmount < 0) {
      setFormError('Enter an invoice number and a valid total amount.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const response = await apiFetch('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          invoiceNumber: form.invoiceNumber.trim(),
          customerId: form.customerId || null,
          totalAmount,
          status: form.status,
          dueDate: form.dueDate ? `${form.dueDate}T00:00:00Z` : null
        })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setFormError(body?.message ?? 'Could not save this invoice.');
        return;
      }
      const saved: BackendInvoice = await response.json();
      const customerNames = new Map(customers.map((customer) => [customer.id, customer.fullName]));
      setInvoices((current) => [mapInvoice(saved, customerNames), ...(dataSource === 'live' ? current : [])]);
      setDataSource('live');
      setForm({ ...emptyForm, invoiceNumber: suggestInvoiceNumber(), dueDate: '' });
      setShowForm(false);
    } catch {
      setFormError('The server could not be reached. Nothing was saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Finance</p>
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
          <h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${darkMode ? 'text-white' : 'text-slate-950'}`}>Invoices &amp; billing</h1>
        </div>
        {canAdd && (
          <button
            onClick={() => setShowForm((value) => !value)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${darkMode ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Close' : 'Add invoice'}
          </button>
        )}
      </div>

      {canAdd && showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleAddInvoice}
          className={`grid gap-3 rounded-[24px] border p-5 sm:grid-cols-2 lg:grid-cols-4 ${cardClass}`}
        >
          <label className={labelClass}>
            Invoice number
            <input required value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} placeholder="INV-100234" className={inputClass} />
          </label>
          <label className={labelClass}>
            Customer
            <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className={inputClass}>
              <option value="">No customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.fullName}</option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Total amount (LKR)
            <input required type="number" min="0" step="0.01" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} placeholder="85000" className={inputClass} />
          </label>
          <label className={labelClass}>
            Status
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
              {invoiceStatuses.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Due date (optional)
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={inputClass} />
          </label>
          {formError && <p className="sm:col-span-2 lg:col-span-4 text-sm text-rose-600 dark:text-rose-400">{formError}</p>}
          <div className="sm:col-span-2 lg:col-span-4">
            <button type="submit" disabled={saving} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium disabled:opacity-60 ${darkMode ? 'bg-cyan-400 text-slate-950' : 'bg-slate-950 text-white'}`}>
              <ReceiptText className="h-4 w-4" /> {saving ? 'Saving…' : 'Save invoice'}
            </button>
          </div>
        </motion.form>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Collected" value={formatLkr(paid)} icon={CircleDollarSign} accent="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300" index={0} />
        <StatCard label="Outstanding" value={formatLkr(outstanding)} icon={Wallet} accent="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300" index={1} />
        <StatCard label="Overdue" value={formatLkr(overdue)} icon={FileWarning} accent="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300" index={2} />
        <StatCard label="Invoices issued" value={String(invoices.length)} icon={ReceiptText} accent="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300" index={3} />
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
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className={`px-5 py-8 text-center text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    No invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`rounded-[24px] border p-5 text-sm ${cardClass} ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
        Payment gateways (PayHere, Stripe and Genie) are not connected yet, so payments can&apos;t be collected through the
        platform.
      </div>
    </div>
  );
}
