import { BarChart3, CircleDollarSign, ShieldCheck, Sparkles, UsersRound, Workflow } from 'lucide-react';
import type { BookingSource, Restaurant, TableBooking } from '@logic-reserva/domain';
import type { DashboardLocale } from '../content';
import { bookingReports } from '../analytics';

interface ReportsViewProps {
  locale: DashboardLocale;
  restaurant: Restaurant;
  bookings: readonly TableBooking[];
  mode: 'management' | 'intelligent';
}

const SOURCE_LABELS: Record<BookingSource, { es: string; en: string }> = {
  widget: { es: 'Web directa', en: 'Direct website' },
  phone: { es: 'Teléfono', en: 'Phone' },
  walkin: { es: 'Sin reserva', en: 'Walk-in' },
  fixture: { es: 'Carga inicial', en: 'Initial data' },
};

const money = (cents: number, locale: DashboardLocale) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100);

export default function ReportsView({ locale, restaurant, bookings, mode }: ReportsViewProps) {
  const report = bookingReports(bookings, restaurant);
  const peakShift = report.shifts.reduce((peak, shift) => shift.occupancyPercent > peak.occupancyPercent ? shift : peak, report.shifts[0]!);
  const directShare = report.sources.find((source) => source.source === 'widget')?.percentage ?? 0;
  const copy = locale === 'es' ? {
    eyebrow: 'Informes', title: mode === 'intelligent' ? 'Decisiones con una base visible.' : 'Pulso de la operación.',
    body: 'Todas las cifras se calculan en el navegador a partir de la muestra ficticia visible; no existe analítica conectada.',
    occupancy: 'Ocupación por servicio', covers: 'cubiertos', capacity: 'plazas acumuladas', days: 'servicios de muestra',
    sources: 'Origen de reservas', bookings: 'reservas', direct: 'Cubiertos directos de la muestra',
    avoided: 'No-shows evitados', avoidedValue: 'reservas potenciales', avoidedLabel: 'Estimación sectorial aplicada a las reservas activas de la muestra.',
    marketplace: 'Ahorro frente a marketplace', monthly: 'al mes en la muestra', yearly: 'proyección anual',
    marketplaceLabel: 'estimación basada en tarifas publicadas por terceros', sample: 'Muestra demo · no es contabilidad real',
    lunch: 'Comida', dinner: 'Cena',
    ai: 'Asistente de decisiones', aiLabel: 'IA demostrativa · cálculo local, sin modelo conectado',
    aiPeak: 'Proteger el servicio con mayor demanda', aiPeakBody: 'Revisar capacidad, tiempos y equipo antes de abrir más inventario.',
    aiDirect: 'Consolidar el canal directo', aiDirectBody: 'Priorizar acciones que mantengan la relación y los datos en el restaurante.',
    aiNoShow: 'Anticipar riesgo de no-show', aiNoShowBody: 'Aplicar recordatorio o depósito proporcional solo a las reservas con señales de riesgo.',
    automations: 'Automatizaciones', automationLabel: 'Ejecución simulada en este navegador', active: 'Activa · demo', suggested: 'Sugerida por IA · demo',
    inventoryAutomation: 'Evento publicado → mesas fuera del widget', depositAutomation: 'Reserva sentada → depósito liberado', followupAutomation: 'Privatización pendiente → preparar seguimiento',
  } : {
    eyebrow: 'Reports', title: mode === 'intelligent' ? 'Decisions with a visible basis.' : 'Your operation at a glance.',
    body: 'Every figure is calculated in the browser from the visible fictional sample; no analytics service is connected.',
    occupancy: 'Occupancy by service', covers: 'covers', capacity: 'accumulated seats', days: 'sample services',
    sources: 'Booking sources', bookings: 'bookings', direct: 'Direct covers in the sample',
    avoided: 'Avoided no-shows', avoidedValue: 'potential bookings', avoidedLabel: 'Sector estimate applied to active bookings in the sample.',
    marketplace: 'Marketplace savings', monthly: 'per month in the sample', yearly: 'annual projection',
    marketplaceLabel: 'estimate based on third-party published fees', sample: 'Demo sample · not real accounting',
    lunch: 'Lunch', dinner: 'Dinner',
    ai: 'Decision assistant', aiLabel: 'Demo AI · local calculation, no connected model',
    aiPeak: 'Protect the highest-demand service', aiPeakBody: 'Review capacity, timing and staffing before opening more inventory.',
    aiDirect: 'Consolidate the direct channel', aiDirectBody: 'Prioritise actions that keep the relationship and data with the restaurant.',
    aiNoShow: 'Anticipate no-show risk', aiNoShowBody: 'Apply reminders or proportional deposits only to bookings with risk signals.',
    automations: 'Automations', automationLabel: 'Simulated execution in this browser', active: 'Active · demo', suggested: 'Suggested by demo AI',
    inventoryAutomation: 'Published event → tables removed from widget', depositAutomation: 'Guest seated → deposit released', followupAutomation: 'Pending private hire → prepare follow-up',
  };
  const peakLabel = peakShift.kind === 'lunch' ? copy.lunch : copy.dinner;

  return (
    <section className="rd-view" data-dashboard-view="informes" data-report-mode={mode}>
      <header className="rd-view-header"><div><p className="rd-eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.body}</p></div><span className="badge" data-tone="info">{copy.sample}</span></header>
      <div className="rd-report-grid">
        <article className="rd-report-card rd-report-card--wide" data-report-occupancy>
          <header><span><BarChart3 size={19} aria-hidden="true" /></span><h2>{copy.occupancy}</h2></header>
          <div className="rd-occupancy-list">{report.shifts.map((shift) => <section key={shift.kind} data-shift={shift.kind}><div><b>{shift.kind === 'lunch' ? copy.lunch : copy.dinner}</b><strong>{shift.occupancyPercent}%</strong></div><div className="rd-report-bar" aria-label={`${shift.occupancyPercent}%`}><span style={{ width: `${Math.min(100, shift.occupancyPercent)}%` }} /></div><p>{shift.covers} {copy.covers} · {shift.capacity} {copy.capacity} · {shift.serviceDays} {copy.days}</p></section>)}</div>
        </article>
        <article className="rd-report-card" data-report-sources>
          <header><span><UsersRound size={19} aria-hidden="true" /></span><h2>{copy.sources}</h2></header>
          <div className="rd-source-list">{report.sources.map((source) => <div key={source.source} data-source={source.source}><span><b>{SOURCE_LABELS[source.source][locale]}</b><small>{source.count} {copy.bookings}</small></span><strong>{source.percentage}%</strong></div>)}</div>
          <p className="rd-report-total"><b>{report.directCovers}</b> {copy.direct}</p>
        </article>
        {mode === 'intelligent' && <>
          <article className="rd-report-card rd-report-card--wide rd-report-card--ai" data-ai-decision-support>
            <header><span><Sparkles size={19} aria-hidden="true" /></span><div><h2>{copy.ai}</h2><small>{copy.aiLabel}</small></div></header>
            <div className="rd-decision-list">
              <section data-decision="peak"><span>01</span><div><b>{copy.aiPeak}</b><p>{peakLabel} · {peakShift.occupancyPercent}% — {copy.aiPeakBody}</p></div></section>
              <section data-decision="direct"><span>02</span><div><b>{copy.aiDirect}</b><p>{directShare}% · {copy.aiDirectBody}</p></div></section>
              <section data-decision="no-show"><span>03</span><div><b>{copy.aiNoShow}</b><p>{copy.aiNoShowBody}</p></div></section>
            </div>
          </article>
          <article className="rd-report-card rd-report-card--automation" data-automation-center>
            <header><span><Workflow size={19} aria-hidden="true" /></span><div><h2>{copy.automations}</h2><small>{copy.automationLabel}</small></div></header>
            <div className="rd-automation-list">
              <div><p>{copy.inventoryAutomation}</p><span className="badge" data-tone="success">{copy.active}</span></div>
              <div><p>{copy.depositAutomation}</p><span className="badge" data-tone="success">{copy.active}</span></div>
              <div><p>{copy.followupAutomation}</p><span className="badge" data-tone="info">{copy.suggested}</span></div>
            </div>
          </article>
          <article className="rd-report-card" data-report-no-shows>
            <header><span><ShieldCheck size={19} aria-hidden="true" /></span><h2>{copy.avoided}</h2></header>
            <strong className="rd-report-number">{new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(report.noShowsPrevented)}</strong>
            <p>{copy.avoidedValue}</p><small>{copy.avoidedLabel}</small><small>{report.noShowSavings.assumptions}</small>
          </article>
          <article className="rd-report-card rd-report-card--marketplace" data-report-marketplace>
            <header><span><CircleDollarSign size={19} aria-hidden="true" /></span><h2>{copy.marketplace}</h2></header>
            <strong className="rd-report-number">{money(report.marketplace.monthlyCents, locale)}</strong><p>{copy.monthly}</p>
            <dl><div><dt>{copy.yearly}</dt><dd>{money(report.marketplace.yearlyCents, locale)}</dd></div></dl>
            <small data-estimate-label>{copy.marketplaceLabel}</small>
          </article>
        </>}
      </div>
    </section>
  );
}
