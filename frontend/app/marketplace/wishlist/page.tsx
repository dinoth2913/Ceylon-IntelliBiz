'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart, Trash2 } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { getWishlist, removeFromWishlist, type WishlistItem } from '@/lib/wishlist';
import { formatPrice } from '@/lib/marketplace';

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItems(getWishlist());
    setLoaded(true);
  }, []);

  const handleRemove = (id: string) => {
    removeFromWishlist(id);
    setItems((current) => current.filter((item) => item.id !== id));
  };

  return (
    <SiteShell
      title="Come back when you're ready."
      subtitle="Saved items stay in this browser until you remove them or clear your browser data."
    >
      <section className="rounded-[32px] border border-slate-200/80 bg-white/80 p-8 shadow-[0_35px_100px_-32px_rgba(15,23,42,0.38)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">
        <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to marketplace
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-400/10 dark:text-rose-300">
            <Heart className="h-5 w-5" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Your wishlist</h1>
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Saved in this browser only — there&apos;s no account to sign into, so it won&apos;t follow you to another device.
        </p>

        {loaded && items.length === 0 && (
          <div className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 p-10 text-center dark:border-white/10 dark:bg-white/5">
            <p className="text-slate-600 dark:text-slate-400">Nothing saved yet.</p>
            <Link href="/marketplace" className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950">
              Browse the marketplace
            </Link>
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col rounded-[24px] border border-slate-200 bg-white/70 p-5 dark:border-white/10 dark:bg-slate-900/60">
                <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  {item.category}
                </span>
                <Link href={`/marketplace/${item.id}`} className="mt-3 flex-1 text-lg font-semibold text-slate-900 transition hover:text-cyan-600 dark:text-white dark:hover:text-cyan-400">
                  {item.title}
                </Link>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/5">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{formatPrice(item.price)}</p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/marketplace/${item.id}`}
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleRemove(item.id)}
                      aria-label={`Remove ${item.title} from wishlist`}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-400/10 dark:hover:text-rose-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
