'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Search } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { ProductCard } from '@/components/product-card';
import { API_BASE_URL } from '@/lib/auth';
import { formatPrice, type BackendProduct } from '@/lib/marketplace';

export default function MarketplacePage() {
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products`, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        const data: BackendProduct[] = await response.json();
        if (!cancelled) {
          setProducts(Array.isArray(data) ? data : []);
          setStatus('ready');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map((p) => p.category)))], [products]);

  const filteredProducts = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === 'All' || product.category === category;
      const matchesSearch =
        needle === '' ||
        product.title.toLowerCase().includes(needle) ||
        product.description.toLowerCase().includes(needle);
      return matchesCategory && matchesSearch;
    });
  }, [products, searchTerm, category]);

  return (
    <SiteShell
      title="Discover software, services, and add-ons."
      subtitle="Expand your capabilities with trusted products available directly on the Ceylon IntelliBiz marketplace."
    >
      <section className="rounded-[32px] border border-slate-200/80 bg-white/80 p-8 shadow-[0_35px_100px_-32px_rgba(15,23,42,0.38)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">

        {/* Header and Search */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
              <Sparkles className="h-4 w-4" />
              Marketplace Store
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Products & Services
            </h1>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-400 dark:border-white/10 dark:bg-slate-950/50 dark:text-white"
            />
          </div>
        </div>

        {categories.length > 1 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  category === item
                    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {/* Product Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {status === 'loading' && (
            <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">Loading products…</div>
          )}
          {status === 'error' && (
            <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
              Could not reach the marketplace right now. Please try again shortly.
            </div>
          )}
          {status === 'ready' && filteredProducts.length > 0 &&
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                description={product.description}
                price={formatPrice(product.price)}
                rating={product.rating}
                reviews={product.reviewCount}
                category={product.category}
              />
            ))}
          {status === 'ready' && filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
              {products.length === 0
                ? 'No products are listed yet. Check back soon.'
                : `No products found matching "${searchTerm}".`}
            </div>
          )}
        </div>

      </section>
    </SiteShell>
  );
}
