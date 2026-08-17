import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import {
  depositFor,
  estimateDurationMin,
  riskTier,
  seatingTimes,
  tableAvailability,
  type DepositPolicy,
  type PrivateHire,
  type Restaurant,
  type RestaurantEvent,
  type RiskTier,
  type TableBooking,
} from '@logic-reserva/domain';
import {
  SOLANE_STORAGE_KEY,
  parseSolaneStored,
  serializeSolaneState,
  upsertSolaneBooking,
  type SolaneDemoState,
} from '@logic-reserva/dashboard/solane-state';
import type { Locale } from '@logic-reserva/config';
import { DEMO_DATE, SOLANE_PAGE_COPY, localized } from '../data';

interface SolaneBookingWidgetProps {
  restaurant: Restaurant;
  initialBookings: TableBooking[];
  initialEvents: RestaurantEvent[];
  initialPrivateHires: PrivateHire[];
  locale?: Locale;
}

const timeLabel = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const DEMO_TODAY = new Date('2026-08-17T00:00:00Z');
const DEPOSIT_POLICIES: Record<RiskTier, DepositPolicy> = {
  low: { kind: 'none', menuPercentageBps: 0 },
  medium: { kind: 'card_hold', menuPercentageBps: 2500 },
  high: { kind: 'prepay', menuPercentageBps: 5000 },
};

export default function SolaneBookingWidget({ restaurant, initialBookings, initialEvents, initialPrivateHires, locale = 'es' }: SolaneBookingWidgetProps) {
  const copy = SOLANE_PAGE_COPY.widget;
  const managerHref = `${locale === 'en' ? '/en' : ''}/demos/solane/gestion/?vista=reservas`;
  const [demoState, setDemoState] = useState<SolaneDemoState>(() => parseSolaneStored(null, initialBookings, initialEvents, initialPrivateHires));
  const [step, setStep] = useState(0);
  const [date, setDate] = useState(DEMO_DATE);
  const [partySize, setPartySize] = useState(2);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [menuId, setMenuId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [confirmed, setConfirmed] = useState<TableBooking | null>(null);
  const [termsAcceptedAt, setTermsAcceptedAt] = useState('');
  const [pendingBooking, setPendingBooking] = useState<TableBooking | null>(null);
  const gateway = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setDemoState(parseSolaneStored(localStorage.getItem(SOLANE_STORAGE_KEY), initialBookings, initialEvents, initialPrivateHires));
  }, [initialBookings, initialEvents, initialPrivateHires]);

  const durationMin = estimateDurationMin(partySize);
  const selectedMenu = restaurant.menus.find((menu) => menu.id === menuId);
  const leadDays = Math.max(0, Math.floor((new Date(`${date}T00:00:00Z`).getTime() - DEMO_TODAY.getTime()) / 86_400_000));
  const isFridayNight = new Date(`${date}T00:00:00Z`).getUTCDay() === 5 && (selectedTime ?? 0) >= 1200;
  const calculatedRisk = riskTier({ partySize, isPeakSlot: isFridayNight, hasHistory: false, leadDays });
  const depositPolicy = DEPOSIT_POLICIES[calculatedRisk];
  const depositBreakdown = selectedMenu === undefined ? undefined : depositFor(depositPolicy, partySize, selectedMenu.pricePerPersonCents);
  const money = (cents: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(cents / 100);
  const available = useMemo(() => {
    const shift = restaurant.shifts.find((candidate) => candidate.kind === 'dinner');
    if (shift === undefined) return [];
    return seatingTimes(shift).map((time) => {
      const options = tableAvailability(restaurant, demoState.bookings, demoState.events, demoState.privateHires, { date, startMin: time, durationMin }, partySize);
      const tableIds = [...new Set(options.flatMap((option) => option.tableIds))];
      return { time, options, tableIds };
    }).filter((candidate) => candidate.options.length > 0);
  }, [date, demoState.bookings, demoState.events, demoState.privateHires, durationMin, partySize, restaurant]);

  const resetSelection = () => {
    setSelectedTime(null);
    setMessage('');
    setTermsAcceptedAt('');
  };

  const continueStep = () => {
    if ((step === 1 && selectedTime === null) || (step === 2 && !menuId)) {
      setMessage(localized(copy.invalid, locale));
      return;
    }
    setMessage('');
    setStep((current) => Math.min(3, current + 1));
  };

  const saveJourney = (booking: TableBooking) => {
    const current = parseSolaneStored(localStorage.getItem(SOLANE_STORAGE_KEY), initialBookings, initialEvents, initialPrivateHires);
    const next = upsertSolaneBooking(current, booking);
    localStorage.setItem(SOLANE_STORAGE_KEY, serializeSolaneState(next));
    setDemoState(next);
    setConfirmed(booking);
  };

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selected = available.find((candidate) => candidate.time === selectedTime)?.options[0];
    if (selectedTime === null || selected === undefined || !menuId || selectedMenu === undefined || depositBreakdown === undefined || !name.trim() || !email.includes('@')) {
      setMessage(localized(copy.invalid, locale));
      return;
    }
    if (depositBreakdown.amountCents > 0 && !termsAcceptedAt) {
      setMessage(localized(copy.deposit.required, locale));
      return;
    }
    const booking: TableBooking = {
      id: `solane-web-${Date.now()}`,
      restaurantId: restaurant.id,
      tableIds: [...selected.tableIds],
      slot: { date, startMin: selectedTime, durationMin },
      partySize,
      status: 'confirmed',
      guest: { name: name.trim(), email: email.trim(), ...(phone.trim() ? { phone: phone.trim() } : {}) },
      menuId,
      ...(depositBreakdown.amountCents === 0 ? {} : { deposit: { id: `solane-deposit-${Date.now()}`, breakdown: { ...depositBreakdown }, termsAcceptedAt, status: 'held' as const } }),
      source: 'widget',
    };
    if (booking.deposit === undefined) {
      saveJourney(booking);
      return;
    }
    setPendingBooking(booking);
    setMessage('');
    gateway.current?.showModal();
  };

  const confirmGateway = () => {
    if (pendingBooking === null) return;
    gateway.current?.close();
    saveJourney(pendingBooking);
    setPendingBooking(null);
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
    setTermsAcceptedAt('');
    setPendingBooking(null);
  };

  if (confirmed !== null) {
    return (
      <section className="vw-success" data-solane-booking-success>
        <span className="vw-success__mark" aria-hidden="true">✓</span>
        <p className="vw-eyebrow">{localized(copy.demo, locale)}</p>
        <h3>{localized(copy.successTitle, locale)}</h3>
        <p>{localized(copy.successBody, locale)}</p>
        <dl><div><dt>{localized(copy.date, locale)}</dt><dd>{confirmed.slot.date}</dd></div><div><dt>{localized(copy.chooseTime, locale)}</dt><dd>{timeLabel(confirmed.slot.startMin)}</dd></div><div><dt>{localized(copy.partySize, locale)}</dt><dd>{confirmed.partySize}</dd></div>{confirmed.deposit && <div><dt>{localized(copy.deposit.amount, locale)}</dt><dd data-confirmed-deposit>{money(confirmed.deposit.breakdown.amountCents)} · {localized(copy.deposit.held, locale)}</dd></div>}</dl>
        <div className="vw-success__actions"><a className="vw-button" href={managerHref}>{localized(copy.openManager, locale)}</a><button className="vw-button vw-button--ghost" type="button" onClick={restart}>{localized(copy.startAgain, locale)}</button></div>
      </section>
    );
  }

  return (
    <form className="vw-widget sw-widget" data-solane-booking-widget onSubmit={submit} noValidate>
      <p className="vw-demo-label">{localized(copy.demo, locale)}</p>
      <ol className="vw-steps">{copy.steps.map((label, index) => <li key={label.es} className={index === step ? 'active' : index < step ? 'complete' : ''} aria-current={index === step ? 'step' : undefined}><span>{index < step ? '✓' : index + 1}</span><b>{localized(label, locale)}</b></li>)}</ol>
      <div className="vw-panel">
        {step === 0 && <fieldset><legend>{localized(copy.steps[0], locale)}</legend><div className="vw-fields"><label>{localized(copy.date, locale)}<input name="date" type="date" value={date} onChange={(event) => { setDate(event.target.value); resetSelection(); }} required /></label><label>{localized(copy.partySize, locale)}<select name="partySize" value={partySize} onChange={(event) => { setPartySize(Number(event.target.value)); resetSelection(); }}>{Array.from({ length: 8 }, (_, index) => index + 1).map((people) => <option key={people} value={people}>{people}</option>)}</select></label></div></fieldset>}
        {step === 1 && <fieldset><legend>{localized(copy.chooseTime, locale)}</legend>{available.length === 0 ? <p className="vw-empty">{localized(copy.noAvailability, locale)}</p> : <div className="vw-times">{available.map(({ time, tableIds }) => <button key={time} type="button" data-time={timeLabel(time)} data-available-tables={tableIds.join(',')} className={selectedTime === time ? 'selected' : ''} onClick={() => { setSelectedTime(time); setTermsAcceptedAt(''); setMessage(''); }}><b>{timeLabel(time)}</b><small>{tableIds.length} {localized(copy.freeTables, locale)}</small></button>)}</div>}</fieldset>}
        {step === 2 && <fieldset><legend>{localized(copy.chooseMenu, locale)}</legend><div className="vw-menu-list">{restaurant.menus.filter((menu) => menu.bookableOnline).map((menu) => { const menuCopy = SOLANE_PAGE_COPY.intro.menus.find((candidate) => candidate.id === menu.id); return <label key={menu.id} className={menuId === menu.id ? 'selected' : ''}><input type="radio" name="menuId" value={menu.id} checked={menuId === menu.id} onChange={() => { setMenuId(menu.id); setTermsAcceptedAt(''); }} /><span><b>{menuCopy ? localized(menuCopy.label, locale) : menu.name}</b><small>{money(menu.pricePerPersonCents)} · {localized(copy.perPerson, locale)}</small></span></label>; })}</div>{depositBreakdown && <section className="sw-deposit" data-deposit-breakdown data-risk-tier={calculatedRisk}><header><div><p>{localized(copy.deposit.eyebrow, locale)}</p><h3>{localized(copy.deposit.title, locale)}</h3></div><span>{localized(copy.deposit.tier[calculatedRisk], locale)}</span></header><div className="sw-risk-signals"><span>{localized(copy.deposit.signalParty, locale)} · {partySize}</span>{isFridayNight && <span>{localized(copy.deposit.signalPeak, locale)}</span>}<span>{localized(copy.deposit.signalHistory, locale)}</span></div><dl><div><dt>{localized(copy.deposit.subtotal, locale)}</dt><dd>{money(depositBreakdown.menuSubtotalCents)}</dd></div><div><dt>{localized(copy.deposit.percentage, locale)}</dt><dd>{depositBreakdown.percentageBps / 100}%</dd></div><div><dt>{localized(copy.deposit.amount, locale)}</dt><dd data-deposit-amount>{money(depositBreakdown.amountCents)}</dd></div></dl><p>{localized(copy.deposit.policy, locale)} · {localized(depositPolicy.kind === 'prepay' ? copy.deposit.policyPrepay : depositPolicy.kind === 'card_hold' ? copy.deposit.policyHold : copy.deposit.policyNone, locale)}</p></section>}</fieldset>}
        {step === 3 && <fieldset><legend>{localized(copy.steps[3], locale)}</legend><div className="vw-fields"><label>{localized(copy.name, locale)}<input name="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required /></label><label>{localized(copy.email, locale)}<input name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={200} required /></label><label>{localized(copy.phone, locale)}<input name="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} /></label></div>{depositBreakdown && depositBreakdown.amountCents > 0 && <section className="sw-terms"><label><input name="depositTerms" type="checkbox" checked={Boolean(termsAcceptedAt)} onChange={(changeEvent) => { setTermsAcceptedAt(changeEvent.target.checked ? new Date().toISOString() : ''); setMessage(''); }} /><span>{localized(copy.deposit.terms, locale)}</span></label>{termsAcceptedAt && <p>{localized(copy.deposit.acceptedAt, locale)}: <time data-terms-accepted-at dateTime={termsAcceptedAt}>{new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(termsAcceptedAt))}</time></p>}</section>}</fieldset>}
      </div>
      <p className="vw-message" role="status">{message}</p>
      <div className="vw-actions">{step > 0 && <button className="vw-button vw-button--ghost" type="button" onClick={() => { setMessage(''); setStep((current) => current - 1); }}>{localized(copy.previous, locale)}</button>}{step < 3 ? <button className="vw-button" type="button" onClick={continueStep}>{localized(copy.next, locale)}</button> : <button className="vw-button" type="submit">{localized(copy.confirm, locale)}</button>}</div>
      <dialog className="sw-gateway" ref={gateway} aria-labelledby="solane-gateway-title" data-deposit-gateway><div><p>{localized(copy.demo, locale)}</p><h3 id="solane-gateway-title">{localized(copy.deposit.gatewayTitle, locale)}</h3><p>{localized(copy.deposit.gatewayBody, locale)}</p><dl><dt>{localized(copy.deposit.gatewayAmount, locale)}</dt><dd>{pendingBooking?.deposit ? money(pendingBooking.deposit.breakdown.amountCents) : '—'}</dd></dl><div><button className="vw-button vw-button--ghost" type="button" onClick={() => { gateway.current?.close(); setPendingBooking(null); }}>{localized(copy.deposit.gatewayCancel, locale)}</button><button className="vw-button" type="button" data-confirm-deposit onClick={confirmGateway}>{localized(copy.deposit.gatewayConfirm, locale)}</button></div></div></dialog>
    </form>
  );
}
