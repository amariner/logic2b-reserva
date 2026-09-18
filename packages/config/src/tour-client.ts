import type { Locale } from './index';
import { TOUR_STORAGE_KEY, requestedTourStep, tourContactUrl, tourContext, tourCopy, tourStepAtLocation, tourSteps, tourStepUrl } from './tour';

interface TourState {
  status: 'idle' | 'active' | 'complete';
  stepIndex: number;
  collapsed: boolean;
  origin: string;
  context: string;
}

export function initCommercialTour() {
  const dock = document.querySelector<HTMLElement>('[data-tour-dock]');
  if (!dock || dock.dataset.initialized) return;
  dock.dataset.initialized = 'true';
  dock.toggleAttribute('data-operational', window.location.pathname.includes('/gestion/'));
  const locale: Locale = document.documentElement.lang === 'en' ? 'en' : 'es';
  const copy = tourCopy(locale);
  const steps = tourSteps(locale);
  const intro = document.querySelector<HTMLDialogElement>('[data-commercial-tour-intro]');
  const start = intro?.querySelector<HTMLAnchorElement>('[data-tour-start]');
  const fallback: TourState = { status: 'idle', stepIndex: 0, collapsed: false, origin: locale === 'en' ? '/en/' : '/', context: 'theme=vedra' };
  const readState = (): TourState => {
    try {
      const parsed: unknown = JSON.parse(sessionStorage.getItem(TOUR_STORAGE_KEY) ?? 'null');
      if (!parsed || typeof parsed !== 'object') return { ...fallback };
      const candidate = parsed as Partial<TourState>;
      if (!['idle', 'active', 'complete'].includes(candidate.status ?? '') || !Number.isInteger(candidate.stepIndex) || (candidate.stepIndex ?? -1) < 0 || (candidate.stepIndex ?? 4) >= steps.length) return { ...fallback };
      const origin = typeof candidate.origin === 'string' ? new URL(candidate.origin, window.location.origin) : null;
      return {
        status: candidate.status as TourState['status'], stepIndex: candidate.stepIndex!, collapsed: candidate.collapsed === true,
        origin: origin?.origin === window.location.origin ? `${origin.pathname}${origin.search}${origin.hash}` : fallback.origin,
        context: typeof candidate.context === 'string' ? tourContactUrl(locale, candidate.context).split('?')[1] : fallback.context,
      };
    } catch { return { ...fallback }; }
  };
  let state = readState();
  let opener: HTMLElement | null = null;
  let storageAvailable = true;
  const persist = () => { try { sessionStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(state)); } catch { storageAvailable = false; } };
  persist();
  const stepUrl = (index: number) => tourStepUrl(steps[index], storageAvailable ? undefined : state.context);
  const hasExplicitContext = (url: URL) => ['theme', 'panel', 'plan'].some((key) => url.searchParams.has(key))
    || /^\/(?:en\/)?(?:temas|paneles)\/[^/]+\/$/.test(url.pathname);
  const safeOrigin = (url: URL) => {
    const search = new URLSearchParams();
    for (const key of ['theme', 'panel', 'plan', 'vista']) {
      const value = url.searchParams.get(key);
      if (value && /^[a-z0-9-]{1,50}$/.test(value)) search.set(key, value);
    }
    const hash = /^#[a-z][a-z0-9_-]*$/i.test(url.hash) ? url.hash : '';
    return `${url.pathname}${search.size ? `?${search}` : ''}${hash}`;
  };
  const cleanTourUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('recorrido');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  };
  const title = dock.querySelector<HTMLElement>('[data-tour-title]');
  const body = dock.querySelector<HTMLElement>('[data-tour-body]');
  const eyebrow = dock.querySelector<HTMLElement>('[data-tour-eyebrow]');
  const content = dock.querySelector<HTMLElement>('[data-tour-content]');
  const previous = dock.querySelector<HTMLButtonElement>('[data-tour-back]');
  const next = dock.querySelector<HTMLAnchorElement>('[data-tour-next]');
  const nextText = dock.querySelector<HTMLElement>('[data-tour-next-text]');
  const toggle = dock.querySelector<HTMLButtonElement>('[data-tour-toggle]');
  const returnLink = dock.querySelector<HTMLAnchorElement>('[data-tour-return]');
  const contactLink = dock.querySelector<HTMLAnchorElement>('[data-tour-contact]');
  const planLinks = [...document.querySelectorAll<HTMLAnchorElement>('a[href*="/empezar/?plan="]')].map((link) => ({ link, href: link.getAttribute('href')! }));
  const segments = [...dock.querySelectorAll<HTMLButtonElement>('[data-tour-jump]')];
  const collapse = (collapsed: boolean) => {
    state.collapsed = collapsed;
    dock.toggleAttribute('data-collapsed', collapsed);
    if (content) content.hidden = collapsed;
    toggle?.setAttribute('aria-expanded', String(!collapsed));
    toggle?.setAttribute('aria-label', collapsed ? copy.expand : copy.collapse);
    if (toggle) toggle.textContent = collapsed ? '+' : '−';
    persist();
  };
  const showStep = (index: number, focus = false) => {
    const step = steps[index];
    if (!step) return;
    state.status = 'active';
    state.stepIndex = index;
    if (title) title.textContent = step.title;
    if (body) body.textContent = step.body;
    if (eyebrow) eyebrow.textContent = `${index + 1} / ${steps.length} · ${step.label}`;
    if (previous) previous.hidden = index === 0;
    if (nextText) nextText.textContent = step.next;
    if (next) next.href = index === steps.length - 1 ? tourContactUrl(locale, state.context) : stepUrl(index + 1);
    if (returnLink) { returnLink.href = state.origin; returnLink.hidden = index !== steps.length - 1; }
    if (contactLink) { contactLink.href = tourContactUrl(locale, state.context); contactLink.hidden = index === steps.length - 1; }
    planLinks.forEach(({ link, href }) => {
      const plan = new URL(href, window.location.origin).searchParams.get('plan');
      const context = new URLSearchParams(state.context);
      if (plan) context.set('plan', plan);
      link.href = tourContactUrl(locale, context.toString());
    });
    segments.forEach((segment, segmentIndex) => {
      segment.setAttribute('aria-current', segmentIndex === index ? 'step' : 'false');
      segment.toggleAttribute('data-complete', segmentIndex < index);
    });
    dock.hidden = false;
    collapse(state.collapsed);
    if (focus) requestAnimationFrame(() => (state.collapsed ? toggle : title)?.focus({ preventScroll: true }));
  };
  const scrollToHash = () => {
    if (!window.location.hash) return;
    try {
      const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    } catch { /* An invalid fragment must not interrupt the journey. */ }
  };
  const exitTour = () => {
    state.status = 'idle';
    persist();
    planLinks.forEach(({ link, href }) => { link.href = href; });
    cleanTourUrl();
    dock.hidden = true;
    if (intro?.open) intro.close();
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  };
  const showIntro = (trigger?: HTMLElement) => {
    if (!intro) return;
    opener = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const current = new URL(window.location.href);
    if (state.status !== 'active' || (hasExplicitContext(current) && tourContext(current) !== state.context)) {
      // Keep only navigation context, never email or other form data.
      state = { ...fallback, origin: safeOrigin(current), context: tourContext(current) };
    }
    if (start) { start.href = stepUrl(state.stepIndex); start.querySelector('[data-tour-start-text]')!.textContent = state.status === 'active' ? copy.resume : copy.start; }
    dock.hidden = true;
    if (!intro.open) intro.showModal();
  };
  const navigateTo = (index: number) => {
    const step = steps[index];
    if (!step) return;
    state.status = 'active';
    state.stepIndex = index;
    persist();
    window.location.assign(stepUrl(index));
  };

  document.querySelectorAll<HTMLElement>('[data-tour-trigger], [data-camp-tour-trigger]').forEach((trigger) => trigger.addEventListener('click', (event) => {
    if (event instanceof MouseEvent && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)) return;
    event.preventDefault(); showIntro(trigger);
  }));
  start?.addEventListener('click', () => { state.status = 'active'; persist(); });
  intro?.querySelectorAll<HTMLElement>('[data-tour-exit], [data-tour-explore]').forEach((button) => button.addEventListener('click', exitTour));
  intro?.addEventListener('cancel', (event) => { event.preventDefault(); exitTour(); });
  intro?.addEventListener('click', (event) => {
    if (event.target !== intro) return;
    const rect = intro.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) exitTour();
  });
  dock.querySelector<HTMLElement>('[data-tour-exit]')?.addEventListener('click', exitTour);
  toggle?.addEventListener('click', () => collapse(!state.collapsed));
  previous?.addEventListener('click', () => navigateTo(state.stepIndex - 1));
  next?.addEventListener('click', () => {
    if (state.stepIndex === steps.length - 1) state.status = 'complete';
    else state.stepIndex += 1;
    persist();
  });
  contactLink?.addEventListener('click', () => { state.status = 'complete'; persist(); });
  planLinks.forEach(({ link }) => link.addEventListener('click', () => { if (state.status === 'active') { state.status = 'complete'; persist(); } }));
  returnLink?.addEventListener('click', () => { state.status = 'idle'; persist(); });
  segments.forEach((segment) => segment.addEventListener('click', () => navigateTo(Number(segment.dataset.tourJump))));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !dock.hidden && !document.querySelector('dialog[open]')) exitTour();
  });
  const restore = (focus = false) => {
    const url = new URL(window.location.href);
    const request = url.searchParams.get('recorrido');
    const requested = requestedTourStep(request);
    if (request === 'intro') { cleanTourUrl(); showIntro(); return; }
    if (requested !== null) {
      if (state.status !== 'active' || hasExplicitContext(url)) {
        const context = tourContext(url);
        if (state.status !== 'active' || context !== state.context) state.origin = safeOrigin(url);
        state.context = context;
      }
      // Canonicalise old numbered steps as well as mismatched copied URLs.
      if (tourStepAtLocation(url) !== requested) {
        state.status = 'active';
        state.stepIndex = requested;
        persist();
        window.location.replace(stepUrl(requested));
        return;
      }
      // With blocked storage the URL remains the only source for reload/back.
      if (storageAvailable) cleanTourUrl();
      showStep(requested, focus); scrollToHash(); return;
    }
    const current = tourStepAtLocation(url);
    if (state.status === 'active' && current !== null) showStep(current);
    else dock.hidden = true;
  };
  window.addEventListener('pageshow', (event) => { if (event.persisted) { state = readState(); restore(); } });
  window.addEventListener('hashchange', () => { restore(); scrollToHash(); });
  restore(true);
}
