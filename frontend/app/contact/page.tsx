import type { Metadata } from 'next';
import { CalendarClock, ChevronDown, HelpCircle, LifeBuoy, Mail, Handshake } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { PageHero, SectionHeading, cardClass, panelClass } from '@/components/marketing';

export const metadata: Metadata = {
  title: 'Contact | Ceylon IntelliBiz',
  description: 'Talk to the Ceylon IntelliBiz team about a demo, support or a partnership.'
};

const channels = [
  {
    icon: CalendarClock,
    title: 'Sales & demos',
    description: 'See the platform with your own use case in mind.',
    action: { label: 'Book a demo', href: '/contact#contact' }
  },
  {
    icon: LifeBuoy,
    title: 'Support',
    description: 'Already a customer? Ask the assistant first, or email us if you are stuck.',
    action: { label: 'Email support', href: 'mailto:hello@ceylonintellibiz.com?subject=Support' }
  },
  {
    icon: Handshake,
    title: 'Partnerships',
    description: 'Vendors, integrators and accountants who want to work with us.',
    action: { label: 'Talk partnerships', href: 'mailto:hello@ceylonintellibiz.com?subject=Partnership' }
  }
];

const faqs = [
  {
    question: 'Who is Ceylon IntelliBiz for?',
    answer: 'Small and mid-sized Sri Lankan businesses, and the teams inside larger ones, that currently run on spreadsheets and disconnected tools.'
  },
  {
    question: 'Can I look around before committing?',
    answer: 'Yes. Ask for a demo and we will walk you through a sample workspace, then set one up around your own customers and products.'
  },
  {
    question: 'Does it support LKR and Sri Lankan tax?',
    answer: 'LKR is the default currency throughout. Support for VAT, SVAT and NBT is on our roadmap rather than available today.'
  },
  {
    question: 'How does the AI assistant work?',
    answer: 'It reads your orders, invoices and stock and answers with the real figures, using transparent rules you can follow. It does not make up numbers, and it tells you when it cannot answer.'
  },
  {
    question: 'Is my data safe?',
    answer: 'Passwords are hashed, sessions expire and business data requires a login. Our Security page lists what is live and what is still planned.'
  }
];

export default function ContactPage() {
  return (
    <SiteShell
      title="Tell us what you are trying to improve."
      subtitle="Share a few details below and we will follow up with a tailored walkthrough."
      ctaLabel="Email us"
      ctaHref="mailto:hello@ceylonintellibiz.com"
    >
      <PageHero
        badge="Contact"
        badgeIcon={Mail}
        tone="blue"
        title="Let's talk about your business."
        description="Whether you want a demo, need help or have an idea for working together, the right person will pick it up."
      >
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {channels.map((channel) => {
            const Icon = channel.icon;
            return (
              <article key={channel.title} className={cardClass}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">{channel.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{channel.description}</p>
                <a href={channel.action.href} className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:text-blue-900">
                  {channel.action.label} &rarr;
                </a>
              </article>
            );
          })}
        </div>
      </PageHero>

      <section className={panelClass}>
        <SectionHeading eyebrow="FAQ" title="Quick answers" />
        <div className="mt-6 divide-y divide-slate-200 rounded-[24px] border border-slate-200 bg-white">
          {faqs.map((faq) => (
            <details key={faq.question} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-slate-900">
                <span className="flex items-center gap-2.5">
                  <HelpCircle className="h-4 w-4 text-slate-400" /> {faq.question}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 pl-[26px] text-sm leading-6 text-slate-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
