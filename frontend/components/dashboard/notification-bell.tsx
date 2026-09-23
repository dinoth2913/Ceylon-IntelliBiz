'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Bell, FileWarning, Inbox, ShoppingCart } from 'lucide-react';
import { apiFetch } from '@/lib/auth';

type NotificationItem = {
  id: string;
  label: string;
  detail: string;
  href: string;
  icon: typeof Bell;
};

/**
 * Not a stored notifications feed — there isn't one. These are computed live from data the signed-in
 * role can already see (new demo requests, low stock, overdue invoices, new marketplace requests), the
 * same way the dashboard overview's stats are. Each source is best-effort: a 403 for a role that can't
 * see it, or a network error, just means that category is skipped.
 */
export function NotificationBell({ darkMode, hasBusinessAccess }: { darkMode: boolean; hasBusinessAccess: boolean }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const load = useCallback(async () => {
    if (!hasBusinessAccess) return;
    setLoading(true);
    const found: NotificationItem[] = [];

    const [leadsRes, inventoryRes, invoicesRes, marketplaceRes] = await Promise.all([
      apiFetch('/api/contact-requests').catch(() => null),
      apiFetch('/api/inventory').catch(() => null),
      apiFetch('/api/invoices').catch(() => null),
      apiFetch('/api/marketplace-orders').catch(() => null)
    ]);

    if (leadsRes?.ok) {
      const leads: { status: string }[] = await leadsRes.json();
      const newCount = leads.filter((l) => l.status === 'New').length;
      if (newCount > 0) {
        found.push({
          id: 'leads',
          label: `${newCount} new demo ${newCount === 1 ? 'request' : 'requests'}`,
          detail: 'Someone asked for a demo on the website',
          href: '/dashboard/leads',
          icon: Inbox
        });
      }
    }

    if (inventoryRes?.ok) {
      const items_: { stockQuantity: number | null; reorderLevel: number | null }[] = await inventoryRes.json();
      const lowStock = items_.filter((i) => (i.stockQuantity ?? 0) <= (i.reorderLevel ?? 10)).length;
      if (lowStock > 0) {
        found.push({
          id: 'inventory',
          label: `${lowStock} ${lowStock === 1 ? 'item' : 'items'} below reorder level`,
          detail: 'Stock needs replenishing',
          href: '/dashboard/inventory',
          icon: AlertTriangle
        });
      }
    }

    if (invoicesRes?.ok) {
      const invoices: { status: string }[] = await invoicesRes.json();
      const overdue = invoices.filter((i) => i.status === 'Overdue').length;
      if (overdue > 0) {
        found.push({
          id: 'invoices',
          label: `${overdue} overdue ${overdue === 1 ? 'invoice' : 'invoices'}`,
          detail: 'Follow up on collection',
          href: '/dashboard/finance',
          icon: FileWarning
        });
      }
    }

    if (marketplaceRes?.ok) {
      const orders: { status: string }[] = await marketplaceRes.json();
      const requested = orders.filter((o) => o.status === 'Requested').length;
      if (requested > 0) {
        found.push({
          id: 'marketplace',
          label: `${requested} new purchase ${requested === 1 ? 'request' : 'requests'}`,
          detail: 'Someone checked out on the marketplace',
          href: '/dashboard/marketplace',
          icon: ShoppingCart
        });
      }
    }

    setItems(found);
    setLoading(false);
    setLoadedOnce(true);
  }, [hasBusinessAccess]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const total = items.length;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void load();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={toggle}
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border ${darkMode ? 'border-white/10 bg-white/10 text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {total > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-400 px-1 text-[10px] font-semibold text-slate-950">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-2xl border shadow-xl ${
            darkMode ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white'
          }`}
        >
          <p className={`border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide ${darkMode ? 'border-white/10 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
            Notifications
          </p>
          {!hasBusinessAccess && (
            <p className={`px-4 py-4 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Nothing to show yet — you don&apos;t have business data access.</p>
          )}
          {hasBusinessAccess && loading && !loadedOnce && (
            <p className={`px-4 py-4 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading…</p>
          )}
          {hasBusinessAccess && loadedOnce && items.length === 0 && (
            <p className={`px-4 py-4 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>You&apos;re all caught up.</p>
          )}
          {hasBusinessAccess &&
            items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setOpen(false);
                    router.push(item.href);
                  }}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                >
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${darkMode ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-50 text-amber-600'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className={`block font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.label}</span>
                    <span className={`block text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{item.detail}</span>
                  </span>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
