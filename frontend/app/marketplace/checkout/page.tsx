'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ShieldCheck, CheckCircle2, Mail } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import Link from 'next/link';
import { API_BASE_URL, getSession } from '@/lib/auth';
import { formatPrice, type BackendProduct } from '@/lib/marketplace';
import { shortId } from '@/lib/utils';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('product');
  const quantity = Math.max(1, Math.min(100, Number(searchParams.get('qty')) || 1));

  const [product, setProduct] = useState<BackendProduct | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found' | 'error'>('loading');
  const [form, setForm] = useState({ name: '', email: '', company: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ id: string; total: number } | null>(null);

  useEffect(() => {
    const session = getSession();
    if (session?.user) {
      setForm((current) => ({ ...current, name: current.name || session.user.username, email: current.email || session.user.email }));
    }
  }, []);

  useEffect(() => {
    if (!productId) {
      setStatus('not-found');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, { signal: AbortSignal.timeout(10000) });
        if (cancelled) return;
        if (response.status === 404) {
          setStatus('not-found');
          return;
        }
        if (!response.ok) throw new Error('Request failed');
        setProduct(await response.json());
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || !productId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/marketplace-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantity,
          buyerName: form.name.trim(),
          buyerEmail: form.email.trim(),
          buyerCompany: form.company.trim() || null
        }),
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) throw new Error('Request failed');
      const saved = await response.json();
      setConfirmation({ id: saved.id, total: saved.totalAmount });
    } catch {
      setSubmitError('Could not send your request. Please try again, or email hello@ceylonintellibiz.com.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return <div className="py-20 text-center text-slate-500 dark:text-slate-400">Loading…</div>;
  }

  if (status === 'not-found' || status === 'error') {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500 dark:text-slate-400">
          {status === 'error' ? 'Could not reach the marketplace right now.' : 'No product selected.'}
        </p>
        <Link href="/marketplace" className="mt-4 inline-block text-cyan-600 dark:text-cyan-400">Return to marketplace</Link>
      </div>
    );
  }

  if (confirmation) {
    return (
      <div className="mx-auto max-w-lg overflow-hidden rounded-[32px] border border-slate-200 bg-white/80 p-10 text-center shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-bold text-slate-950 dark:text-white">Request received!</h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          Reference <strong>REQ-{shortId(confirmation.id)}</strong> for <strong>{product?.title}</strong> ({formatPrice(confirmation.total)} total).
        </p>
        <p className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Mail className="h-4 w-4" /> We don&apos;t have a payment gateway connected yet, so our sales team will email you to arrange payment.
        </p>
        <Link
          href="/marketplace"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          Return to Marketplace
        </Link>
      </div>
    );
  }

  if (!product) return null;

  const total = product.price * quantity;

  return (
    <div className="mx-auto max-w-5xl">
      <Link href={`/marketplace/${productId}`} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to product
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Buyer details form */}
        <div className="rounded-[32px] border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Request to purchase</h1>
              <p className="text-sm text-slate-500">No payment is taken now — this sends your details to our sales team.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                <input
                  required type="text" placeholder="John Doe" maxLength={255}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                <input
                  required type="email" placeholder="john@example.com" maxLength={255}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Company (optional)</label>
              <input
                type="text" placeholder="Your company" maxLength={255}
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
              />
            </div>

            {submitError && <p className="text-sm text-rose-600 dark:text-rose-400">{submitError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-cyan-500 px-5 py-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 shadow-lg shadow-cyan-500/25 disabled:opacity-70"
            >
              {submitting ? <span className="animate-pulse">Sending request…</span> : <>Send purchase request</>}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div>
          <div className="sticky top-6 rounded-[32px] border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <h3 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Order Summary</h3>
            <div className="flex items-start justify-between border-b border-slate-200 pb-4 dark:border-white/10">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{product.title}</p>
                <p className="text-sm text-slate-500">Qty: {quantity}</p>
              </div>
              <p className="font-medium text-slate-900 dark:text-white">{formatPrice(total)}</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="font-bold text-slate-900 dark:text-white">Total</p>
              <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{formatPrice(total)}</p>
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Payment gateways (PayHere, Stripe and Genie) are not connected yet, so payment is arranged after this request.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <SiteShell title="Request to purchase" subtitle="Tell us who to contact — no card details needed.">
      <Suspense fallback={<div className="py-20 text-center">Loading checkout...</div>}>
        <CheckoutContent />
      </Suspense>
    </SiteShell>
  );
}
