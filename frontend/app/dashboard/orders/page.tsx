'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Plus, Radio, Search, ShoppingBag, Trash2, X } from 'lucide-react';
import { useDashboardTheme, useDashboardUser } from '@/components/dashboard/dashboard-shell';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { ConfirmDeleteButton } from '@/components/dashboard/confirm-delete-button';
import { apiFetch } from '@/lib/auth';
import { canWrite } from '@/lib/roles';
import { orders as seedOrders, formatLkr, type OrderRecord } from '@/lib/dashboard-data';

const statuses = ['All', 'Processing', 'Fulfilled', 'Pending payment', 'Cancelled'] as const;
const orderStatuses = ['Processing', 'Fulfilled', 'Pending payment', 'Cancelled'] as const;
const channels = ['Direct sales', 'Marketplace', 'Field agent'] as const;

type BackendLineItem = { description: string; quantity: number; unitPrice: number };

type BackendOrder = {
  id: string;
  orderNumber: string;
  customerId: string | null;
  channel: string;
  items: BackendLineItem[];
  totalAmount: number;
  status: string;
  createdAt: string | null;
};

type BackendCustomer = { id: string; fullName: string };

type LineItemDraft = { description: string; quantity: string; unitPrice: string };

type DisplayOrder = OrderRecord & { backendId: string | null; customerId: string | null; rawItems: BackendLineItem[] };

const emptyLineItem: LineItemDraft = { description: '', quantity: '1', unitPrice: '' };

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function mapOrder(record: BackendOrder, customerNames: Map<string, string>): DisplayOrder {
  return {
    id: record.orderNumber,
    backendId: record.id,
    customerId: record.customerId,
    customer: customerNames.get(record.customerId ?? '') ?? 'Unknown customer',
    items: record.items?.length ? record.items.length : 1,
    rawItems: record.items ?? [],
    total: record.totalAmount,
    status: (record.status as OrderRecord['status']) ?? 'Processing',
    channel: (record.channel as OrderRecord['channel']) ?? 'Direct sales',
    date: formatDate(record.createdAt)
  };
}

function suggestOrderNumber() {
  return `ORD-${Date.now().toString().slice(-6)}`;
}

const emptyForm = {
  orderNumber: suggestOrderNumber(),
  customerId: '',
  totalAmount: '',
  status: 'Processing' as string,
  channel: 'Direct sales' as string
};

export default function OrdersPage() {
  const { darkMode } = useDashboardTheme();
  const { user } = useDashboardUser();
  const canAdd = canWrite('orders', user?.role);
  const [orders, setOrders] = useState<DisplayOrder[]>(seedOrders.map((o) => ({ ...o, backendId: null, customerId: null, rawItems: [] })));
  const [dataSource, setDataSource] = useState<'sample' | 'live'>('sample');
  const [status, setStatus] = useState<(typeof statuses)[number]>('All');
  const [query, setQuery] = useState('');
  const cardClass = darkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/80 shadow-sm';
  const inputClass = `rounded-xl border px-3 py-2 text-sm outline-none ${darkMode ? 'border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900'}`;
  const labelClass = `flex flex-col gap-1.5 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`;

  const [customers, setCustomers] = useState<BackendCustomer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [ordersResponse, customersResponse] = await Promise.all([
          apiFetch('/api/orders'),
          apiFetch('/api/customers')
        ]);
        if (!ordersResponse.ok) return;
        const ordersData: BackendOrder[] = await ordersResponse.json();
        const customersData: BackendCustomer[] = customersResponse.ok ? await customersResponse.json() : [];
        if (!cancelled) setCustomers(customersData);
        const customerNames = new Map(customersData.map((customer) => [customer.id, customer.fullName]));
        if (!cancelled && Array.isArray(ordersData)) {
          setOrders(ordersData.map((order) => mapOrder(order, customerNames)));
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
    return orders.filter((order) => {
      const matchesStatus = status === 'All' || order.status === status;
      const matchesQuery = query.trim() === '' || order.customer.toLowerCase().includes(query.toLowerCase()) || order.id.toLowerCase().includes(query.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [orders, status, query]);

  const totals = {
    processing: orders.filter((o) => o.status === 'Processing').length,
    fulfilled: orders.filter((o) => o.status === 'Fulfilled').length,
    value: orders.reduce((sum, o) => sum + o.total, 0)
  };

  const computedLineItemsTotal = useMemo(() => {
    return lineItems.reduce((sum, item) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return sum;
      return sum + quantity * unitPrice;
    }, 0);
  }, [lineItems]);

  const addLineItem = () => setLineItems((current) => [...current, { ...emptyLineItem }]);
  const removeLineItem = (index: number) => setLineItems((current) => current.filter((_, i) => i !== index));
  const updateLineItem = (index: number, patch: Partial<LineItemDraft>) =>
    setLineItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm, orderNumber: suggestOrderNumber() });
    setLineItems([]);
    setFormError(null);
  };

  const startEdit = (order: DisplayOrder) => {
    if (!order.backendId) return;
    setEditingId(order.backendId);
    setForm({
      orderNumber: order.id,
      customerId: order.customerId ?? '',
      totalAmount: String(order.total),
      status: order.status,
      channel: order.channel
    });
    setLineItems(
      order.rawItems.map((item) => ({
        description: item.description,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice)
      }))
    );
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!form.orderNumber.trim()) {
      setFormError('Enter an order number.');
      return;
    }

    let items: BackendLineItem[] = [];
    let totalAmount: number;

    if (lineItems.length > 0) {
      for (const item of lineItems) {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        if (!item.description.trim() || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
          setFormError('Every line item needs a description, a quantity of at least 1, and a valid unit price.');
          return;
        }
      }
      items = lineItems.map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice)
      }));
      totalAmount = computedLineItemsTotal;
    } else {
      totalAmount = Number(form.totalAmount);
      if (!Number.isFinite(totalAmount) || totalAmount < 0) {
        setFormError('Enter a valid total amount, or add at least one line item.');
        return;
      }
    }

    setSaving(true);
    setFormError(null);
    try {
      const response = await apiFetch(editingId ? `/api/orders/${editingId}` : '/api/orders', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify({
          orderNumber: form.orderNumber.trim(),
          customerId: form.customerId || null,
          channel: form.channel,
          items,
          totalAmount,
          status: form.status
        })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setFormError(body?.message ?? 'Could not save this order.');
        return;
      }
      const saved: BackendOrder = await response.json();
      const customerNames = new Map(customers.map((customer) => [customer.id, customer.fullName]));
      const mapped = mapOrder(saved, customerNames);
      setOrders((current) =>
        editingId
          ? current.map((o) => (o.backendId === editingId ? mapped : o))
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

  const handleDelete = async (order: DisplayOrder) => {
    if (!order.backendId) return;
    setDeletingId(order.backendId);
    setListError(null);
    try {
      const response = await apiFetch(`/api/orders/${order.backendId}`, { method: 'DELETE' });
      if (response.status === 409) {
        const body = await response.json().catch(() => null);
        setListError(body?.message ?? 'This order cannot be deleted.');
        return;
      }
      if (!response.ok) throw new Error('Request failed');
      setOrders((current) => current.filter((o) => o.backendId !== order.backendId));
    } catch {
      setListError('Could not delete this order. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sales</p>
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
          <h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${darkMode ? 'text-white' : 'text-slate-950'}`}>Orders</h1>
        </div>
        {canAdd && (
          <button
            onClick={() => (showForm ? closeForm() : setShowForm(true))}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${darkMode ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Close' : 'Add order'}
          </button>
        )}
      </div>

      {canAdd && showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSubmit}
          className={`flex flex-col gap-4 rounded-[24px] border p-5 ${cardClass}`}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className={labelClass}>
              Order number
              <input required value={form.orderNumber} onChange={(e) => setForm({ ...form, orderNumber: e.target.value })} placeholder="ORD-100234" className={inputClass} />
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
              Channel
              <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className={inputClass}>
                {channels.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                {orderStatuses.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <div className={`rounded-2xl border p-4 ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Line items (optional)</p>
              <button
                type="button"
                onClick={addLineItem}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${darkMode ? 'border border-white/10 text-slate-200 hover:bg-white/5' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                <Plus className="h-3.5 w-3.5" /> Add line item
              </button>
            </div>

            {lineItems.length === 0 ? (
              <p className={`mt-2 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                No line items — the total amount below is used as-is. Add a line item to build the order from a description, quantity and unit price instead (the total is then computed automatically).
              </p>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-[1fr_80px_120px_32px] items-center gap-2">
                    <input
                      value={item.description}
                      onChange={(e) => updateLineItem(index, { description: e.target.value })}
                      placeholder="Description"
                      className={inputClass}
                    />
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, { quantity: e.target.value })}
                      placeholder="Qty"
                      className={inputClass}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(index, { unitPrice: e.target.value })}
                      placeholder="Unit price"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      aria-label="Remove line item"
                      className={`flex h-9 w-9 items-center justify-center rounded-full transition ${darkMode ? 'text-slate-400 hover:bg-rose-400/10 hover:text-rose-300' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <p className={`mt-1 text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Computed total: {formatLkr(computedLineItemsTotal)}
                </p>
              </div>
            )}
          </div>

          <label className={labelClass}>
            Total amount (LKR){lineItems.length > 0 ? ' — computed from line items' : ''}
            <input
              required={lineItems.length === 0}
              disabled={lineItems.length > 0}
              type="number"
              min="0"
              step="0.01"
              value={lineItems.length > 0 ? computedLineItemsTotal.toFixed(2) : form.totalAmount}
              onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
              placeholder="45000"
              className={`${inputClass} sm:max-w-xs disabled:opacity-60`}
            />
          </label>

          {formError && <p className="text-sm text-rose-600 dark:text-rose-400">{formError}</p>}

          <div>
            <button type="submit" disabled={saving} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium disabled:opacity-60 ${darkMode ? 'bg-cyan-400 text-slate-950' : 'bg-slate-950 text-white'}`}>
              <ShoppingBag className="h-4 w-4" /> {saving ? 'Saving…' : editingId ? 'Save changes' : 'Save order'}
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
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>In progress</p>
          <p className={`mt-1 text-2xl font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>{totals.processing}</p>
        </div>
        <div className={`rounded-[20px] border p-4 ${cardClass}`}>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Fulfilled</p>
          <p className={`mt-1 text-2xl font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>{totals.fulfilled}</p>
        </div>
        <div className={`rounded-[20px] border p-4 ${cardClass}`}>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Order value</p>
          <p className={`mt-1 text-2xl font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>{formatLkr(totals.value)}</p>
        </div>
      </div>

      <div className={`flex flex-wrap items-center gap-3 rounded-[24px] border p-4 ${cardClass}`}>
        <div className={`flex flex-1 min-w-[200px] items-center gap-2 rounded-full border px-4 py-2 ${darkMode ? 'border-white/10 bg-slate-950/60 text-slate-300' : 'border-slate-200 bg-white text-slate-500'}`}>
          <Search className="h-4 w-4" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by order ID or customer" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
        </div>
        <div className="flex flex-wrap gap-2">
          {statuses.map((item) => (
            <button
              key={item}
              onClick={() => setStatus(item)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                status === item
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
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Channel</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
                {canAdd && <th className="px-5 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
              {filtered.map((order) => (
                <tr key={order.id} className={darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}>
                  <td className={`px-5 py-3.5 font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{order.id}</td>
                  <td className={`px-5 py-3.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{order.customer}</td>
                  <td className={`px-5 py-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{order.channel}</td>
                  <td className={`px-5 py-3.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{order.items}</td>
                  <td className={`px-5 py-3.5 font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatLkr(order.total)}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={order.status} darkMode={darkMode} /></td>
                  <td className={`px-5 py-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{order.date}</td>
                  {canAdd && (
                    <td className="px-5 py-3.5">
                      {order.backendId && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(order)}
                            aria-label={`Edit ${order.id}`}
                            className={`flex h-8 w-8 items-center justify-center rounded-full transition ${darkMode ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <ConfirmDeleteButton
                            darkMode={darkMode}
                            label={`Delete ${order.id}`}
                            busy={deletingId === order.backendId}
                            onConfirm={() => handleDelete(order)}
                          />
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={canAdd ? 8 : 7} className={`px-5 py-8 text-center text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {orders.length === 0 ? 'No orders yet.' : 'No orders match your filters.'}
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
