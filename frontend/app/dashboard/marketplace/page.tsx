'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CircleAlert, Inbox, Loader2, Mail, Package, Plus, RefreshCw, Star, Trash2, X } from 'lucide-react';
import { useDashboardTheme, useDashboardUser } from '@/components/dashboard/dashboard-shell';
import { apiFetch } from '@/lib/auth';
import { canWrite } from '@/lib/roles';
import { formatPrice, type BackendProduct } from '@/lib/marketplace';

type MarketplaceOrder = {
  id: string;
  productId: string;
  productTitle: string;
  unitPrice: number;
  quantity: number;
  totalAmount: number;
  buyerName: string;
  buyerEmail: string;
  buyerCompany: string | null;
  status: string;
  createdAt: string | null;
};

type LoadState = 'loading' | 'ready' | 'error';

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

const emptyForm = { title: '', description: '', price: '', category: '', features: '' };

export default function MarketplaceManagementPage() {
  const { darkMode } = useDashboardTheme();
  const { user } = useDashboardUser();
  const canManage = canWrite('products', user?.role);

  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [productsState, setProductsState] = useState<LoadState>('loading');
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [ordersState, setOrdersState] = useState<LoadState>('loading');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const cardClass = darkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/80 shadow-sm';
  const inputClass = `rounded-xl border px-3 py-2 text-sm outline-none ${darkMode ? 'border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900'}`;
  const labelClass = `flex flex-col gap-1.5 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`;
  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';
  const heading = darkMode ? 'text-white' : 'text-slate-900';

  const loadProducts = useCallback(async () => {
    setProductsState('loading');
    try {
      const response = await apiFetch('/api/products');
      if (!response.ok) throw new Error('Request failed');
      const data: BackendProduct[] = await response.json();
      setProducts(Array.isArray(data) ? data : []);
      setProductsState('ready');
    } catch {
      setProductsState('error');
    }
  }, []);

  const loadOrders = useCallback(async () => {
    if (!canManage) return;
    setOrdersState('loading');
    try {
      const response = await apiFetch('/api/marketplace-orders');
      if (!response.ok) throw new Error('Request failed');
      const data: MarketplaceOrder[] = await response.json();
      setOrders(Array.isArray(data) ? data : []);
      setOrdersState('ready');
    } catch {
      setOrdersState('error');
    }
  }, [canManage]);

  useEffect(() => {
    void loadProducts();
    void loadOrders();
  }, [loadProducts, loadOrders]);

  const totalRequested = useMemo(
    () => orders.reduce((sum, order) => sum + order.totalAmount, 0),
    [orders]
  );

  const handleAddProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const price = Number(form.price);
    if (!form.title.trim() || !form.description.trim() || !form.category.trim() || !Number.isFinite(price) || price < 0) {
      setFormError('Fill in title, description, category and a valid price.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const response = await apiFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          price,
          category: form.category.trim(),
          features: form.features
            .split(',')
            .map((f) => f.trim())
            .filter(Boolean)
        })
      });
      if (!response.ok) throw new Error('Request failed');
      const saved: BackendProduct = await response.json();
      setProducts((current) => [saved, ...current]);
      setForm(emptyForm);
      setShowForm(false);
    } catch {
      setFormError('Could not save this product. Check that the backend is reachable and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setDeleteError(null);
    try {
      const response = await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
      if (response.status === 409) {
        const body = await response.json().catch(() => null);
        setDeleteError(body?.message ?? 'This product cannot be deleted.');
        return;
      }
      if (!response.ok) throw new Error('Request failed');
      setProducts((current) => current.filter((p) => p.id !== id));
    } catch {
      setDeleteError('Could not delete this product. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className={`text-sm ${muted}`}>Marketplace</p>
          <h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${darkMode ? 'text-white' : 'text-slate-950'}`}>Catalogue & requests</h1>
          <p className={`mt-1 text-sm ${muted}`}>Manage what&apos;s listed on the public marketplace and see who has asked to buy.</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowForm((value) => !value)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${darkMode ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Close' : 'Add product'}
          </button>
        )}
      </div>

      {canManage && showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleAddProduct}
          className={`grid gap-3 rounded-[24px] border p-5 sm:grid-cols-2 ${cardClass}`}
        >
          <label className={labelClass}>
            Title
            <input required maxLength={255} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="AI Forecasting Module" className={inputClass} />
          </label>
          <label className={labelClass}>
            Category
            <input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Add-on" className={inputClass} />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Description
            <textarea required maxLength={2000} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this product do?" className={inputClass} />
          </label>
          <label className={labelClass}>
            Price (LKR)
            <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="125000" className={inputClass} />
          </label>
          <label className={labelClass}>
            Features (comma separated)
            <input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="Real-time predictions, Churn analysis" className={inputClass} />
          </label>
          {formError && <p className="sm:col-span-2 text-sm text-rose-600 dark:text-rose-400">{formError}</p>}
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium disabled:opacity-60 ${darkMode ? 'bg-cyan-400 text-slate-950' : 'bg-slate-950 text-white'}`}>
              <Package className="h-4 w-4" /> {saving ? 'Saving…' : 'Save product'}
            </button>
          </div>
        </motion.form>
      )}

      {deleteError && (
        <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
          {deleteError}
        </p>
      )}

      <section className="flex flex-col gap-4">
        <h2 className={`text-lg font-semibold ${heading}`}>Products ({products.length})</h2>

        {productsState === 'loading' && products.length === 0 && (
          <div className={`flex items-center justify-center gap-2 rounded-[24px] border p-10 text-sm ${cardClass} ${muted}`}>
            <Loader2 className="h-4 w-4 animate-spin" /> Loading products…
          </div>
        )}

        {productsState === 'error' && (
          <div role="alert" className="flex items-start gap-3 rounded-[24px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>We couldn&apos;t load the catalogue. Check that the backend is running and try again.</p>
          </div>
        )}

        {productsState === 'ready' && products.length === 0 && (
          <div className={`flex flex-col items-center gap-3 rounded-[24px] border p-12 text-center ${cardClass}`}>
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${darkMode ? 'bg-cyan-400/10 text-cyan-300' : 'bg-slate-950 text-white'}`}>
              <Package className="h-5 w-5" />
            </span>
            <p className={`text-base font-semibold ${heading}`}>No products listed yet</p>
            <p className={`max-w-sm text-sm ${muted}`}>{canManage ? 'Use "Add product" to list your first item on the marketplace.' : 'An admin or sales teammate hasn’t listed anything yet.'}</p>
          </div>
        )}

        {products.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product, index) => (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index, 8) * 0.05, duration: 0.3 }}
                className={`rounded-[24px] border p-5 ${cardClass}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`text-xs font-medium uppercase tracking-wide ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{product.category}</p>
                    <h3 className={`truncate text-base font-semibold ${heading}`}>{product.title}</h3>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={deletingId === product.id}
                      aria-label={`Delete ${product.title}`}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition disabled:opacity-50 ${darkMode ? 'text-slate-400 hover:bg-rose-400/10 hover:text-rose-300' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className={`mt-2 line-clamp-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{product.description}</p>
                <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm border-slate-100 dark:border-white/5">
                  <span className={`font-semibold ${heading}`}>{formatPrice(product.price)}</span>
                  <span className={`flex items-center gap-1 ${muted}`}>
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {product.rating.toFixed(1)} ({product.reviewCount})
                  </span>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      {canManage && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className={`text-lg font-semibold ${heading}`}>Purchase requests ({orders.length})</h2>
            <div className="flex items-center gap-3">
              {orders.length > 0 && <span className={`text-sm ${muted}`}>{formatPrice(totalRequested)} requested total</span>}
              <button
                onClick={() => void loadOrders()}
                disabled={ordersState === 'loading'}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:opacity-60 ${darkMode ? 'border-white/10 text-slate-200 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${ordersState === 'loading' ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
          </div>

          {ordersState === 'loading' && orders.length === 0 && (
            <div className={`flex items-center justify-center gap-2 rounded-[24px] border p-10 text-sm ${cardClass} ${muted}`}>
              <Loader2 className="h-4 w-4 animate-spin" /> Loading requests…
            </div>
          )}

          {ordersState === 'error' && (
            <div role="alert" className="flex items-start gap-3 rounded-[24px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p>We couldn&apos;t load purchase requests. Please try again.</p>
            </div>
          )}

          {ordersState === 'ready' && orders.length === 0 && (
            <div className={`flex flex-col items-center gap-3 rounded-[24px] border p-12 text-center ${cardClass}`}>
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${darkMode ? 'bg-cyan-400/10 text-cyan-300' : 'bg-slate-950 text-white'}`}>
                <Inbox className="h-5 w-5" />
              </span>
              <p className={`text-base font-semibold ${heading}`}>No purchase requests yet</p>
              <p className={`max-w-sm text-sm ${muted}`}>When someone checks out on the marketplace, their request shows up here — there is no payment gateway, so you follow up by email.</p>
            </div>
          )}

          {orders.length > 0 && (
            <ul className="grid gap-4">
              {orders.map((order, index) => (
                <motion.li
                  key={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.3 }}
                  className={`rounded-[24px] border p-5 ${cardClass}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className={`truncate text-base font-semibold ${heading}`}>{order.buyerName}</h3>
                      <p className={`mt-0.5 text-sm ${muted}`}>{order.buyerCompany ?? order.buyerEmail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300">{order.status}</span>
                      <span className={`text-xs ${muted}`}>{relativeTime(order.createdAt)}</span>
                    </div>
                  </div>
                  <p className={`mt-3 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {order.quantity} × {order.productTitle} ({formatPrice(order.unitPrice)} each) — <span className={`font-semibold ${heading}`}>{formatPrice(order.totalAmount)}</span>
                  </p>
                  <a
                    href={`mailto:${order.buyerEmail}?subject=${encodeURIComponent(`Your Ceylon IntelliBiz request: ${order.productTitle}`)}`}
                    className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${darkMode ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
                  >
                    <Mail className="h-4 w-4" /> Reply to {order.buyerEmail}
                  </a>
                </motion.li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
