// Shared between the public marketplace pages and the dashboard's product management page.

export type BackendProduct = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  reviewCount: number;
  features: string[] | null;
  createdAt: string | null;
};

export type BackendReview = {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string | null;
};

/** Full, non-abbreviated LKR formatting for a storefront (unlike lib/dashboard-data's K/M summaries). */
export function formatPrice(amount: number): string {
  return `LKR ${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export function formatReviewDate(iso: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}
