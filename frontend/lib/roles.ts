// Mirrors the access rules in the backend's SecurityConfig. The UI uses this only to hide what a
// user can't use; the backend is what actually enforces it.

export const ROLES = ['ADMIN', 'SALES', 'FINANCE', 'STAFF'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  SALES: 'Sales',
  FINANCE: 'Finance',
  STAFF: 'Staff (no access yet)'
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: 'Full access, including managing the team and assigning roles.',
  SALES: 'Sees all business data. Manages customers, orders, inventory, vendors and demo requests.',
  FINANCE: 'Sees all business data. Manages invoices and billing.',
  STAFF: 'No access to business data yet. An admin needs to assign a role.'
};

const BUSINESS_ROLES: readonly string[] = ['ADMIN', 'SALES', 'FINANCE'];

export function normaliseRole(role: string | null | undefined): string {
  return (role ?? '').trim().toUpperCase();
}

export function hasBusinessAccess(role: string | null | undefined): boolean {
  return BUSINESS_ROLES.includes(normaliseRole(role));
}

type WritableArea = 'customers' | 'orders' | 'inventory' | 'vendors' | 'invoices';

const WRITERS: Record<WritableArea, readonly string[]> = {
  customers: ['ADMIN', 'SALES'],
  orders: ['ADMIN', 'SALES'],
  inventory: ['ADMIN', 'SALES'],
  vendors: ['ADMIN', 'SALES'],
  invoices: ['ADMIN', 'FINANCE']
};

export function canWrite(area: WritableArea, role: string | null | undefined): boolean {
  return WRITERS[area].includes(normaliseRole(role));
}

/** Which roles may open a dashboard page. Settings is open to everyone signed in. */
export function allowedRolesFor(pathname: string): readonly string[] | 'everyone' {
  if (pathname.startsWith('/dashboard/settings')) return 'everyone';
  if (pathname.startsWith('/dashboard/team')) return ['ADMIN'];
  if (pathname.startsWith('/dashboard/leads')) return ['ADMIN', 'SALES'];
  return BUSINESS_ROLES;
}

export function canViewRoute(pathname: string, role: string | null | undefined): boolean {
  const allowed = allowedRolesFor(pathname);
  return allowed === 'everyone' || allowed.includes(normaliseRole(role));
}

export function roleLabel(role: string | null | undefined): string {
  const key = normaliseRole(role) as Role;
  return ROLE_LABELS[key] ?? (role || '—');
}
