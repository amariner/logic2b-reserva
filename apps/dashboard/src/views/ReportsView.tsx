import { BarChart3, CircleDollarSign, ScanSearch, ShieldCheck, Sparkles, UsersRound, Workflow } from 'lucide-react';
import type { BookingSource, NoShowSignalCode, NoShowSuggestedAction, Restaurant, RiskTier, TableBooking } from '@logic-reserva/domain';
import type { DashboardLocale } from '../content';
import { bookingReports, noShowRiskAssessments } from '../analytics';

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

const RISK_LABELS: Record<RiskTier, { es: string; en: string }> = {
  low: { es: 'Prioridad baja', en: 'Low priority' },
  medium: { es: 'Prioridad media', en: 'Medium priority' },
  high: { es: 'Prioridad alta', en: 'High priority' },
};

const ACTION_LABELS: Record<NoShowSuggestedAction, { es: string; en: string }> = {
  standard_confirmation: { es: 'Mantener confirmación estándar', en: 'Keep standard confirmation' },
  confirm_24h: { es: 'Revisar confirmación 24 h antes', en: 'Review confirmation 24h before' },
  manual_review: { es: 'Revisión manual prioritaria', en: 'Priority manual review' },
};

const SIGNAL_LABELS: Record<NoShowSignalCode, { es: string; en: string }> = {
  baseline: { es: 'Base operativa', en: 'Operational baseline' },
  channel_direct: { es: 'Canal web directo', en: 'Direct website channel' },
  channel_phone: { es: 'Canal telefónico', en: 'Phone channel' },
  channel_walkin: { es: 'Cliente ya presente', en: 'Guest already present' },
  channel_fixture: { es: 'Canal de muestra sin ajuste', en: 'Sample channel without adjustment' },
  history_first_visit: { es: 'Sin asistencias anteriores', en: 'No previous attendance' },
  history_repeat_attendance: { es: 'Asistencia anterior verificada', en: 'Verified previous attendance' },
  history_previous_no_show: { es: 'No-show anterior en la muestra', en: 'Previous no-show in the sample' },
  party_large: { es: 'Grupo de 6 o más', en: 'Party of 6 or more' },
  party_standard: { es: 'Tamaño de grupo estándar', en: 'Standard party size' },
  lead_short: { es: 'Reserva con 1 día o menos', en: 'Booked 1 day or less ahead' },
  lead_long: { es: 'Reserva con 21 días o más', en: 'Booked 21 days or more ahead' },
  lead_standard: { es: 'Antelación intermedia', en: 'Mid-range lead time' },
  lead_unknown: { es: 'Antelación no disponible', en: 'Lead time unavailable' },
  slot_peak: { es: 'Franja de mayor demanda', en: 'Peak-demand slot' },
  slot_off_peak: { es: 'Fuera de franja pico', en: 'Outside peak slot' },
};

const money = (cents: number, locale: DashboardLocale) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100);

export default function ReportsView({ locale, restaurant, bookings, mode }: ReportsViewProps) {
  const report = bookingReports(bookings, restaurant);
  const operationalDate = [...bookings].filter((booking) => booking.status === 'pending' || booking.status === 'confirmed').map((booking) => booking.slot.date).sort().at(-1) ?? '';
  const riskAssessments = mode === 'intelligent' && operationalDate ? noShowRiskAssessments(bookings, restaurant, operationalDate) : [];
  const peakShift = report.shifts.reduce((peak, shift) => shift.occupancyPercent > peak.occupancyPercent ? shift : peak, report.shifts[0]!);
  const directShare = report.sources.find((source) => source.source === 'widget')?.percentage ?? 0;
  const copy = locale === 'es' ? {
    eyebrow: 'Informes', title: mode === 'intelligent' ? 'Decisiones con una base visible.' : 'Pulso de la operación.',
    body: 'Todas las cifras se calculan en el navegador a partir de la muestra ficticia visible; no existe analítica conectada.',
    occupancy: 'Ocupación por servicio', covers: 'cubiertos', capacity: 'plazas acumuladas', days: 'servicios de muestra',
    sources: 'Origen de reservas', bookings: 'reservas', direct: 'Cubiertos directos de la muestra',
    avoided: 'Exposición estimada a no-show', avoidedValue: 'reservas en el escenario', avoidedLabel: 'Escenario sectorial aplicado a las reservas activas de esta muestra ficticia; no son no-shows observados ni evitados.',
    marketplace: 'Coste comparativo hipotético', monthly: 'para los cubiertos directos de esta muestra', yearly: 'misma muestra × 12 · no es un año real',
    marketplaceLabel: 'Supuesto editable: 3,00 €/cubierto; no es una tarifa atribuida ni un periodo mensual real.', sample: 'Muestra demo · no es contabilidad real',
    lunch: 'Comida', dinner: 'Cena',
    ai: 'Asistente de decisiones', aiLabel: 'IA demostrativa · cálculo local, sin modelo conectado',
    aiPeak: 'Proteger el servicio con mayor demanda', aiPeakBody: 'Revisar capacidad, tiempos y equipo antes de abrir más inventario.',
    aiDirect: 'Consolidar el canal directo', aiDirectBody: 'Priorizar acciones que mantengan la relación y los datos en el restaurante.',
    aiNoShow: 'Anticipar riesgo de no-show', aiNoShowBody: 'Revisar manualmente recordatorios o la regla ficticia de depósito para reservas con señales de riesgo.',
    riskTitle: 'Revisión de no-show explicable', riskIntro: 'Orden operativo reproducible a partir de la muestra local. El score 0–100 no es una probabilidad ni decide por el equipo.',
    riskBasis: 'Reglas demo · sin modelo conectado', riskScore: 'Score operativo', riskLead: 'Antelación', riskHistory: 'Histórico anterior',
    riskDays: 'días', riskVisits: 'asistencias', riskNoShows: 'no-shows', riskSignals: 'Señales y contribución', riskAction: 'Sugerencia, sin ejecución automática', riskEmpty: 'No hay reservas activas para evaluar en el día operativo.',
    automations: 'Automatizaciones', automationLabel: 'Ejecución simulada en este navegador', active: 'Activa · demo', suggested: 'Sugerida por IA · demo',
    inventoryAutomation: 'Evento publicado → mesas fuera del widget', depositAutomation: 'Reserva sentada → depósito liberado', followupAutomation: 'Privatización pendiente → preparar seguimiento',
  } : {
    eyebrow: 'Reports', title: mode === 'intelligent' ? 'Decisions with a visible basis.' : 'Your operation at a glance.',
    body: 'Every figure is calculated in the browser from the visible fictional sample; no analytics service is connected.',
    occupancy: 'Occupancy by service', covers: 'covers', capacity: 'accumulated seats', days: 'sample services',
    sources: 'Booking sources', bookings: 'bookings', direct: 'Direct covers in the sample',
    avoided: 'Estimated no-show exposure', avoidedValue: 'bookings in the scenario', avoidedLabel: 'Sector scenario applied to active bookings in this fictional sample; these are neither observed nor avoided no-shows.',
    marketplace: 'Hypothetical comparison cost', monthly: 'for direct covers in this sample', yearly: 'same sample × 12 · not a real year',
    marketplaceLabel: 'Editable assumption: €3.00/cover; not an attributed fee or a real monthly period.', sample: 'Demo sample · not real accounting',
    lunch: 'Lunch', dinner: 'Dinner',
    ai: 'Decision assistant', aiLabel: 'Demo AI · local calculation, no connected model',
    aiPeak: 'Protect the highest-demand service', aiPeakBody: 'Review capacity, timing and staffing before opening more inventory.',
    aiDirect: 'Consolidate the direct channel', aiDirectBody: 'Prioritise actions that keep the relationship and data with the restaurant.',
    aiNoShow: 'Anticipate no-show risk', aiNoShowBody: 'Manually review reminders or the fictional deposit rule for bookings with risk signals.',
    riskTitle: 'Explainable no-show review', riskIntro: 'Reproducible operational order from the local sample. The 0–100 score is not a probability and never decides for the team.',
    riskBasis: 'Demo rules · no connected model', riskScore: 'Operational score', riskLead: 'Lead time', riskHistory: 'Previous history',
    riskDays: 'days', riskVisits: 'attendances', riskNoShows: 'no-shows', riskSignals: 'Signals and contribution', riskAction: 'Suggestion, without automatic execution', riskEmpty: 'There are no active bookings to assess on the operational day.',
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
          <article className="rd-report-card rd-report-card--wide rd-risk-board" data-no-show-risk-board data-risk-basis="deterministic-demo">
            <header><span><ScanSearch size={19} aria-hidden="true" /></span><div><h2>{copy.riskTitle}</h2><small>{copy.riskBasis}</small></div></header>
            <p className="rd-risk-intro">{copy.riskIntro}</p>
            {riskAssessments.length === 0 ? <p className="rd-empty">{copy.riskEmpty}</p> : <div className="rd-risk-list">{riskAssessments.map((assessment) => {
              const recommendation = assessment.recommendation;
              return <section className="rd-risk-card" key={assessment.booking.id} data-risk-booking={assessment.booking.id} data-risk-tier={recommendation.tier}>
                <header><div><h3>{assessment.booking.guest.name}</h3><p>{assessment.booking.slot.date} · {String(Math.floor(assessment.booking.slot.startMin / 60)).padStart(2, '0')}:{String(assessment.booking.slot.startMin % 60).padStart(2, '0')} · {assessment.booking.partySize} {copy.covers}</p></div><span className="badge" data-tone={recommendation.tier === 'high' ? 'danger' : recommendation.tier === 'medium' ? 'warning' : 'success'}>{RISK_LABELS[recommendation.tier][locale]}</span></header>
                <dl><div><dt>{copy.riskScore}</dt><dd data-risk-score>{recommendation.operationalScore}/100</dd></div><div><dt>{copy.riskLead}</dt><dd>{assessment.leadDays === null ? '—' : `${assessment.leadDays} ${copy.riskDays}`}</dd></div><div><dt>{copy.riskHistory}</dt><dd>{assessment.previousAttended} {copy.riskVisits} · {assessment.previousNoShows} {copy.riskNoShows}</dd></div><div><dt>{SOURCE_LABELS[assessment.booking.source][locale]}</dt><dd>{assessment.isPeakSlot ? SIGNAL_LABELS.slot_peak[locale] : SIGNAL_LABELS.slot_off_peak[locale]}</dd></div></dl>
                <h4>{copy.riskSignals}</h4><ul>{recommendation.signals.map((signal) => <li key={signal.code} data-risk-signal={signal.code}><span>{SIGNAL_LABELS[signal.code][locale]}</span><b>{signal.points > 0 ? `+${signal.points}` : signal.points}</b></li>)}</ul>
                <footer><span>{copy.riskAction}</span><b data-risk-action={recommendation.suggestedAction}>{ACTION_LABELS[recommendation.suggestedAction][locale]}</b></footer>
              </section>;
            })}</div>}
          </article>
          <article className="rd-report-card" data-report-no-shows>
            <header><span><ShieldCheck size={19} aria-hidden="true" /></span><h2>{copy.avoided}</h2></header>
            <strong className="rd-report-number">{new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(report.noShowsPrevented)}</strong>
            <p>{copy.avoidedValue}</p><small>{copy.avoidedLabel}</small>
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
