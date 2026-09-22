'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, ShieldCheck, CheckCircle2, MessageSquare, Minus, Plus } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { StarRating } from '@/components/star-rating';
import { apiFetch, getSession, API_BASE_URL, type AuthSession } from '@/lib/auth';
import { formatPrice, formatReviewDate, type BackendProduct, type BackendReview } from '@/lib/marketplace';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<BackendProduct | null>(null);
  const [reviews, setReviews] = useState<BackendReview[]>([]);
  const [status, setStatus] = useState<'loading' | 'found' | 'not-found' | 'error'>('loading');
  const [quantity, setQuantity] = useState(1);

  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [productResponse, reviewsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/products/${params.id}`, { signal: AbortSignal.timeout(10000) }),
          fetch(`${API_BASE_URL}/api/reviews/${params.id}`, { signal: AbortSignal.timeout(10000) })
        ]);
        if (cancelled) return;
        if (productResponse.status === 404) {
          setStatus('not-found');
          return;
        }
        if (!productResponse.ok) throw new Error('Request failed');
        setProduct(await productResponse.json());
        setReviews(reviewsResponse.ok ? await reviewsResponse.json() : []);
        setStatus('found');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rating || !comment.trim() || submitting) return;
    setSubmitting(true);
    setReviewError(null);
    try {
      const response = await apiFetch('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ productId: params.id, rating, comment: comment.trim() })
      });
      if (!response.ok) throw new Error('Request failed');
      const saved: BackendReview = await response.json();
      setReviews((current) => [saved, ...current]);
      setProduct((current) =>
        current
          ? { ...current, reviewCount: current.reviewCount + 1, rating: computeAverage([saved, ...reviews]) }
          : current
      );
      setComment('');
      setRating(0);
      setSubmitted(true);
    } catch {
      setReviewError('Could not submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <SiteShell title="Loading…" subtitle="Fetching this product from the marketplace.">
        <div className="py-20 text-center text-slate-500 dark:text-slate-400">Loading…</div>
      </SiteShell>
    );
  }

  if (status === 'not-found' || status === 'error' || !product) {
    return (
      <SiteShell title="Product not found" subtitle="This listing may have been removed.">
        <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            {status === 'error'
              ? 'Could not reach the marketplace right now. Please try again shortly.'
              : "We couldn't find that product. It may have been removed."}
          </p>
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm font-medium text-cyan-600 hover:text-cyan-700 dark:text-cyan-400">
            <ArrowLeft className="h-4 w-4" /> Back to marketplace
          </Link>
        </div>
      </SiteShell>
    );
  }

  const features = product.features ?? [];

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
            {/* Product Details */}
            <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">
              <div className="mb-8 flex aspect-[16/9] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                 <span className="text-sm font-medium text-slate-400 dark:text-slate-500">{product.category} image placeholder</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  {product.category}
                </span>
                <div className="flex items-center gap-2">
                  <StarRating initialRating={Math.round(product.rating)} readonly className="scale-90" />
                  <span className="text-sm font-medium text-slate-500">({product.reviewCount} reviews)</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl mb-4">
                {product.title}
              </h1>
              <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400 mb-8">
                {product.description}
              </p>

              {features.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Included in this package:</h3>
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {features.map((feature: string) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Ratings & Feedback Section */}
            <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">
               <div className="flex items-center gap-2 mb-6">
                 <MessageSquare className="h-5 w-5 text-slate-400" />
                 <h2 className="text-xl font-bold text-slate-950 dark:text-white">Customer Reviews</h2>
               </div>

               <div className="mb-8 p-5 rounded-2xl border border-slate-100 bg-slate-50 dark:border-white/5 dark:bg-white/5">
                 <h3 className="font-medium text-slate-900 dark:text-white mb-2">Leave your feedback</h3>
                 {!session ? (
                   <p className="text-sm text-slate-600 dark:text-slate-400">
                     <Link href={`/auth?redirect=/marketplace/${params.id}`} className="font-medium text-cyan-600 hover:text-cyan-700 dark:text-cyan-400">Sign in</Link> to leave a review.
                   </p>
                 ) : submitted ? (
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
                         value={comment}
                         onChange={(e) => setComment(e.target.value)}
                         maxLength={1000}
                         className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-cyan-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                         rows={3}
                       />
                     </div>
                     {reviewError && <p className="text-sm text-rose-600 dark:text-rose-400">{reviewError}</p>}
                     <button type="submit" disabled={!rating || !comment.trim() || submitting} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                       {submitting ? 'Submitting…' : 'Submit Review'}
                     </button>
                   </form>
                 )}
               </div>

               {reviews.length === 0 ? (
                 <p className="text-sm text-slate-500 dark:text-slate-400">No reviews yet. Be the first to leave one.</p>
               ) : (
                 <ul className="space-y-4">
                   {reviews.map((review) => (
                     <li key={review.id} className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0 dark:border-white/5">
                       <div className="flex items-center justify-between gap-3">
                         <p className="font-medium text-slate-900 dark:text-white">{review.userName}</p>
                         <span className="text-xs text-slate-400">{formatReviewDate(review.createdAt)}</span>
                       </div>
                       <StarRating initialRating={review.rating} readonly className="mt-1 scale-75 origin-left" />
                       <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{review.comment}</p>
                     </li>
                   ))}
                 </ul>
               )}
            </div>
          </div>

          {/* Sidebar / Purchase Card */}
          <div className="space-y-6">
            <div className="sticky top-6 rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90">
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-500">Price</p>
                <p className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">{formatPrice(product.price)}</p>
              </div>

              <div className="mb-6">
                <p className="mb-1.5 text-sm font-medium text-slate-500">Quantity</p>
                <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 px-2 py-1.5 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-slate-900 dark:text-white">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(100, q + 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <Link
                href={`/marketplace/checkout?product=${params.id}&qty=${quantity}`}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-cyan-500 px-5 py-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 shadow-lg shadow-cyan-500/25"
              >
                <ShoppingCart className="h-5 w-5" /> Request to purchase
              </Link>

              <div className="mt-6 space-y-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-500" />
                  <p>No payment gateway is connected yet, so this sends a purchase request — our team will follow up by email to arrange payment.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}

function computeAverage(reviews: BackendReview[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
