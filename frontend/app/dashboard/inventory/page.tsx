'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, PackageCheck, PackagePlus, Pencil, Plus, Radio, X } from 'lucide-react';
import { useDashboardTheme, useDashboardUser } from '@/components/dashboard/dashboard-shell';
import { ConfirmDeleteButton } from '@/components/dashboard/confirm-delete-button';
import { apiFetch } from '@/lib/auth';
import { canWrite } from '@/lib/roles';
import { shortId } from '@/lib/utils';
import { inventory as seedInventory, formatLkr, type InventoryRecord } from '@/lib/dashboard-data';

type BackendInventoryItem = {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  warehouse: string | null;
  price: number;
  stockQuantity: number | null;
  reorderLevel: number | null;
};

type DisplayItem = InventoryRecord & { backendId: string | null };

function mapInventoryItem(record: BackendInventoryItem): DisplayItem {
  return {
    id: `INV-${shortId(record.id)}`,
    backendId: record.id,
    sku: record.sku,
    name: record.name,
    category: record.category ?? 'Uncategorized',
    warehouse: record.warehouse ?? '—',
    stock: record.stockQuantity ?? 0,
    reorderLevel: record.reorderLevel ?? 10,
    unitCost: record.price
  };
}

const emptyForm = { sku: '', name: '', category: '', warehouse: '', price: '', stockQuantity: '', reorderLevel: '10' };

export default function InventoryPage() {
  const { darkMode } = useDashboardTheme();
  const { user } = useDashboardUser();
  const canAdd = canWrite('inventory', user?.role);
  const [inventory, setInventory] = useState<DisplayItem[]>(seedInventory.map((i) => ({ ...i, backendId: null })));
  const [dataSource, setDataSource] = useState<'sample' | 'live'>('sample');
  const cardClass = darkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/80 shadow-sm';
  const inputClass = `rounded-xl border px-3 py-2 text-sm outline-none ${darkMode ? 'border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900'}`;
  const labelClass = `flex flex-col gap-1.5 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiFetch('/api/inventory');
        if (!response.ok) return;
        const data: BackendInventoryItem[] = await response.json();
        if (!cancelled && Array.isArray(data)) {
          setInventory(data.map(mapInventoryItem));
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

  const lowStockCount = inventory.filter((item) => item.stock <= item.reorderLevel).length;
  const totalValue = inventory.reduce((sum, item) => sum + item.stock * item.unitCost, 0);

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const startEdit = (item: DisplayItem) => {
    if (!item.backendId) return;
    setEditingId(item.backendId);
    setForm({
      sku: item.sku,
      name: item.name,
      category: item.category === 'Uncategorized' ? '' : item.category,
      warehouse: item.warehouse === '—' ? '' : item.warehouse,
      price: String(item.unitCost),
      stockQuantity: String(item.stock),
      reorderLevel: String(item.reorderLevel)
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const price = Number(form.price);
    const stockQuantity = form.stockQuantity === '' ? 0 : Number(form.stockQuantity);
    const reorderLevel = form.reorderLevel === '' ? 10 : Number(form.reorderLevel);
    if (!form.sku.trim() || !form.name.trim() || !Number.isFinite(price) || price < 0) {
      setFormError('Enter an SKU, a name and a valid price.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const response = await apiFetch(editingId ? `/api/inventory/${editingId}` : '/api/inventory', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify({
          sku: form.sku.trim(),
          name: form.name.trim(),
          category: form.category.trim() || null,
          warehouse: form.warehouse.trim() || null,
          price,
          stockQuantity,
          reorderLevel
        })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setFormError(body?.message ?? 'Could not save this item.');
        return;
      }
      const saved: BackendInventoryItem = await response.json();
      const mapped = mapInventoryItem(saved);
      setInventory((current) =>
        editingId
          ? current.map((i) => (i.backendId === editingId ? mapped : i))
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

  const handleDelete = async (item: DisplayItem) => {
    if (!item.backendId) return;
    setDeletingId(item.backendId);
    setListError(null);
    try {
      const response = await apiFetch(`/api/inventory/${item.backendId}`, { method: 'DELETE' });
      if (response.status === 409) {
        const body = await response.json().catch(() => null);
        setListError(body?.message ?? 'This item cannot be deleted.');
        return;
      }
      if (!response.ok) throw new Error('Request failed');
      setInventory((current) => current.filter((i) => i.backendId !== item.backendId));
    } catch {
      setListError('Could not delete this item. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Operations</p>
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
          <h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${darkMode ? 'text-white' : 'text-slate-950'}`}>Inventory</h1>
        </div>
        {canAdd && (
          <button
            onClick={() => (showForm ? closeForm() : setShowForm(true))}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${darkMode ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Close' : 'Add item'}
          </button>
        )}
      </div>

      {canAdd && showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSubmit}
          className={`grid gap-3 rounded-[24px] border p-5 sm:grid-cols-2 lg:grid-cols-4 ${cardClass}`}
        >
          <label className={labelClass}>
            SKU
            <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU-1042" className={inputClass} />
          </label>
          <label className={labelClass}>
            Name
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ceylon Cinnamon 250g" className={inputClass} />
          </label>
          <label className={labelClass}>
            Category
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Spices" className={inputClass} />
          </label>
          <label className={labelClass}>
            Warehouse
            <input value={form.warehouse} onChange={(e) => setForm({ ...form, warehouse: e.target.value })} placeholder="Colombo DC" className={inputClass} />
          </label>
          <label className={labelClass}>
            Unit cost (LKR)
            <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="1200" className={inputClass} />
          </label>
          <label className={labelClass}>
            Stock quantity
            <input type="number" min="0" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} placeholder="0" className={inputClass} />
          </label>
          <label className={labelClass}>
            Reorder level
            <input type="number" min="0" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} placeholder="10" className={inputClass} />
          </label>
          {formError && <p className="sm:col-span-2 lg:col-span-4 text-sm text-rose-600 dark:text-rose-400">{formError}</p>}
          <div className="sm:col-span-2 lg:col-span-4">
            <button type="submit" disabled={saving} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium disabled:opacity-60 ${darkMode ? 'bg-cyan-400 text-slate-950' : 'bg-slate-950 text-white'}`}>
              <PackagePlus className="h-4 w-4" /> {saving ? 'Saving…' : editingId ? 'Save changes' : 'Save item'}
            </button>
          </div>
        </motion.form>
      )}

      {listError && (
        <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
          {listError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`rounded-[20px] border p-4 ${cardClass}`}>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>SKUs tracked</p>
          <p className={`mt-1 text-2xl font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>{inventory.length}</p>
        </div>
        <div className={`rounded-[20px] border p-4 ${cardClass}`}>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Below reorder level</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-300">{lowStockCount}</p>
        </div>
        <div className={`rounded-[20px] border p-4 ${cardClass}`}>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Stock value on hand</p>
          <p className={`mt-1 text-2xl font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>{formatLkr(totalValue)}</p>
        </div>
      </div>

      {inventory.length === 0 && (
        <div className={`rounded-[24px] border p-8 text-center text-sm ${cardClass} ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          No inventory items yet.
        </div>
      )}

      <div className="grid gap-4">
        {inventory.map((item, index) => {
          const ratio = Math.min(100, Math.round((item.stock / (item.reorderLevel * 2)) * 100));
          const isLow = item.stock <= item.reorderLevel;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.35 }}
              className={`rounded-[24px] border p-5 ${cardClass}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className={`text-xs font-medium uppercase tracking-wide ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{item.sku} · {item.category}</p>
                  <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.name}</h3>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.warehouse} · unit cost {formatLkr(item.unitCost)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isLow ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
                      <AlertTriangle className="h-3.5 w-3.5" /> Reorder now
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                      <PackageCheck className="h-3.5 w-3.5" /> Healthy stock
                    </span>
                  )}
                  {canAdd && item.backendId && (
                    <>
                      <button
                        onClick={() => startEdit(item)}
                        aria-label={`Edit ${item.name}`}
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition ${darkMode ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <ConfirmDeleteButton
                        darkMode={darkMode}
                        label={`Delete ${item.name}`}
                        busy={deletingId === item.backendId}
                        onConfirm={() => handleDelete(item)}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className={`h-2 flex-1 overflow-hidden rounded-full ${darkMode ? 'bg-white/10' : 'bg-slate-100'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${ratio}%` }}
                    transition={{ delay: 0.15 + index * 0.05, duration: 0.6 }}
                    className={`h-full rounded-full ${isLow ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  />
                </div>
                <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{item.stock} units</span>
                <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>reorder at {item.reorderLevel}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
