import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Clock, Fingerprint, KeyRound, Lock, ShieldCheck, ScrollText, UserCog, Users } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { PageHero, SectionHeading, cardClass, panelClass } from '@/components/marketing';

export const metadata: Metadata = {
  title: 'Security | Ceylon IntelliBiz',
  description: 'How Ceylon IntelliBiz protects accounts and business data today, and what is on the roadmap.'
};

const inPlace = [
  {
    icon: KeyRound,
    title: 'Passwords are hashed',
    description: 'Passwords are stored using BCrypt, a one-way hash designed for passwords. We cannot read them and neither can anyone who sees the database.'
  },
  {
    icon: Fingerprint,
    title: 'Signed, expiring sessions',
    description: 'Signing in issues a signed token that expires after 24 hours. Tampered or expired tokens are rejected by the API.'
  },
  {
    icon: Lock,
    title: 'Business data needs the right role',
    description: 'Customers, orders, invoices, inventory and vendors are only served to Admin, Sales and Finance users. Anyone can sign up, but new accounts start with no access until an admin assigns a role. Only the marketplace, the public assistant and the demo request form (which can be written to but not read) are open to visitors.'
  },
  {
    icon: UserCog,
    title: 'Role-based access',
    description: 'Admins manage the team. Sales and Finance can see all business data but only change their own area, and each area is enforced on the server. Role changes apply on the next request, not at the next login, and the last admin can never be removed.'
  },
  {
    icon: Users,
    title: 'Assistant respects sign-in',
    description: 'Visitors and accounts without a role get general answers only. Answers based on your workspace numbers go to users with a business role, and this is covered by automated tests.'
  },
  {
    icon: ShieldCheck,
    title: 'Restricted origins',
    description: 'The API only accepts browser requests from approved origins, and customer, order, invoice and vendor records are validated before they are saved.'
  }
];

const roadmap = [
  { title: 'Two-factor authentication', description: 'A second step at sign-in for every account.' },
  { title: 'Single sign-on', description: 'Sign in with Google or Microsoft work accounts.' },
  { title: 'Audit logging', description: 'A record of who changed what, and when.' },
  { title: 'Rate limiting', description: 'Automatic throttling of repeated or abusive requests.' },
  { title: 'Encryption at rest', description: 'Encrypted storage for databases and backups.' }
];

export default function SecurityPage() {
  return (
    <SiteShell title="Want a security walkthrough?" subtitle="Tell us what your team needs to review and we will set up a session.">
      <PageHero
        badge="Security"
        badgeIcon={ShieldCheck}
        tone="emerald"
        title="Security you can check, not just read about."
        description="This page lists what protects your account and data today, and what we are still building. We would rather be specific than impressive."
        cta={{ label: 'Read the privacy summary', href: '/privacy' }}
      />

      <section className={panelClass}>
        <SectionHeading eyebrow="In place today" title="Protections that are already live" />
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {inPlace.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className={cardClass}>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-label="Available now" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className={panelClass}>
        <SectionHeading
          eyebrow="Roadmap"
          title="Still to come"
          description="These controls are planned but not available yet. They are listed here so you know exactly where we stand."
        />
        <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roadmap.map((item) => (
            <li key={item.title} className="rounded-[24px] border border-dashed border-slate-300 bg-white p-5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                <Clock className="h-3 w-3" /> Planned
              </span>
              <h3 className="mt-3 text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={panelClass}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ScrollText className="mt-1 h-5 w-5 shrink-0 text-slate-500" />
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Found a vulnerability?</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Please email us with the details and give us a chance to fix it before sharing it publicly.</p>
            </div>
          </div>
          <a href="mailto:hello@ceylonintellibiz.com?subject=Security%20report" className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
            Report an issue
          </a>
        </div>
        <p className="mt-6 border-t border-slate-200 pt-4 text-sm text-slate-500">
          Related: <Link href="/privacy" className="font-medium text-blue-700 hover:underline">Privacy</Link> ·{' '}
          <Link href="/contact" className="font-medium text-blue-700 hover:underline">Contact</Link>
        </p>
      </section>
    </SiteShell>
  );
}
