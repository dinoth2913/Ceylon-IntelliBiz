'use client';

import { useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShoppingCart, ShieldCheck, CheckCircle2, MessageSquare } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { StarRating } from '@/components/star-rating';

const mockProducts: Record<string, any> = {
  'prod-1': {
    title: 'Enterprise ERP License',
    description: 'Annual license for the full enterprise resource planning suite including HR and finance modules.',
    price: 'LKR 450,000 / yr',
    rating: 4,
    reviews: 28,
    category: 'Software',
    features: ['Unlimited users', 'Priority support', 'Free updates', 'Custom integrations']
  },
  'prod-2': {
    title: 'AI Forecasting Module',
    description: 'Plugin for your existing CRM to predict sales trends and flag at-risk accounts automatically.',
    price: 'LKR 125,000 / yr',
    rating: 5,
    reviews: 14,
    category: 'Add-on',
    features: ['Real-time predictions', 'Churn analysis', 'Automated alerts']
  },
  'prod-3': {
    title: 'Implementation Consultation',
    description: '40 hours of dedicated expert consultation to set up your workflow and train your core team.',
    price: 'LKR 180,000',
    rating: 5,
    reviews: 42,
    category: 'Service',
    features: ['Dedicated account manager', 'On-site training', 'Workflow mapping']
  },
  'prod-4': {
    title: 'Vendor API Access Tier 1',
    description: 'Secure API access to integrate external marketplaces directly into your inventory layer.',
    price: 'LKR 65,000 / mo',
    rating: 3,
    reviews: 8,
    category: 'Infrastructure',
    features: ['10,000 requests/mo', '99.9% uptime SLA', 'Webhook support']
  }
};

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = mockProducts[params.id];
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  if (!product) {
    notFound();
  }

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !feedback) return;
    setSubmitted(true);
    setFeedback('');
    setRating(0);
  };

  return (
    <SiteShell 
      title={`Purchase ${product.title}`}
      subtitle="Complete your transaction securely via the Ceylon IntelliBiz marketplace."
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to marketplace
        </Link>
        
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            {/* Product Images & Details */}
            <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">
              <div className="aspect-[16/9] w-full rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-8">
                 <span className="text-slate-400 dark:text-slate-500 font-medium">Product Image Placeholder</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  {product.category}
                </span>
                <div className="flex items-center gap-2">
                  <StarRating initialRating={product.rating} readonly className="scale-90" />
                  <span className="text-sm font-medium text-slate-500">({product.reviews} reviews)</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl mb-4">
                {product.title}
              </h1>
              <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400 mb-8">
                {product.description}
              </p>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">Included in this package:</h3>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {product.features.map((feature: string) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Ratings & Feedback Section */}
            <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">
               <div className="flex items-center gap-2 mb-6">
                 <MessageSquare className="h-5 w-5 text-slate-400" />
                 <h2 className="text-xl font-bold text-slate-950 dark:text-white">Customer Reviews</h2>
               </div>
               
               <div className="mb-8 p-5 rounded-2xl border border-slate-100 bg-slate-50 dark:border-white/5 dark:bg-white/5">
                 <h3 className="font-medium text-slate-900 dark:text-white mb-2">Leave your feedback</h3>
                 {submitted ? (
                   <div className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 p-3 rounded-xl dark:bg-emerald-400/10 dark:border-emerald-400/20 dark:text-emerald-300">
                     Thank you for rating this product! Your review has been submitted.
                   </div>
                 ) : (
                   <form onSubmit={handleSubmitReview} className="space-y-4">
                     <div>
                       <label className="block text-sm text-slate-500 mb-1">Your rating</label>
                       <StarRating initialRating={rating} onRate={setRating} />
                     </div>
                     <div>
                       <textarea 
                         placeholder="What did you like or dislike?"
                         value={feedback}
                         onChange={(e) => setFeedback(e.target.value)}
                         className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-cyan-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                         rows={3}
                       />
                     </div>
                     <button type="submit" disabled={!rating || !feedback} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                       Submit Review
                     </button>
                   </form>
                 )}
               </div>
            </div>
          </div>

          {/* Sidebar / Purchase Card */}
          <div className="space-y-6">
            <div className="sticky top-6 rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90">
              <div className="mb-6">
                <p className="text-sm font-medium text-slate-500">Total Price</p>
                <p className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">{product.price}</p>
              </div>
              
              <Link 
                href={`/marketplace/checkout?product=${params.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-cyan-500 px-5 py-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 shadow-lg shadow-cyan-500/25"
              >
                <ShoppingCart className="h-5 w-5" /> Proceed to Checkout
              </Link>
              
              <div className="mt-6 space-y-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-500" />
                  <p><strong>Secure transaction.</strong> Your payment is encrypted and guaranteed by IntelliBiz.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
