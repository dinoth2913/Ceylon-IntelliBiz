'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { StarRating } from './star-rating';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  id: string;
  title: string;
  description: string;
  price: string;
  rating: number;
  reviews: number;
  category: string;
  className?: string;
}

export function ProductCard({ id, title, description, price, rating, reviews, category, className }: ProductCardProps) {
  return (
    <div className={cn('group flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white/70 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-slate-900/60', className)}>
      <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800">
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          <span className="text-sm font-medium text-slate-400 dark:text-slate-500">{category} image placeholder</span>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            {category}
          </span>
          <div className="flex items-center gap-1.5">
            <StarRating initialRating={rating} readonly className="scale-75" />
            <span className="text-xs text-slate-500">({reviews})</span>
          </div>
        </div>

        <Link href={`/marketplace/${id}`} className="mt-3 block flex-1">
          <h3 className="text-lg font-semibold text-slate-900 transition group-hover:text-cyan-600 dark:text-white dark:group-hover:text-cyan-400">
            {title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
            {description}
          </p>
        </Link>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/5">
          <p className="text-xl font-bold text-slate-900 dark:text-white">{price}</p>
          <Link 
            href={`/marketplace/${id}`}
            className="flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <ShoppingCart className="h-4 w-4" /> View details
          </Link>
        </div>
      </div>
    </div>
  );
}
