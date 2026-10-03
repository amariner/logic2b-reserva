import { RotateCcw, Search } from 'lucide-react';
import { useId } from 'react';
import { Button } from '@logic-reserva/ui/button';
import type { BookingSource, BookingStatus, Restaurant } from '@logic-reserva/domain';
import { INITIAL_BOOKING_FILTERS, type BookingFilters } from '../booking-filters';
import { DASHBOARD_COPY, dashboardText, type DashboardLocale } from '../content';

interface ReservationFiltersProps {
  locale: DashboardLocale;
  restaurant: Restaurant;
  filters: BookingFilters;
  onChange: (filters: BookingFilters) => void;
  resultCount: number;
  totalCount: number;
}

const STATUSES: readonly BookingStatus[] = ['pending', 'confirmed', 'seated', 'finished', 'no_show', 'cancelled'];
const SOURCES: readonly BookingSource[] = ['widget', 'phone', 'walkin', 'fixture'];

export default function ReservationFilters({ locale, restaurant, filters, onChange, resultCount, totalCount }: ReservationFiltersProps) {
  const id = useId();
  const copy = DASHBOARD_COPY.reservationFilters;
  const text = (value: { readonly es: string; readonly en: string }) => dashboardText(value, locale);
  const changed = Object.keys(INITIAL_BOOKING_FILTERS).some((key) => filters[key as keyof BookingFilters] !== INITIAL_BOOKING_FILTERS[key as keyof BookingFilters]);
  const resultLabel = text(copy.results).replace('{count}', String(resultCount)).replace('{total}', String(totalCount));

  return (
    <section className="rd-reservation-filters" aria-label={text(copy.label)} data-reservation-filters>
      <div className="rd-reservation-filters__fields">
        <label className="rd-reservation-filters__search" htmlFor={`${id}-query`}>
          <span><Search size={15} aria-hidden="true" />{text(copy.search)}</span>
          <input id={`${id}-query`} name="booking-query" type="search" value={filters.query} placeholder={text(copy.searchPlaceholder)} onChange={(event) => onChange({ ...filters, query: event.target.value })} />
        </label>
        <label htmlFor={`${id}-date`}>
          <span>{text(copy.date)}</span>
          <input id={`${id}-date`} name="booking-date-filter" type="date" value={filters.date} aria-describedby={`${id}-date-hint`} onChange={(event) => onChange({ ...filters, date: event.target.value })} />
          <small id={`${id}-date-hint`}>{text(copy.dateHint)}</small>
        </label>
        <label htmlFor={`${id}-service`}>
          <span>{text(copy.service)}</span>
          <select id={`${id}-service`} name="booking-service-filter" value={filters.service} onChange={(event) => onChange({ ...filters, service: event.target.value as BookingFilters['service'] })}>
            <option value="all">{text(copy.allServices)}</option>
            {(['lunch', 'dinner'] as const).filter((kind) => restaurant.shifts.some((shift) => shift.kind === kind)).map((kind) => <option key={kind} value={kind}>{text(DASHBOARD_COPY.service[kind])}</option>)}
          </select>
        </label>
        <label htmlFor={`${id}-status`}>
          <span>{text(copy.status)}</span>
          <select id={`${id}-status`} name="booking-status-filter" value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value as BookingFilters['status'] })}>
            <option value="all">{text(copy.allStatuses)}</option>
            <option value="active">{text(DASHBOARD_COPY.reservations.active)}</option>
            <option value="closed">{text(DASHBOARD_COPY.reservations.closed)}</option>
            {STATUSES.map((status) => <option key={status} value={status}>{text(DASHBOARD_COPY.status[status])}</option>)}
          </select>
        </label>
        <label htmlFor={`${id}-source`}>
          <span>{text(copy.source)}</span>
          <select id={`${id}-source`} name="booking-source-filter" value={filters.source} onChange={(event) => onChange({ ...filters, source: event.target.value as BookingFilters['source'] })}>
            <option value="all">{text(copy.allSources)}</option>
            {SOURCES.map((source) => <option key={source} value={source}>{text(DASHBOARD_COPY.source[source])}</option>)}
          </select>
        </label>
      </div>
      <div className="rd-reservation-filters__footer">
        <p aria-live="polite" aria-atomic="true" data-reservation-results>{resultLabel}</p>
        <Button type="button" variant="outline" disabled={!changed} onClick={() => onChange({ ...INITIAL_BOOKING_FILTERS })} data-clear-reservation-filters><RotateCcw size={15} aria-hidden="true" />{text(copy.clear)}</Button>
      </div>
      {resultCount === 0 && totalCount > 0 && <p className="rd-reservation-filters__empty">{text(copy.emptyHelp)}</p>}
    </section>
  );
}
