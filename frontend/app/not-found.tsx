import Link from 'next/link';
import { ArrowLeft, Compass, LayoutDashboard, ShoppingCart, Sparkles } from 'lucide-react';

const shortcuts = [
  { label: 'Home', href: '/', icon: Compass },
  { label: 'Marketplace', href: '/marketplace', icon: ShoppingCart },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Solutions', href: '/solutions', icon: Sparkles }
];

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_30%),linear-gradient(135deg,#f8fafc_0%,#eff6ff_100%)] px-4 py-12 text-slate-900">
      <div className="w-full max-w-xl rounded-[32px] border border-slate-200/80 bg-white/80 p-8 text-center shadow-[0_35px_100px_-32px_rgba(15,23,42,0.38)] backdrop-blur-xl sm:p-10">
        <p className="text-6xl font-semibold tracking-tight text-slate-950">404</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">We couldn&apos;t find that page</h1>
        <p className="mt-2 text-base leading-7 text-slate-600">The link may be out of date or the address may have a typo. Try one of these instead.</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <Link
                key={shortcut.href}
                href={shortcut.href}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Icon className="h-4 w-4 text-slate-400" /> {shortcut.label}
              </Link>
            );
          })}
        </div>

        <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900">
          <ArrowLeft className="h-4 w-4" /> Back to the home page
        </Link>
      </div>
    </main>
  );
}
