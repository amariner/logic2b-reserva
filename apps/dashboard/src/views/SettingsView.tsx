import { Clock3, LayoutGrid, UtensilsCrossed } from 'lucide-react';
import type { Restaurant } from '@logic-reserva/domain';
import { DASHBOARD_COPY, dashboardText, type DashboardLocale } from '../content';

interface SettingsViewProps {
  locale: DashboardLocale;
  restaurant: Restaurant;
}

const timeLabel = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export default function SettingsView({ locale, restaurant }: SettingsViewProps) {
  const copy = DASHBOARD_COPY.settings;
  const service = DASHBOARD_COPY.service;
  const price = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  return (
    <section className="rd-view" data-dashboard-view="ajustes">
      <header className="rd-view-header"><div><p className="rd-eyebrow">{dashboardText(copy.eyebrow, locale)}</p><h1>{dashboardText(copy.title, locale)}</h1><p>{dashboardText(copy.body, locale)}</p></div><span className="badge" data-tone="info">{dashboardText(copy.maturity, locale)}</span></header>
      <div className="rd-settings-grid">
        <section className="rd-setting-card"><header><Clock3 size={20} aria-hidden="true" /><h2>{dashboardText(copy.shifts, locale)}</h2></header><div>{restaurant.shifts.map((shift) => <article key={shift.id}><h3>{dashboardText(shift.kind === 'lunch' ? service.lunch : service.dinner, locale)}</h3><dl><div><dt>{dashboardText(copy.firstSeating, locale)}</dt><dd>{timeLabel(shift.firstSeatingMin)}</dd></div><div><dt>{dashboardText(copy.lastSeating, locale)}</dt><dd>{timeLabel(shift.lastSeatingMin)}</dd></div></dl></article>)}</div></section>
        <section className="rd-setting-card"><header><LayoutGrid size={20} aria-hidden="true" /><h2>{dashboardText(copy.spaces, locale)}</h2></header><div>{restaurant.spaces.map((space) => <article key={space.id}><h3>{space.name}</h3><p>{space.tables.length} {dashboardText(copy.tables, locale)}</p><span className="badge" data-tone={space.privatizable ? 'success' : 'warning'}>{dashboardText(space.privatizable ? copy.privatizable : copy.notPrivatizable, locale)}</span></article>)}</div></section>
        <section className="rd-setting-card"><header><UtensilsCrossed size={20} aria-hidden="true" /><h2>{dashboardText(copy.menus, locale)}</h2></header><div>{restaurant.menus.map((menu) => <article key={menu.id}><h3>{menu.name}</h3><p>{price.format(menu.pricePerPersonCents / 100)}</p><span className="badge" data-tone={menu.bookableOnline ? 'success' : 'warning'}>{dashboardText(menu.bookableOnline ? copy.online : copy.offline, locale)}</span></article>)}</div></section>
      </div>
    </section>
  );
}
