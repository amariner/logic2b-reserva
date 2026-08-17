import { CalendarDays, Download, Mail, NotebookText, Phone, ShieldAlert, UserRound, WalletCards } from 'lucide-react';
import { useMemo } from 'react';
import type { CustomerProfile, Restaurant, TableBooking } from '@logic-reserva/domain';
import type { DashboardLocale } from '../content';
import { buildCustomerRecords, customerRecordsToCsv } from '../analytics';

interface SolaneCustomersViewProps {
  locale: DashboardLocale;
  restaurant: Restaurant;
  bookings: readonly TableBooking[];
  profiles: readonly CustomerProfile[];
}

const timeLabel = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export default function SolaneCustomersView({ locale, restaurant, bookings, profiles }: SolaneCustomersViewProps) {
  const records = useMemo(() => buildCustomerRecords(bookings, profiles, restaurant), [bookings, profiles, restaurant]);
  const copy = locale === 'es' ? {
    eyebrow: 'CRM de comensales', title: 'Recordar bien también es servicio.', body: 'Histórico, gasto y preferencias proceden solo de los fixtures y reservas de esta demo local.',
    export: 'Exportar CSV de la muestra', exportHelp: 'Descarga real · sin red · datos ficticios', history: 'Histórico', spend: 'Gasto acumulado',
    allergies: 'Alergias', noAllergies: 'Sin alergias registradas', notes: 'Notas de sala', noNotes: 'Sin notas registradas',
    bookings: 'reservas', covers: 'cubiertos', noHistory: 'Sin reservas todavía',
  } : {
    eyebrow: 'Guest CRM', title: 'Remembering well is part of service.', body: 'History, spend and preferences come only from the fixtures and bookings in this local demo.',
    export: 'Export sample CSV', exportHelp: 'Real download · no network · fictional data', history: 'History', spend: 'Accumulated spend',
    allergies: 'Allergies', noAllergies: 'No allergies recorded', notes: 'Floor notes', noNotes: 'No notes recorded',
    bookings: 'bookings', covers: 'covers', noHistory: 'No bookings yet',
  };

  const download = () => {
    const blob = new Blob([customerRecordsToCsv(records)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `solane-clientes-demo-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <section className="rd-view" data-dashboard-view="clientes">
      <header className="rd-view-header"><div><p className="rd-eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.body}</p></div><button className="rd-primary-action rd-export-action" type="button" data-export-customers onClick={download}><Download size={16} aria-hidden="true" /><span><b>{copy.export}</b><small>{copy.exportHelp}</small></span></button></header>
      <div className="rd-crm-grid" data-customer-list>{records.map((record) => {
        const covers = record.bookings.reduce((sum, booking) => sum + booking.partySize, 0);
        return <article className="rd-crm-card" key={record.key} data-customer-key={record.key}>
          <header><span className="rd-avatar"><UserRound size={17} aria-hidden="true" /></span><div><h2>{record.guest.name}</h2><p>{record.guest.email && <span><Mail size={13} aria-hidden="true" />{record.guest.email}</span>}{record.guest.phone && <span><Phone size={13} aria-hidden="true" />{record.guest.phone}</span>}</p></div></header>
          <div className="rd-crm-stats"><div><CalendarDays size={15} aria-hidden="true" /><span><b>{record.bookings.length}</b>{copy.bookings}</span></div><div><UserRound size={15} aria-hidden="true" /><span><b>{covers}</b>{copy.covers}</span></div><div><WalletCards size={15} aria-hidden="true" /><span><b>{new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(record.spendCents / 100)}</b>{copy.spend}</span></div></div>
          <div className="rd-crm-context"><section data-customer-allergies><h3><ShieldAlert size={15} aria-hidden="true" />{copy.allergies}</h3><p>{record.allergies.length === 0 ? copy.noAllergies : record.allergies.join(' · ')}</p></section><section data-customer-notes><h3><NotebookText size={15} aria-hidden="true" />{copy.notes}</h3><p>{record.floorNotes || copy.noNotes}</p></section></div>
          <section className="rd-crm-history" data-customer-history><h3>{copy.history}</h3>{record.bookings.length === 0 ? <p>{copy.noHistory}</p> : <ol>{record.bookings.slice(0, 4).map((booking) => <li key={booking.id}><time>{booking.slot.date} · {timeLabel(booking.slot.startMin)}</time><span>{booking.partySize} {copy.covers} · {booking.status}</span></li>)}</ol>}</section>
        </article>;
      })}</div>
    </section>
  );
}
