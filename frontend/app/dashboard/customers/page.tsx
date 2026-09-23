'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Pencil, Phone, Plus, Radio, Search, UserPlus, X } from 'lucide-react';
import { useDashboardTheme, useDashboardUser } from '@/components/dashboard/dashboard-shell';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { ConfirmDeleteButton } from '@/components/dashboard/confirm-delete-button';
import { apiFetch } from '@/lib/auth';
import { shortId } from '@/lib/utils';
import { canWrite } from '@/lib/roles';
import { customers as seedCustomers, formatLkr, type CustomerRecord } from '@/lib/dashboard-data';

const segments = ['All', 'Enterprise', 'SME', 'Retail'] as const;

type BackendCustomer = {
  id: string;
  fullName: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  segment: string;
  createdAt: string | null;
};

type DisplayCustomer = CustomerRecord & { backendId: string | null };

function relativeTime(iso: string | null) {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function mapCustomer(record: BackendCustomer): DisplayCustomer {
  return {
    id: `CUS-${shortId(record.id)}`,
    backendId: record.id,
    name: record.fullName,
    company: record.companyName ?? '—',
    email: record.email ?? '—',
    phone: record.phone ?? '—',
    segment: (record.segment as CustomerRecord['segment']) ?? 'SME',
    // Status and lifetime value aren't in the schema yet, so live records get sensible
    // defaults until the CRM data model grows to cover them.
    status: 'Active',
    lifetimeValue: 0,
    lastContact: relativeTime(record.createdAt)
  };
}

const emptyForm = { name: '', company: '', email: '', phone: '', segment: 'SME' };

export default function CustomersPage() {
  const { darkMode } = useDashboardTheme();
  const { user } = useDashboardUser();
  const canAdd = canWrite('customers', user?.role);
  const [customers, setCustomers] = useState<DisplayCustomer[]>(seedCustomers.map((c) => ({ ...c, backendId: null })));
  const [dataSource, setDataSource] = useState<'sample' | 'live'>('sample');
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState<(typeof segments)[number]>('All');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const cardClass = darkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/80 shadow-sm';
  const inputClass = `rounded-xl border px-3 py-2 text-sm outline-none ${darkMode ? 'border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900'}`;
  const labelClass = `flex flex-col gap-1.5 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiFetch('/api/customers');
        if (!response.ok) return;
        const data: BackendCustomer[] = await response.json();
        if (!cancelled && Array.isArray(data)) {
          setCustomers(data.map(mapCustomer));
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
    return customers.filter((customer) => {
      const matchesSegment = segment === 'All' || customer.segment === segment;
      const matchesQuery =
        query.trim() === '' ||
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.company.toLowerCase().includes(query.toLowerCase());
      return matchesSegment && matchesQuery;
    });
  }, [customers, query, segment]);

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const startEdit = (customer: DisplayCustomer) => {
    if (!customer.backendId) return;
    setEditingId(customer.backendId);
    setForm({
      name: customer.name,
      company: customer.company === '—' ? '' : customer.company,
      email: customer.email === '—' ? '' : customer.email,
      phone: customer.phone === '—' ? '' : customer.phone,
      segment: customer.segment
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.company || !form.email || saving) return;
    setSaving(true);
    setFormError(null);

    const body = {
      fullName: form.name,
      companyName: form.company,
      email: form.email,
      phone: form.phone || null,
      segment: form.segment
    };

    try {
      const response = await apiFetch(editingId ? `/api/customers/${editingId}` : '/api/customers', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        setFormError(errBody?.message ?? 'Could not save this customer.');
        return;
      }
      const saved: BackendCustomer = await response.json();
      const mapped = mapCustomer(saved);
      setCustomers((current) =>
        editingId
          ? current.map((c) => (c.backendId === editingId ? mapped : c))
          : [mapped, ...(dataSource === 'live' ? current : [])]
      );
      setDataSource('live');
      closeForm();
    } catch {
      setFormError('The server could not be reached. Nothing was saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer: DisplayCustomer) => {
    if (!customer.backendId) return;
    setDeletingId(customer.backendId);
    setListError(null);
    try {
      const response = await apiFetch(`/api/customers/${customer.backendId}`, { method: 'DELETE' });
      if (response.status === 409) {
        const body = await response.json().catch(() => null);
        setListError(body?.message ?? 'This customer cannot be deleted.');
        return;
      }
      if (!response.ok) throw new Error('Request failed');
      setCustomers((current) => current.filter((c) => c.backendId !== customer.backendId));
    } catch {
      setListError('Could not delete this customer. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>CRM</p>
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
          <h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${darkMode ? 'text-white' : 'text-slate-950'}`}>Customers</h1>
        </div>
        {canAdd && (
          <button
            onClick={() => (showForm ? closeForm() : setShowForm(true))}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${darkMode ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Close' : 'Add customer'}
          </button>
        )}
      </div>

      {canAdd && showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSubmit}
          className={`grid gap-3 rounded-[24px] border p-5 sm:grid-cols-2 lg:grid-cols-5 ${cardClass}`}
        >
          <label className={labelClass}>
            Full name
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Asha Perera" className={inputClass} />
          </label>
          <label className={labelClass}>
            Company
            <input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" className={inputClass} />
          </label>
          <label className={labelClass}>
            Email
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.lk" className={inputClass} />
          </label>
          <label className={labelClass}>
            Phone
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+94 7X XXX XXXX" className={inputClass} />
          </label>
          <label className={labelClass}>
            Segment
            <select value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })} className={inputClass}>
              {segments.filter((item) => item !== 'All').map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          {formError && <p className="sm:col-span-2 lg:col-span-5 text-sm text-rose-600 dark:text-rose-400">{formError}</p>}
          <div className="sm:col-span-2 lg:col-span-5">
            <button type="submit" disabled={saving} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium disabled:opacity-60 ${darkMode ? 'bg-cyan-400 text-slate-950' : 'bg-slate-950 text-white'}`}>
              <UserPlus className="h-4 w-4" /> {saving ? 'Saving…' : editingId ? 'Save changes' : 'Save customer'}
            </button>
          </div>
        </motion.form>
      )}

      {listError && (
        <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
          {listError}
        </p>
      )}

      <div className={`flex flex-wrap items-center gap-3 rounded-[24px] border p-4 ${cardClass}`}>
        <div className={`flex flex-1 min-w-[200px] items-center gap-2 rounded-full border px-4 py-2 ${darkMode ? 'border-white/10 bg-slate-950/60 text-slate-300' : 'border-slate-200 bg-white text-slate-500'}`}>
          <Search className="h-4 w-4" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or company" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
        </div>
        <div className="flex flex-wrap gap-2">
          {segments.map((item) => (
            <button
              key={item}
              onClick={() => setSegment(item)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                segment === item
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
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className={darkMode ? 'border-b border-white/10 text-slate-400' : 'border-b border-slate-100 text-slate-500'}>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Segment</th>
                <th className="px-5 py-3 font-medium">Lifetime value</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last contact</th>
                {canAdd && <th className="px-5 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
              {filtered.map((customer) => (
                <tr key={customer.id} className={darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}>
                  <td className="px-5 py-3.5">
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{customer.name}</p>
                    <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{customer.company}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className={`flex items-center gap-1.5 text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}><Mail className="h-3.5 w-3.5" /> {customer.email}</p>
                    <p className={`mt-1 flex items-center gap-1.5 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}><Phone className="h-3.5 w-3.5" /> {customer.phone}</p>
                  </td>
                  <td className={`px-5 py-3.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{customer.segment}</td>
                  <td className={`px-5 py-3.5 font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{customer.lifetimeValue ? formatLkr(customer.lifetimeValue) : '—'}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={customer.status} darkMode={darkMode} /></td>
                  <td className={`px-5 py-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{customer.lastContact}</td>
                  {canAdd && (
                    <td className="px-5 py-3.5">
                      {customer.backendId && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(customer)}
                            aria-label={`Edit ${customer.name}`}
                            className={`flex h-8 w-8 items-center justify-center rounded-full transition ${darkMode ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <ConfirmDeleteButton
                            darkMode={darkMode}
                            label={`Delete ${customer.name}`}
                            busy={deletingId === customer.backendId}
                            onConfirm={() => handleDelete(customer)}
                          />
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={canAdd ? 7 : 6} className={`px-5 py-8 text-center text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {customers.length === 0 ? 'No customers yet. Use "Add customer" to create your first one.' : 'No customers match your filters.'}
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
