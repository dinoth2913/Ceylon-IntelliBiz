'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Plus, Radio, Search, UserPlus, X } from 'lucide-react';
import { useDashboardTheme } from '@/components/dashboard/dashboard-shell';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { apiFetch } from '@/lib/auth';
import { customers as seedCustomers, formatLkr, type CustomerRecord } from '@/lib/dashboard-data';

const segments = ['All', 'Enterprise', 'SME', 'Retail'] as const;

type BackendCustomer = {
  id: number;
  fullName: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string | null;
};

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

function mapCustomer(record: BackendCustomer): CustomerRecord {
  return {
    id: `CUS-${record.id}`,
    name: record.fullName,
    company: record.companyName ?? '—',
    email: record.email ?? '—',
    phone: record.phone ?? '—',
    // The customers table only tracks contact details today — segment, status,
    // and lifetime value aren't in the schema yet, so live records get sensible
    // defaults until the CRM data model grows to cover them.
    segment: 'SME',
    status: 'Active',
    lifetimeValue: 0,
    lastContact: relativeTime(record.createdAt)
  };
}

export default function CustomersPage() {
  const { darkMode } = useDashboardTheme();
  const [customers, setCustomers] = useState<CustomerRecord[]>(seedCustomers);
  const [dataSource, setDataSource] = useState<'sample' | 'live'>('sample');
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState<(typeof segments)[number]>('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '' });

  const cardClass = darkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/80 shadow-sm';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiFetch('/api/customers');
        if (!response.ok) return;
        const data: BackendCustomer[] = await response.json();
        if (!cancelled && Array.isArray(data)) {
          setCustomers(data.length > 0 ? data.map(mapCustomer) : seedCustomers);
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

  const handleAddCustomer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.company || !form.email) return;

    try {
      const response = await apiFetch('/api/customers', {
        method: 'POST',
        body: JSON.stringify({ fullName: form.name, companyName: form.company, email: form.email, phone: form.phone || null })
      });
      if (!response.ok) throw new Error('Request failed');
      const saved: BackendCustomer = await response.json();
      setCustomers((current) => [mapCustomer(saved), ...current]);
      setDataSource('live');
    } catch {
      // No backend available yet — add it locally so the workspace still feels responsive.
      setCustomers((current) => [
        {
          id: `CUS-${1043 + current.length}`,
          name: form.name,
          company: form.company,
          email: form.email,
          phone: form.phone || '—',
          segment: 'SME',
          status: 'Prospect',
          lifetimeValue: 0,
          lastContact: 'Just now'
        },
        ...current
      ]);
    }

    setForm({ name: '', company: '', email: '', phone: '' });
    setShowForm(false);
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
        <button
          onClick={() => setShowForm((value) => !value)}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${darkMode ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Close' : 'Add customer'}
        </button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleAddCustomer}
          className={`grid gap-3 rounded-[24px] border p-5 sm:grid-cols-2 lg:grid-cols-4 ${cardClass}`}
        >
          <label className={`flex flex-col gap-1.5 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Full name
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Asha Perera" className={`rounded-xl border px-3 py-2 text-sm outline-none ${darkMode ? 'border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900'}`} />
          </label>
          <label className={`flex flex-col gap-1.5 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Company
            <input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" className={`rounded-xl border px-3 py-2 text-sm outline-none ${darkMode ? 'border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900'}`} />
          </label>
          <label className={`flex flex-col gap-1.5 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Email
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.lk" className={`rounded-xl border px-3 py-2 text-sm outline-none ${darkMode ? 'border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900'}`} />
          </label>
          <label className={`flex flex-col gap-1.5 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Phone
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+94 7X XXX XXXX" className={`rounded-xl border px-3 py-2 text-sm outline-none ${darkMode ? 'border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900'}`} />
          </label>
          <div className="sm:col-span-2 lg:col-span-4">
            <button type="submit" className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium ${darkMode ? 'bg-cyan-400 text-slate-950' : 'bg-slate-950 text-white'}`}>
              <UserPlus className="h-4 w-4" /> Save customer
            </button>
          </div>
        </motion.form>
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
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className={darkMode ? 'border-b border-white/10 text-slate-400' : 'border-b border-slate-100 text-slate-500'}>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Segment</th>
                <th className="px-5 py-3 font-medium">Lifetime value</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last contact</th>
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
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className={`px-5 py-8 text-center text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    No customers match your filters.
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
