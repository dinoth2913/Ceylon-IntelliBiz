'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CircleAlert, Inbox, Loader2, Mail, Package, Pencil, Plus, RefreshCw, Star, Tag, Ticket, Trash2, X } from 'lucide-react';
import { useDashboardTheme, useDashboardUser } from '@/components/dashboard/dashboard-shell';
import { BarList } from '@/components/dashboard/bar-list';
import { apiFetch } from '@/lib/auth';
import { canWrite } from '@/lib/roles';
import { formatDiscount, formatPrice, type BackendCategory, type BackendCoupon, type BackendProduct } from '@/lib/marketplace';

const CATEGORY_COLORS = ['bg-cyan-400', 'bg-blue-500', 'bg-violet-500', 'bg-amber-400', 'bg-emerald-400', 'bg-rose-400', 'bg-slate-400'];

type MarketplaceOrder = {
  id: string;
  productId: string;
  productTitle: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  couponCode: string | null;
  discountAmount: number;
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
const emptyCouponForm = { code: '', discountType: 'PERCENT', discountValue: '', expiresAt: '' };

export default function MarketplaceManagementPage() {
  const { darkMode } = useDashboardTheme();
  const { user } = useDashboardUser();
  const canManage = canWrite('products', user?.role);

  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [productsState, setProductsState] = useState<LoadState>('loading');
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [ordersState, setOrdersState] = useState<LoadState>('loading');
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [coupons, setCoupons] = useState<BackendCoupon[]>([]);
  const [couponsState, setCouponsState] = useState<LoadState>('loading');

  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [newCategory, setNewCategory] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState(emptyCouponForm);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [couponFormError, setCouponFormError] = useState<string | null>(null);
  const [deletingCouponId, setDeletingCouponId] = useState<string | null>(null);

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

  const loadCategories = useCallback(async () => {
    try {
      const response = await apiFetch('/api/categories');
      if (!response.ok) return;
      const data: BackendCategory[] = await response.json();
      if (Array.isArray(data)) setCategories(data);
    } catch {
      // Category management is a convenience — the product form still works with free text if this fails.
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

  const loadCoupons = useCallback(async () => {
    if (!canManage) return;
    setCouponsState('loading');
    try {
      const response = await apiFetch('/api/coupons');
      if (!response.ok) throw new Error('Request failed');
      const data: BackendCoupon[] = await response.json();
      setCoupons(Array.isArray(data) ? data : []);
      setCouponsState('ready');
    } catch {
      setCouponsState('error');
    }
  }, [canManage]);

  useEffect(() => {
    void loadProducts();
    void loadCategories();
    void loadOrders();
    void loadCoupons();
  }, [loadProducts, loadCategories, loadOrders, loadCoupons]);

  const totalRequested = useMemo(
    () => orders.reduce((sum, order) => sum + order.totalAmount, 0),
    [orders]
  );

  const categoryBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => {
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
    });
    const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    return entries.map(([label, count], index) => ({
      label: `${label} (${count})`,
      value: products.length ? Math.round((count / products.length) * 100) : 0,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
    }));
  }, [products]);

  const closeProductForm = () => {
    setShowForm(false);
    setEditingProductId(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const startEditProduct = (product: BackendProduct) => {
    setEditingProductId(product.id);
    setForm({
      title: product.title,
      description: product.description,
      price: String(product.price),
      category: product.category,
      features: (product.features ?? []).join(', ')
    });
    setFormError(null);
    setShowForm(true);
  };

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
      const response = await apiFetch(editingProductId ? `/api/products/${editingProductId}` : '/api/products', {
        method: editingProductId ? 'PUT' : 'POST',
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
      setProducts((current) =>
        editingProductId ? current.map((p) => (p.id === editingProductId ? saved : p)) : [saved, ...current]
      );
      closeProductForm();
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

  const handleAddCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    setCategoryError(null);
    try {
      const response = await apiFetch('/api/categories', { method: 'POST', body: JSON.stringify({ name }) });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setCategoryError(body?.message ?? 'Could not save this category.');
        return;
      }
      const saved: BackendCategory = await response.json();
      setCategories((current) => [...current, saved].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategory('');
    } catch {
      setCategoryError('The server could not be reached.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setDeletingCategoryId(id);
    setCategoryError(null);
    try {
      const response = await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (response.status === 409) {
        const body = await response.json().catch(() => null);
        setCategoryError(body?.message ?? 'This category is in use and cannot be deleted.');
        return;
      }
      if (!response.ok) throw new Error('Request failed');
      setCategories((current) => current.filter((c) => c.id !== id));
    } catch {
      setCategoryError('Could not delete this category.');
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleAddCoupon = async (event: React.FormEvent) => {
    event.preventDefault();
    if (savingCoupon) return;
    const discountValue = Number(couponForm.discountValue);
    if (!couponForm.code.trim() || !Number.isFinite(discountValue) || discountValue <= 0) {
      setCouponFormError('Enter a code and a valid discount amount.');
      return;
    }
    setSavingCoupon(true);
    setCouponFormError(null);
    try {
      const response = await apiFetch('/api/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: couponForm.code.trim(),
          discountType: couponForm.discountType,
          discountValue,
          expiresAt: couponForm.expiresAt ? `${couponForm.expiresAt}T23:59:59Z` : null
        })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setCouponFormError(body?.message ?? 'Could not save this coupon.');
        return;
      }
      const saved: BackendCoupon = await response.json();
      setCoupons((current) => [saved, ...current]);
      setCouponForm(emptyCouponForm);
      setShowCouponForm(false);
    } catch {
      setCouponFormError('The server could not be reached.');
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    setDeletingCouponId(id);
    try {
      const response = await apiFetch(`/api/coupons/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Request failed');
      setCoupons((current) => current.filter((c) => c.id !== id));
    } catch {
      // Deletion failing is rare enough (no dependents block it) that a page-level error banner isn't needed here.
    } finally {
      setDeletingCouponId(null);
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
            onClick={() => (showForm ? closeProductForm() : setShowForm(true))}
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
            {categories.length > 0 ? (
              <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                <option value="">Select a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            ) : (
              <input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Add-on" className={inputClass} />
            )}
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
              <Package className="h-4 w-4" /> {saving ? 'Saving…' : editingProductId ? 'Save changes' : 'Save product'}
            </button>
          </div>
        </motion.form>
      )}

      {deleteError && (
        <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
          {deleteError}
        </p>
      )}

      {canManage && (
        <section className={`rounded-[24px] border p-5 ${cardClass}`}>
          <div className="flex items-center gap-2">
            <Tag className={`h-4 w-4 ${muted}`} />
            <h2 className={`text-sm font-semibold ${heading}`}>Categories</h2>
          </div>
          <p className={`mt-1 text-xs ${muted}`}>Managed here so the product form above doesn&apos;t end up with near-duplicates like &ldquo;Software&rdquo; and &ldquo;software&rdquo;.</p>
          <form onSubmit={handleAddCategory} className="mt-3 flex gap-2">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name"
              className={`${inputClass} flex-1`}
            />
            <button type="submit" disabled={!newCategory.trim()} className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50 ${darkMode ? 'bg-cyan-400 text-slate-950' : 'bg-slate-950 text-white'}`}>
              Add
            </button>
          </form>
          {categoryError && <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{categoryError}</p>}
          {categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((category) => (
                <span key={category.id} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${darkMode ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-700'}`}>
                  {category.name}
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    disabled={deletingCategoryId === category.id}
                    aria-label={`Delete category ${category.name}`}
                    className="text-slate-400 hover:text-rose-500 disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {categoryBreakdown.length > 0 && (
        <section className={`rounded-[24px] border p-5 ${cardClass}`}>
          <h2 className={`text-sm font-semibold ${heading}`}>Catalogue by category</h2>
          <p className={`mt-0.5 text-xs ${muted}`}>Share of listed products in each category</p>
          <div className="mt-4">
            <BarList items={categoryBreakdown} darkMode={darkMode} />
          </div>
        </section>
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
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => startEditProduct(product)}
                        aria-label={`Edit ${product.title}`}
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition ${darkMode ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                        aria-label={`Delete ${product.title}`}
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition disabled:opacity-50 ${darkMode ? 'text-slate-400 hover:bg-rose-400/10 hover:text-rose-300' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
            <h2 className={`text-lg font-semibold ${heading}`}>Coupons ({coupons.length})</h2>
            <button
              onClick={() => setShowCouponForm((value) => !value)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${darkMode ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
            >
              {showCouponForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showCouponForm ? 'Close' : 'Add coupon'}
            </button>
          </div>

          {showCouponForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleAddCoupon}
              className={`grid gap-3 rounded-[24px] border p-5 sm:grid-cols-2 lg:grid-cols-4 ${cardClass}`}
            >
              <label className={labelClass}>
                Code
                <input required value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} placeholder="SAVE10" className={inputClass} />
              </label>
              <label className={labelClass}>
                Discount type
                <select value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })} className={inputClass}>
                  <option value="PERCENT">Percent off</option>
                  <option value="FIXED">Fixed amount (LKR)</option>
                </select>
              </label>
              <label className={labelClass}>
                {couponForm.discountType === 'PERCENT' ? 'Percent (1-100)' : 'Amount (LKR)'}
                <input required type="number" min="1" max={couponForm.discountType === 'PERCENT' ? 100 : undefined} value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} placeholder={couponForm.discountType === 'PERCENT' ? '10' : '5000'} className={inputClass} />
              </label>
              <label className={labelClass}>
                Expires (optional)
                <input type="date" value={couponForm.expiresAt} onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })} className={inputClass} />
              </label>
              {couponFormError && <p className="sm:col-span-2 lg:col-span-4 text-sm text-rose-600 dark:text-rose-400">{couponFormError}</p>}
              <div className="sm:col-span-2 lg:col-span-4">
                <button type="submit" disabled={savingCoupon} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium disabled:opacity-60 ${darkMode ? 'bg-cyan-400 text-slate-950' : 'bg-slate-950 text-white'}`}>
                  <Ticket className="h-4 w-4" /> {savingCoupon ? 'Saving…' : 'Save coupon'}
                </button>
              </div>
            </motion.form>
          )}

          {couponsState === 'loading' && coupons.length === 0 && (
            <div className={`flex items-center justify-center gap-2 rounded-[24px] border p-10 text-sm ${cardClass} ${muted}`}>
              <Loader2 className="h-4 w-4 animate-spin" /> Loading coupons…
            </div>
          )}

          {couponsState === 'ready' && coupons.length === 0 && (
            <div className={`rounded-[24px] border p-8 text-center text-sm ${cardClass} ${muted}`}>No coupons yet.</div>
          )}

          {coupons.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {coupons.map((coupon) => (
                <div key={coupon.id} className={`flex items-center justify-between rounded-2xl border p-4 ${cardClass}`}>
                  <div className="min-w-0">
                    <p className={`font-mono text-sm font-semibold ${heading}`}>{coupon.code}</p>
                    <p className={`text-xs ${muted}`}>{formatDiscount(coupon)}{coupon.expiresAt ? ` · expires ${new Date(coupon.expiresAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}` : ''}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteCoupon(coupon.id)}
                    disabled={deletingCouponId === coupon.id}
                    aria-label={`Delete coupon ${coupon.code}`}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition disabled:opacity-50 ${darkMode ? 'text-slate-400 hover:bg-rose-400/10 hover:text-rose-300' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

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
                      {order.couponCode && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                          <Tag className="h-3 w-3" /> {order.couponCode}
                        </span>
                      )}
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300">{order.status}</span>
                      <span className={`text-xs ${muted}`}>{relativeTime(order.createdAt)}</span>
                    </div>
                  </div>
                  <p className={`mt-3 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {order.quantity} × {order.productTitle} ({formatPrice(order.unitPrice)} each)
                    {order.discountAmount > 0 && <> · {formatPrice(order.discountAmount)} off</>} — <span className={`font-semibold ${heading}`}>{formatPrice(order.totalAmount)}</span>
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
