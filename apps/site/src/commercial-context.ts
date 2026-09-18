import { COMMERCIAL_PLANS } from '@logic-reserva/config/commercial';
import { getPanel } from '@logic-reserva/config/panels';
import { getTheme } from '@logic-reserva/config/themes';

export function commercialDetailInterest(url: URL): { kind: 'theme' | 'panel'; slug: string } | null {
  const match = url.pathname.match(/^\/(?:en\/)?(temas|paneles)\/([^/]+)\/$/);
  if (!match) return null;
  if (match[1] === 'temas' && getTheme(match[2])) return { kind: 'theme', slug: match[2] };
  if (match[1] === 'paneles' && getPanel(match[2])) return { kind: 'panel', slug: match[2] };
  return null;
}

export function preserveDetailContactPlan(): void {
  const current = new URL(window.location.href);
  const interest = commercialDetailInterest(current);
  const plan = COMMERCIAL_PLANS.find(({ slug }) => slug === current.searchParams.get('plan'));
  if (!interest || !plan) return;

  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
    const destination = new URL(link.href, current.origin);
    if (destination.origin !== current.origin || !/^\/(?:en\/)?empezar\/$/.test(destination.pathname)) return;
    const otherKind = interest.kind === 'theme' ? 'panel' : 'theme';
    if (destination.searchParams.has(otherKind)) return;
    const destinationSlug = destination.searchParams.get(interest.kind);
    const opensCurrentRequest = link.hasAttribute('data-project-request-open') && !destinationSlug;
    if (destinationSlug !== interest.slug && !opensCurrentRequest) return;
    destination.searchParams.set(interest.kind, interest.slug);
    destination.searchParams.set('plan', plan.slug);
    link.href = `${destination.pathname}${destination.search}${destination.hash}`;
  });
}
