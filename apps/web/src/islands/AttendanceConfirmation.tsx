import { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, RefreshCw, UsersRound } from 'lucide-react';
import type { AttendanceConfirmationResponse, PrivateHire, RestaurantEvent, TableBooking } from '@logic-reserva/domain';
import {
  SOLANE_STORAGE_KEY,
  parseSolaneStored,
  respondSolaneAttendanceConfirmation,
  serializeSolaneState,
} from '@logic-reserva/dashboard/solane-state';

interface AttendanceConfirmationProps {
  locale: 'es' | 'en';
  restaurantName: string;
  initialBookings: TableBooking[];
  initialEvents: RestaurantEvent[];
  initialPrivateHires: PrivateHire[];
}

type ReadyView = { kind: 'ready'; booking: TableBooking; reference: string };
type View = { kind: 'loading' } | { kind: 'invalid' } | ReadyView | { kind: 'ack'; response: Exclude<AttendanceConfirmationResponse, 'expired'> };

export default function AttendanceConfirmation({ locale, restaurantName, initialBookings, initialEvents, initialPrivateHires }: AttendanceConfirmationProps) {
  const [view, setView] = useState<View>({ kind: 'loading' });
  const copy = locale === 'es' ? {
    eyebrow: 'Confirmación local · demo', title: '¿Nos acompañas?', body: 'Este enlace se ha preparado en tu navegador y no se ha enviado por WhatsApp, correo ni ningún servicio externo.',
    date: 'Fecha', time: 'Hora', party: 'Grupo', guests: 'personas', confirm: 'Confirmar asistencia', change: 'Solicitar un cambio',
    privacy: 'Solo mostramos los datos imprescindibles de la reserva. No se muestra ningún nombre, correo ni teléfono.',
    invalidTitle: 'Este enlace ya no está disponible.', invalidBody: 'Puede ser desconocido, haber caducado o haberse respondido anteriormente. Por seguridad no mostramos datos de la reserva.',
    ackConfirmed: 'Asistencia confirmada.', ackChange: 'Cambio solicitado.', ackBody: 'La respuesta ha quedado guardada en esta demo local. El restaurante podrá verla en el gestor; no se ha enviado ninguna notificación.',
  } : {
    eyebrow: 'Local confirmation · demo', title: 'Will you be joining us?', body: 'This link was prepared in your browser and was not sent through WhatsApp, email or any external service.',
    date: 'Date', time: 'Time', party: 'Party', guests: 'guests', confirm: 'Confirm attendance', change: 'Request a change',
    privacy: 'Only the minimum booking details are shown. No name, email address or phone number is displayed.',
    invalidTitle: 'This link is no longer available.', invalidBody: 'It may be unknown, expired or previously answered. For safety, no booking details are shown.',
    ackConfirmed: 'Attendance confirmed.', ackChange: 'Change requested.', ackBody: 'The response was saved in this local demo. The restaurant can see it in the workspace; no notification was sent.',
  };

  useEffect(() => {
    const reference = new URL(window.location.href).searchParams.get('ref') ?? '';
    const state = parseSolaneStored(localStorage.getItem(SOLANE_STORAGE_KEY), initialBookings, initialEvents, initialPrivateHires);
    const confirmation = state.attendanceConfirmations.find((candidate) => candidate.reference === reference);
    if (confirmation === undefined || confirmation.status !== 'prepared') {
      setView({ kind: 'invalid' });
      return;
    }
    const booking = state.bookings.find((candidate) => candidate.id === confirmation.bookingId);
    if (booking === undefined || !['pending', 'confirmed'].includes(booking.status)) {
      setView({ kind: 'invalid' });
      return;
    }
    const now = new Date().toISOString();
    if (Date.parse(now) >= Date.parse(confirmation.expiresAt)) {
      const expired = respondSolaneAttendanceConfirmation(state, reference, 'expired', now);
      if (expired !== state) localStorage.setItem(SOLANE_STORAGE_KEY, serializeSolaneState(expired));
      setView({ kind: 'invalid' });
      return;
    }
    setView({ kind: 'ready', booking, reference });
  }, [initialBookings, initialEvents, initialPrivateHires]);

  const answer = (response: Exclude<AttendanceConfirmationResponse, 'expired'>) => {
    if (view.kind !== 'ready') return;
    const state = parseSolaneStored(localStorage.getItem(SOLANE_STORAGE_KEY), initialBookings, initialEvents, initialPrivateHires);
    const next = respondSolaneAttendanceConfirmation(state, view.reference, response, new Date().toISOString());
    const resolved = next.attendanceConfirmations.find((candidate) => candidate.reference === view.reference);
    if (next === state || resolved?.status !== response) {
      if (next !== state) localStorage.setItem(SOLANE_STORAGE_KEY, serializeSolaneState(next));
      setView({ kind: 'invalid' });
      return;
    }
    localStorage.setItem(SOLANE_STORAGE_KEY, serializeSolaneState(next));
    setView({ kind: 'ack', response });
  };

  if (view.kind === 'loading') return <section className="attendance-card attendance-card--message" aria-busy="true"><RefreshCw aria-hidden="true" /><p>{locale === 'es' ? 'Comprobando enlace…' : 'Checking link…'}</p></section>;
  if (view.kind === 'invalid') return <section className="attendance-card attendance-card--message" data-attendance-invalid><span className="attendance-mark">S</span><h1>{copy.invalidTitle}</h1><p>{copy.invalidBody}</p></section>;
  if (view.kind === 'ack') return <section className="attendance-card attendance-card--message" data-attendance-ack={view.response}><CheckCircle2 size={44} aria-hidden="true" /><h1>{view.response === 'attendance_confirmed' ? copy.ackConfirmed : copy.ackChange}</h1><p>{copy.ackBody}</p></section>;

  const time = `${String(Math.floor(view.booking.slot.startMin / 60)).padStart(2, '0')}:${String(view.booking.slot.startMin % 60).padStart(2, '0')}`;
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${view.booking.slot.date}T00:00:00.000Z`));
  return <section className="attendance-card" data-attendance-ready>
    <header><span className="attendance-mark">S</span><div><p>{copy.eyebrow}</p><h1>{copy.title}</h1></div></header>
    <p className="attendance-intro">{copy.body}</p>
    <dl><div><dt><CalendarDays size={16} aria-hidden="true" />{copy.date}</dt><dd>{date}</dd></div><div><dt><Clock3 size={16} aria-hidden="true" />{copy.time}</dt><dd>{time}</dd></div><div><dt><UsersRound size={16} aria-hidden="true" />{copy.party}</dt><dd>{view.booking.partySize} {copy.guests}</dd></div></dl>
    <p className="attendance-restaurant">{restaurantName}</p>
    <div className="attendance-actions"><button type="button" data-attendance-response="attendance_confirmed" onClick={() => answer('attendance_confirmed')}>{copy.confirm}</button><button type="button" className="secondary" data-attendance-response="change_requested" onClick={() => answer('change_requested')}>{copy.change}</button></div>
    <small>{copy.privacy}</small>
  </section>;
}
