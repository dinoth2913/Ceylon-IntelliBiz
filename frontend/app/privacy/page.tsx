import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { PageHero, panelClass } from '@/components/marketing';

export const metadata: Metadata = {
  title: 'Privacy | Ceylon IntelliBiz',
  description: 'What information Ceylon IntelliBiz collects, how it is used, and the choices you have.'
};

const sections = [
  {
    id: 'collect',
    title: 'What we collect',
    body: [
      'Account details: your username, email address and a hashed version of your password. We never store your password in plain text.',
      'Business records you enter: customers, orders, invoices, inventory items and vendors.',
      'Assistant conversations: the messages you send to the AI assistant and the replies you receive.',
      'Contact requests: the name, email, company and message you type into a demo request form.'
    ]
  },
  {
    id: 'use',
    title: 'How we use it',
    body: [
      'To sign you in and keep your workspace secure.',
      'To show your records back to you and to let the assistant answer questions about them. Answers grounded in your workspace data are only given to signed-in users.',
      'To respond when you ask about a demo or contact us.',
      'We do not sell your information and we do not use your business records for advertising.'
    ]
  },
  {
    id: 'storage',
    title: 'Where it is kept',
    body: [
      'Everything is kept in the platform database: your account, the business records you enter, demo requests and assistant conversations. Demo requests can only be read by team members with the right role, and conversations are grouped by a random conversation identifier.',
      'Read more about the protections in place on our Security page.'
    ]
  },
  {
    id: 'cookies',
    title: 'Cookies and browser storage',
    body: [
      'A sign-in cookie (intellibiz_token) lets the site keep you signed in for up to 24 hours. It is removed when you log out.',
      'Your browser also stores your session details, your light or dark theme preference and a random assistant conversation ID, so those choices are remembered on your device.',
      'We do not use advertising or cross-site tracking cookies.'
    ]
  },
  {
    id: 'rights',
    title: 'Your choices and rights',
    body: [
      'You can ask to see, correct or delete the personal information we hold about you. These rights are in line with Sri Lanka’s Personal Data Protection Act, No. 9 of 2022.',
      'You can log out at any time to clear the session stored in your browser.'
    ]
  },
  {
    id: 'retention',
    title: 'How long we keep it',
    body: ['We keep your information for as long as your account is active, and delete or anonymise it within a reasonable period after you ask us to close it, unless the law requires us to keep it longer.']
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: ['If we make material changes we will update the date at the top of this page.']
  },
  {
    id: 'contact',
    title: 'Contact us',
    body: ['Questions about privacy or a request about your information: hello@ceylonintellibiz.com.']
  }
];

export default function PrivacyPage() {
  return (
    <SiteShell title="Questions about your data?" subtitle="Tell us what you would like to know and we will get back to you.">
      <PageHero
        badge="Privacy"
        badgeIcon={FileText}
        tone="blue"
        title="Your data is yours."
        description="A plain-language summary of what Ceylon IntelliBiz collects, why, and the choices you have. Last updated 20 September 2026."
      />

      <section className={`${panelClass} grid gap-8 lg:grid-cols-[220px_1fr]`}>
        <nav aria-label="On this page" className="lg:sticky lg:top-8 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">On this page</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="block rounded-lg px-2 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                  {index + 1}. {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <article key={section.id} id={section.id} className="scroll-mt-8">
              <h2 className="text-xl font-semibold text-slate-950">
                {index + 1}. {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-base leading-7 text-slate-600">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
          <p className="border-t border-slate-200 pt-6 text-sm text-slate-500">
            See also our <Link href="/security" className="font-medium text-blue-700 hover:underline">Security</Link> practices or{' '}
            <Link href="/contact" className="font-medium text-blue-700 hover:underline">get in touch</Link>.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
