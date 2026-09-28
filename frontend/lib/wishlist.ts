// A per-visitor wishlist for the public marketplace. Stored in the browser only — there's no customer
// account system in this app (marketplace buyers aren't signed in), so this can't live on the server the
// way it would for a signed-in shopper. It never leaves this browser and is never seen by Claude or by us.

export type WishlistItem = { id: string; title: string; price: number; category: string };

const STORAGE_KEY = 'intellibiz-wishlist';

function readAll(): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: WishlistItem[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage can be blocked (private browsing, cleared site data) — the wishlist just won't persist.
  }
}

export function getWishlist(): WishlistItem[] {
  return readAll();
}

export function isWishlisted(id: string): boolean {
  return readAll().some((item) => item.id === id);
}

/** Adds or removes the item and returns whether it's now saved (true) or removed (false). */
export function toggleWishlist(item: WishlistItem): boolean {
  const items = readAll();
  const alreadySaved = items.some((existing) => existing.id === item.id);
  writeAll(alreadySaved ? items.filter((existing) => existing.id !== item.id) : [item, ...items]);
  return !alreadySaved;
}

export function removeFromWishlist(id: string) {
  writeAll(readAll().filter((item) => item.id !== id));
}
