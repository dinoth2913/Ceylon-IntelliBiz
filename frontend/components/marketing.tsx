import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';

export const panelClass =
  'rounded-[32px] border border-slate-200/80 bg-white/80 p-6 shadow-[0_35px_100px_-32px_rgba(15,23,42,0.38)] backdrop-blur-xl sm:p-8';

export const cardClass = 'rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm';

const tones = {
  violet: 'border-violet-200 bg-violet-50 text-violet-700',
  pink: 'border-pink-200 bg-pink-50 text-pink-700',
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  slate: 'border-slate-200 bg-slate-100 text-slate-700'
} as const;

export type Tone = keyof typeof tones;

export function Badge({ icon: Icon, tone = 'blue', children }: { icon?: LucideIcon; tone?: Tone; children: React.ReactNode }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${tones[tone]}`}>
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </div>
  );
}

type PageHeroProps = {
  badge: string;
  badgeIcon?: LucideIcon;
  tone?: Tone;
  title: string;
  description: string;
  cta?: { label: string; href: string };
  children?: React.ReactNode;
};

export function PageHero({ badge, badgeIcon, tone, title, description, cta, children }: PageHeroProps) {
  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-4">
          <Badge icon={badgeIcon} tone={tone}>
            {badge}
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">{title}</h1>
          <p className="text-lg leading-8 text-slate-600">{description}</p>
        </div>
        {cta && (
          <Link href={cta.href} className="inline-flex items-center gap-2 self-start rounded-full bg-slate-950 px-5 py-3 font-medium text-white transition hover:bg-slate-800 lg:self-auto">
            {cta.label} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function SectionHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="max-w-2xl">
      {eyebrow && <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">{eyebrow}</p>}
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
      {description && <p className="mt-2 text-base leading-7 text-slate-600">{description}</p>}
    </div>
  );
}
