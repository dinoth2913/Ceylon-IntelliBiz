'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Lock, CheckCircle2 } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import Link from 'next/link';

const mockProducts: Record<string, any> = {
  'prod-1': { title: 'Enterprise ERP License', price: '450,000' },
  'prod-2': { title: 'AI Forecasting Module', price: '125,000' },
  'prod-3': { title: 'Implementation Consultation', price: '180,000' },
  'prod-4': { title: 'Vendor API Access Tier 1', price: '65,000' }
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('product');
  const product = productId ? mockProducts[productId] : null;
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    card: '',
    expiry: '',
    cvc: ''
  });

  if (!product) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">No product selected.</p>
        <Link href="/marketplace" className="mt-4 text-cyan-600">Return to marketplace</Link>
      </div>
    );
  }

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing delay
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-lg overflow-hidden rounded-[32px] border border-slate-200 bg-white/80 p-10 text-center shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-bold text-slate-950 dark:text-white">Payment Successful!</h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          Your order for <strong>{product.title}</strong> has been confirmed. A receipt has been sent to your email.
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

  return (
    <div className="mx-auto max-w-5xl">
      <Link href={`/marketplace/${productId}`} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to product
      </Link>
      
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Payment Form */}
        <div className="rounded-[32px] border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Secure Checkout</h1>
              <p className="text-sm text-slate-500">Enter your details to complete the purchase.</p>
            </div>
          </div>

          <form onSubmit={handlePayment} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                <input 
                  required type="text" placeholder="John Doe"
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                <input 
                  required type="email" placeholder="john@example.com"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-5 dark:border-white/5">
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Card Number</label>
              <div className="relative">
                <input 
                  required type="text" placeholder="0000 0000 0000 0000" maxLength={19}
                  onChange={(e) => setFormData({...formData, card: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 pl-10 text-sm outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                />
                <CreditCard className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Expiry Date</label>
                <input 
                  required type="text" placeholder="MM/YY" maxLength={5}
                  onChange={(e) => setFormData({...formData, expiry: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">CVC</label>
                <input 
                  required type="text" placeholder="123" maxLength={4}
                  onChange={(e) => setFormData({...formData, cvc: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isProcessing}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-cyan-500 px-5 py-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 shadow-lg shadow-cyan-500/25 disabled:opacity-70"
            >
              {isProcessing ? (
                <span className="animate-pulse">Processing Payment...</span>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Pay LKR {product.price}
                </>
              )}
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
                <p className="text-sm text-slate-500">Qty: 1</p>
              </div>
              <p className="font-medium text-slate-900 dark:text-white">LKR {product.price}</p>
            </div>
            <div className="flex items-center justify-between pt-4">
              <p className="text-slate-500">Subtotal</p>
              <p className="text-slate-900 dark:text-white">LKR {product.price}</p>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-slate-500">Tax</p>
              <p className="text-slate-900 dark:text-white">Calculated at checkout</p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-white/10">
              <p className="font-bold text-slate-900 dark:text-white">Total</p>
              <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400">LKR {product.price}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <SiteShell title="Secure Checkout" subtitle="Complete your payment securely.">
      <Suspense fallback={<div className="py-20 text-center">Loading checkout...</div>}>
        <CheckoutContent />
      </Suspense>
    </SiteShell>
  );
}
