'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Search, Tag, Users, X } from 'lucide-react';
import { apiFetch } from '@/lib/auth';
import { hasBusinessAccess } from '@/lib/roles';
import { shortId } from '@/lib/utils';

type SearchResult = {
  id: string;
  label: string;
  detail: string;
  href: string;
  group: 'Customers' | 'Vendors' | 'Marketplace';
  icon: typeof Users;
};

type RawLists = {
  customers: SearchResult[];
  vendors: SearchResult[];
  products: SearchResult[];
};

const EMPTY_LISTS: RawLists = { customers: [], vendors: [], products: [] };

export function GlobalSearch({ darkMode, role }: { darkMode: boolean; role: string | null | undefined }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lists, setLists] = useState<RawLists>(EMPTY_LISTS);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadLists = async () => {
    if (loaded || loading) return;
    setLoading(true);
    try {
      const canSeeBusinessData = hasBusinessAccess(role);
      const [customersRes, vendorsRes, productsRes] = await Promise.all([
        canSeeBusinessData ? apiFetch('/api/customers').catch(() => null) : Promise.resolve(null),
        canSeeBusinessData ? apiFetch('/api/vendors').catch(() => null) : Promise.resolve(null),
        apiFetch('/api/products').catch(() => null)
      ]);

      const customers: SearchResult[] = customersRes?.ok
        ? (await customersRes.json()).map((c: { id: string; fullName: string; companyName: string | null }) => ({
            id: c.id,
            label: c.fullName,
            detail: c.companyName ?? 'Customer',
            href: '/dashboard/customers',
            group: 'Customers' as const,
            icon: Users
          }))
        : [];

      const vendors: SearchResult[] = vendorsRes?.ok
        ? (await vendorsRes.json()).map((v: { id: string; companyName: string; contactName: string | null }) => ({
            id: v.id,
            label: v.companyName,
            detail: v.contactName ?? 'Vendor',
            href: '/dashboard/vendors',
            group: 'Vendors' as const,
            icon: Building2
          }))
        : [];

      const products: SearchResult[] = productsRes?.ok
        ? (await productsRes.json()).map((p: { id: string; title: string; category: string }) => ({
            id: p.id,
            label: p.title,
            detail: p.category,
            href: '/dashboard/marketplace',
            group: 'Marketplace' as const,
            icon: Tag
          }))
        : [];

      setLists({ customers, vendors, products });
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const needle = query.trim().toLowerCase();
  const allResults = [...lists.customers, ...lists.vendors, ...lists.products];
  const results =
    needle === ''
      ? []
      : allResults.filter((item) => item.label.toLowerCase().includes(needle) || item.detail.toLowerCase().includes(needle)).slice(0, 8);

  const go = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className={`flex items-center gap-2 rounded-full border px-4 py-2 ${darkMode ? 'border-white/10 bg-slate-950/60 text-slate-300' : 'border-slate-200 bg-white text-slate-500'}`}>
        <Search className="h-4 w-4 shrink-0" />
        <input
          type="text"
          value={query}
          onFocus={() => {
            setOpen(true);
            void loadLists();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder="Search customers, vendors, marketplace…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
        {query && (
          <button onClick={() => setQuery('')} aria-label="Clear search" className="shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && needle !== '' && (
        <div
          className={`absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-2xl border shadow-xl ${
            darkMode ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white'
          }`}
        >
          {loading && <p className={`px-4 py-3 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading…</p>}
          {!loading && results.length === 0 && (
            <p className={`px-4 py-3 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>No matches for &ldquo;{query}&rdquo;.</p>
          )}
          {!loading &&
            results.map((result) => {
              const Icon = result.icon;
              return (
                <button
                  key={`${result.group}-${result.id}`}
                  onClick={() => go(result.href)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
                    darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${darkMode ? 'bg-cyan-400/10 text-cyan-300' : 'bg-slate-100 text-slate-600'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{result.label}</span>
                    <span className={`block truncate text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      {result.group} · {result.detail} · {shortId(result.id)}
                    </span>
                  </span>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
