'use client';

import { useState } from 'react';
import { Sparkles, Search, Filter } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { ProductCard } from '@/components/product-card';

// Mock product data for demonstration
const mockProducts = [
  {
    id: 'prod-1',
    title: 'Enterprise ERP License',
    description: 'Annual license for the full enterprise resource planning suite including HR and finance modules.',
    price: 'LKR 450,000 / yr',
    rating: 4,
    reviews: 28,
    category: 'Software'
  },
  {
    id: 'prod-2',
    title: 'AI Forecasting Module',
    description: 'Plugin for your existing CRM to predict sales trends and flag at-risk accounts automatically.',
    price: 'LKR 125,000 / yr',
    rating: 5,
    reviews: 14,
    category: 'Add-on'
  },
  {
    id: 'prod-3',
    title: 'Implementation Consultation',
    description: '40 hours of dedicated expert consultation to set up your workflow and train your core team.',
    price: 'LKR 180,000',
    rating: 5,
    reviews: 42,
    category: 'Service'
  },
  {
    id: 'prod-4',
    title: 'Vendor API Access Tier 1',
    description: 'Secure API access to integrate external marketplaces directly into your inventory layer.',
    price: 'LKR 65,000 / mo',
    rating: 3,
    reviews: 8,
    category: 'Infrastructure'
  }
];

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = mockProducts.filter((product) => 
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-400 dark:border-white/10 dark:bg-slate-950/50 dark:text-white"
              />
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10">
              <Filter className="h-4 w-4" /> Filter
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500">
              No products found matching "{searchTerm}".
            </div>
          )}
        </div>

      </section>
    </SiteShell>
  );
}
