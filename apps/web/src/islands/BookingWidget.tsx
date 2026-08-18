import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import {
  estimateDurationMin,
  seatingTimes,
  tableAvailability,
  type Restaurant,
  type ServiceKind,
  type TableBooking,
} from '@logic-reserva/domain';
import {
  VEDRA_STORAGE_KEY,
  parseVedraStored,
  serializeVedraState,
  upsertVedraBooking,
} from '@logic-reserva/dashboard/state';
import type { Locale } from '@logic-reserva/config';
import { DEMO_DATE, VEDRA_PAGE_COPY, localized } from '../data';

interface BookingWidgetProps {
  restaurant: Restaurant;
  initialBookings: TableBooking[];
  locale?: Locale;
}

const timeLabel = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export default function BookingWidget({ restaurant, initialBookings, locale = 'es' }: BookingWidgetProps) {
  const copy = VEDRA_PAGE_COPY.widget;
  const menuCopy = VEDRA_PAGE_COPY.menus;
  const [bookings, setBookings] = useState<TableBooking[]>(initialBookings);
  const [step, setStep] = useState(0);
  const [date, setDate] = useState(DEMO_DATE);
  const [service, setService] = useState<ServiceKind>('lunch');
  const [partySize, setPartySize] = useState(2);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [menuId, setMenuId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [confirmed, setConfirmed] = useState<TableBooking | null>(null);

  useEffect(() => {
    try {
      setBookings(parseVedraStored(localStorage.getItem(VEDRA_STORAGE_KEY), initialBookings).bookings);
    } catch {
      setBookings(initialBookings);
    }
  }, [initialBookings]);

  const durationMin = estimateDurationMin(partySize);
  const available = useMemo(() => {
    const shift = restaurant.shifts.find((candidate) => candidate.kind === service);
    if (shift === undefined) return [];
    return seatingTimes(shift).map((time) => {
      const options = tableAvailability(restaurant, bookings, [], [], { date, startMin: time, durationMin }, partySize);
      return { time, options };
    }).filter((candidate) => candidate.options.length > 0);
  }, [bookings, date, durationMin, partySize, restaurant, service]);

  const resetSelection = () => {
    setSelectedTime(null);
    setMessage('');
  };

  const continueStep = () => {
    if (step === 1 && selectedTime === null) {
      setMessage(localized(copy.invalid, locale));
      return;
    }
    setMessage('');
    setStep((current) => Math.min(3, current + 1));
  };

  const saveJourney = (booking: TableBooking) => {
    try {
      const current = parseVedraStored(localStorage.getItem(VEDRA_STORAGE_KEY), initialBookings);
      const next = upsertVedraBooking(current, booking);
      localStorage.setItem(VEDRA_STORAGE_KEY, serializeVedraState(next));
      setBookings(next.bookings);
      setConfirmed(booking);
    } catch {
      setMessage(localized(copy.invalid, locale));
    }
  };

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selected = available.find((candidate) => candidate.time === selectedTime)?.options[0];
    if (selectedTime === null || selected === undefined || !name.trim() || !email.includes('@')) {
      setMessage(localized(copy.invalid, locale));
      return;
    }
    saveJourney({
      id: `vedra-web-${Date.now()}`,
      restaurantId: restaurant.id,
      tableIds: [...selected.tableIds],
      slot: { date, startMin: selectedTime, durationMin },
      partySize,
      status: 'confirmed',
      guest: { name: name.trim(), email: email.trim(), ...(phone.trim() ? { phone: phone.trim() } : {}) },
      ...(menuId ? { menuId } : {}),
      source: 'widget',
      bookedAt: new Date().toISOString(),
    });
  };

  const restart = () => {
    setStep(0);
    setSelectedTime(null);
    setMenuId('');
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
    setConfirmed(null);
  };

  if (confirmed !== null) {
    return (
      <section className="vw-success" data-booking-success>
        <span className="vw-success__mark" aria-hidden="true">✓</span>
        <p className="vw-eyebrow">{localized(copy.demo, locale)}</p>
        <h3>{localized(copy.successTitle, locale)}</h3>
        <p>{localized(copy.successBody, locale)}</p>
        <dl>
          <div><dt>{localized(copy.date, locale)}</dt><dd>{confirmed.slot.date}</dd></div>
          <div><dt>{localized(copy.chooseTime, locale)}</dt><dd>{timeLabel(confirmed.slot.startMin)}</dd></div>
          <div><dt>{localized(copy.partySize, locale)}</dt><dd>{confirmed.partySize}</dd></div>
        </dl>
        <div className="vw-success__actions">
          <a className="vw-button" href="/demos/vedra/gestion/?vista=servicio">{localized(copy.openManager, locale)}</a>
          <button className="vw-button vw-button--ghost" type="button" onClick={restart}>{localized(copy.startAgain, locale)}</button>
        </div>
      </section>
    );
  }

  return (
    <form className="vw-widget" data-booking-widget onSubmit={submit} noValidate>
      <p className="vw-demo-label">{localized(copy.demo, locale)}</p>
      <ol className="vw-steps">
        {copy.steps.map((label, index) => (
          <li key={label.es} className={index === step ? 'active' : index < step ? 'complete' : ''} aria-current={index === step ? 'step' : undefined}>
            <span>{index < step ? '✓' : index + 1}</span><b>{localized(label, locale)}</b>
          </li>
        ))}
      </ol>

      <div className="vw-panel">
        {step === 0 && (
          <fieldset>
            <legend>{localized(copy.steps[0], locale)}</legend>
            <div className="vw-fields">
              <label>{localized(copy.date, locale)}<input name="date" type="date" value={date} onChange={(event) => { setDate(event.target.value); resetSelection(); }} required /></label>
              <label>{localized(copy.service, locale)}<select name="service" value={service} onChange={(event) => { setService(event.target.value as ServiceKind); resetSelection(); }}><option value="lunch">{localized(copy.lunch, locale)}</option><option value="dinner">{localized(copy.dinner, locale)}</option></select></label>
              <label>{localized(copy.partySize, locale)}<select name="partySize" value={partySize} onChange={(event) => { setPartySize(Number(event.target.value)); resetSelection(); }}>{Array.from({ length: 12 }, (_, index) => index + 1).map((people) => <option key={people} value={people}>{people}</option>)}</select></label>
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <fieldset>
            <legend>{localized(copy.chooseTime, locale)}</legend>
            {available.length === 0 ? <p className="vw-empty">{localized(copy.noAvailability, locale)}</p> : (
              <div className="vw-times">{available.map(({ time, options }) => <button key={time} type="button" className={selectedTime === time ? 'selected' : ''} onClick={() => { setSelectedTime(time); setMessage(''); }}><b>{timeLabel(time)}</b><small>{options[0].tableIds.length > 1 ? `${options[0].tableIds.length} ${localized(copy.tables, locale)}` : `1 ${localized(copy.table, locale)}`}</small></button>)}</div>
            )}
          </fieldset>
        )}

        {step === 2 && (
          <fieldset>
            <legend>{localized(copy.chooseMenu, locale)} <small>{localized(copy.optional, locale)}</small></legend>
            <div className="vw-menu-list">
              <label className={!menuId ? 'selected' : ''}><input type="radio" name="menuId" value="" checked={!menuId} onChange={() => setMenuId('')} /><span><b>{localized(copy.noMenu, locale)}</b></span></label>
              {restaurant.menus.map((menu) => {
                const item = menuCopy.items.find((candidate) => candidate.id === menu.id);
                return <label key={menu.id} className={menuId === menu.id ? 'selected' : ''}><input type="radio" name="menuId" value={menu.id} checked={menuId === menu.id} onChange={() => setMenuId(menu.id)} /><span><b>{item ? localized(item.label, locale) : menu.name}</b><small>{new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(menu.pricePerPersonCents / 100)} · {localized(menuCopy.perPerson, locale)}</small></span></label>;
              })}
            </div>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset>
            <legend>{localized(copy.steps[3], locale)}</legend>
            <div className="vw-fields">
              <label>{localized(copy.name, locale)}<input name="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required /></label>
              <label>{localized(copy.email, locale)}<input name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={200} required /></label>
              <label>{localized(copy.phone, locale)}<input name="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} /></label>
            </div>
          </fieldset>
        )}
      </div>

      <p className="vw-message" role="status">{message}</p>
      <div className="vw-actions">
        {step > 0 && <button className="vw-button vw-button--ghost" type="button" onClick={() => { setMessage(''); setStep((current) => current - 1); }}>{localized(copy.previous, locale)}</button>}
        {step < 3 ? <button className="vw-button" type="button" onClick={continueStep}>{localized(copy.next, locale)}</button> : <button className="vw-button" type="submit">{localized(copy.confirm, locale)}</button>}
      </div>
    </form>
  );
}
