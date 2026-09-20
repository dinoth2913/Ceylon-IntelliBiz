'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Mail, Phone, Plus, Radio, Search, UserRound, X } from 'lucide-react';
import { useDashboardTheme, useDashboardUser } from '@/components/dashboard/dashboard-shell';
import { apiFetch } from '@/lib/auth';
import { canWrite } from '@/lib/roles';
import { vendors as seedVendors, type VendorRecord } from '@/lib/dashboard-data';

type BackendVendor = {
  id: number;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string | null;
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function mapVendor(record: BackendVendor): VendorRecord {
  return {
    id: `VEN-${record.id}`,
    company: record.companyName,
    contact: record.contactName ?? '—',
    email: record.email ?? '—',
    phone: record.phone ?? '—',
    added: formatDate(record.createdAt)
  };
}

const emptyForm = { company: '', contact: '', email: '', phone: '' };

export default function VendorsPage() {
  const { darkMode } = useDashboardTheme();
  const { user } = useDashboardUser();
  const canAdd = canWrite('vendors', user?.role);
  const [vendors, setVendors] = useState<VendorRecord[]>(seedVendors);
  const [dataSource, setDataSource] = useState<'sample' | 'live'>('sample');
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardClass = darkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/80 shadow-sm';
  const inputClass = `rounded-xl border px-3 py-2 text-sm outline-none ${darkMode ? 'border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900'}`;
  const labelClass = `flex flex-col gap-1.5 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`;
  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiFetch('/api/vendors');
        if (!response.ok) return;
        const data: BackendVendor[] = await response.json();
        if (!cancelled && Array.isArray(data)) {
          setVendors(data.map(mapVendor));
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
    const needle = query.trim().toLowerCase();
    if (!needle) return vendors;
    return vendors.filter((vendor) => vendor.company.toLowerCase().includes(needle) || vendor.contact.toLowerCase().includes(needle));
  }, [vendors, query]);

  const handleAddVendor = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.company.trim() || saving) return;
    setSaving(true);
    setError(null);

    try {
      const response = await apiFetch('/api/vendors', {
        method: 'POST',
        body: JSON.stringify({
          companyName: form.company.trim(),
          contactName: form.contact.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null
        })
      });
      if (!response.ok) throw new Error('Request failed');
      const saved: BackendVendor = await response.json();
      setVendors((current) => [mapVendor(saved), ...(dataSource === 'live' ? current : [])]);
      setDataSource('live');
    } catch {
      // Backend unavailable: keep the vendor locally so the page stays usable, but say so.
      setVendors((current) => [
        {
          id: `VEN-${300 + current.length + 1}`,
          company: form.company.trim(),
          contact: form.contact.trim() || '—',
          email: form.email.trim() || '—',
          phone: form.phone.trim() || '—',
          added: 'Just now'
        },
        ...current
      ]);
      setError('The server could not be reached, so this vendor was only added on this page and was not saved.');
    } finally {
      setSaving(false);
    }

    setForm(emptyForm);
    setShowForm(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className={`text-sm ${muted}`}>Marketplace</p>
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
          <h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${darkMode ? 'text-white' : 'text-slate-950'}`}>Vendors</h1>
        </div>
        {canAdd && <button
          onClick={() => setShowForm((value) => !value)}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${darkMode ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Close' : 'Add vendor'}
        </button>}
      </div>

      {error && (
        <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
          {error}
        </p>
      )}

      {canAdd && showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleAddVendor}
          className={`grid gap-3 rounded-[24px] border p-5 sm:grid-cols-2 lg:grid-cols-4 ${cardClass}`}
        >
          <label className={labelClass}>
            Company
            <input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" className={inputClass} />
          </label>
          <label className={labelClass}>
            Contact person
            <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Asha Perera" className={inputClass} />
          </label>
          <label className={labelClass}>
            Email
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.lk" className={inputClass} />
          </label>
          <label className={labelClass}>
            Phone
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+94 7X XXX XXXX" className={inputClass} />
          </label>
          <div className="sm:col-span-2 lg:col-span-4">
            <button type="submit" disabled={saving} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium disabled:opacity-60 ${darkMode ? 'bg-cyan-400 text-slate-950' : 'bg-slate-950 text-white'}`}>
              <Building2 className="h-4 w-4" /> {saving ? 'Saving…' : 'Save vendor'}
            </button>
          </div>
        </motion.form>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className={`rounded-[20px] border p-4 ${cardClass}`}>
          <p className={`text-sm ${muted}`}>Vendors onboarded</p>
          <p className={`mt-1 text-2xl font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>{vendors.length}</p>
        </div>
        <div className={`rounded-[20px] border p-4 ${cardClass}`}>
          <p className={`text-sm ${muted}`}>Most recent</p>
          <p className={`mt-1 truncate text-2xl font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>{vendors[0]?.company ?? '—'}</p>
        </div>
      </div>

      <div className={`flex items-center gap-2 rounded-full border px-4 py-2 ${darkMode ? 'border-white/10 bg-slate-900/60 text-slate-300' : 'border-slate-200 bg-white text-slate-500'}`}>
        <Search className="h-4 w-4" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by company or contact" aria-label="Search vendors" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
      </div>

      {filtered.length === 0 ? (
        <div className={`rounded-[24px] border p-8 text-center text-sm ${cardClass} ${muted}`}>{vendors.length === 0 ? 'No vendors yet. Use "Add vendor" to onboard your first one.' : 'No vendors match your search.'}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((vendor, index) => (
            <motion.article
              key={vendor.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index, 8) * 0.05, duration: 0.35 }}
              className={`rounded-[24px] border p-5 ${cardClass}`}
            >
              <div className="flex items-start gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${darkMode ? 'bg-cyan-400/10 text-cyan-300' : 'bg-slate-950 text-white'}`}>
                  <Building2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className={`text-xs font-medium uppercase tracking-wide ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{vendor.id}</p>
                  <h3 className={`truncate text-base font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{vendor.company}</h3>
                </div>
              </div>
              <dl className={`mt-4 space-y-2 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                <div className="flex items-center gap-2"><UserRound className="h-3.5 w-3.5 shrink-0" /> <dd className="truncate">{vendor.contact}</dd></div>
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" /> <dd className="truncate">{vendor.email}</dd></div>
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" /> <dd>{vendor.phone}</dd></div>
              </dl>
              <p className={`mt-4 border-t pt-3 text-xs ${darkMode ? 'border-white/10 text-slate-500' : 'border-slate-100 text-slate-400'}`}>Added {vendor.added}</p>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
