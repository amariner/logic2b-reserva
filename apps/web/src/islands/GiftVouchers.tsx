import { Gift, ShieldCheck } from 'lucide-react';
import { useRef, useState, type SyntheticEvent } from 'react';
import { voucherValue, type ExperienceVoucher, type PrivateHire, type Restaurant, type RestaurantEvent, type TableBooking } from '@logic-reserva/domain';
import {
  SOLANE_STORAGE_KEY,
  issueSolaneVoucher,
  parseSolaneStored,
  serializeSolaneState,
} from '@logic-reserva/dashboard/solane-state';
import type { Locale } from '@logic-reserva/config';
import { SOLANE_PAGE_COPY, localized } from '../data';

interface GiftVouchersProps {
  restaurant: Restaurant;
  initialBookings: TableBooking[];
  initialEvents: RestaurantEvent[];
  initialPrivateHires: PrivateHire[];
  locale?: Locale;
}

export default function GiftVouchers({ restaurant, initialBookings, initialEvents, initialPrivateHires, locale = 'es' }: GiftVouchersProps) {
  const copy = SOLANE_PAGE_COPY.vouchers;
  const experiences = restaurant.menus.filter((menu) => menu.bookableOnline);
  const [experienceId, setExperienceId] = useState(experiences[0]?.id ?? '');
  const [quantity, setQuantity] = useState(2);
  const [recipientName, setRecipientName] = useState('');
  const [issued, setIssued] = useState<ExperienceVoucher | null>(null);
  const [message, setMessage] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const experience = experiences.find((menu) => menu.id === experienceId);
  const value = voucherValue(quantity, experience?.pricePerPersonCents ?? 0);
  const money = (cents: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(cents / 100);

  const prepare = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (experience === undefined || !recipientName.trim()) {
      setMessage(localized(copy.invalid, locale));
      return;
    }
    setMessage('');
    dialog.current?.showModal();
  };

  const issue = () => {
    if (experience === undefined) return;
    const now = new Date();
    const token = now.getTime().toString(36).toUpperCase();
    const expiry = new Date(Date.UTC(now.getUTCFullYear() + 1, now.getUTCMonth(), now.getUTCDate())).toISOString().slice(0, 10);
    const voucher: ExperienceVoucher = {
      id: `solane-voucher-${token}`,
      restaurantId: restaurant.id,
      code: `SOLANE-${token}`,
      experienceId: experience.id,
      experienceName: experience.name,
      recipientName: recipientName.trim(),
      value,
      issuedAt: now.toISOString(),
      expiresOn: expiry,
      status: 'issued',
    };
    const current = parseSolaneStored(localStorage.getItem(SOLANE_STORAGE_KEY), initialBookings, initialEvents, initialPrivateHires);
    const next = issueSolaneVoucher(current, voucher);
    if (next === current) {
      setMessage(localized(copy.invalid, locale));
      dialog.current?.close();
      return;
    }
    localStorage.setItem(SOLANE_STORAGE_KEY, serializeSolaneState(next));
    setIssued(voucher);
    dialog.current?.close();
  };

  if (issued !== null) {
    return <section className="gv-success" data-voucher-success>
      <span><Gift size={28} aria-hidden="true" /></span>
      <p>{localized(copy.eyebrow, locale)}</p>
      <h2>{localized(copy.successTitle, locale)}</h2>
      <p>{localized(copy.successBody, locale)}</p>
      <dl><div><dt>{localized(copy.code, locale)}</dt><dd data-voucher-code>{issued.code}</dd></div><div><dt>{localized(copy.total, locale)}</dt><dd>{money(issued.value.totalValueCents)}</dd></div><div><dt>{localized(copy.expires, locale)}</dt><dd>{issued.expiresOn}</dd></div></dl>
      <div><a className="brand-button" href={`${locale === 'en' ? '/en' : ''}/demos/solane/gestion/?vista=bonos`}>{localized(copy.openManager, locale)}</a><button type="button" onClick={() => { setIssued(null); setRecipientName(''); }}>{localized(copy.startAgain, locale)}</button></div>
    </section>;
  }

  return <>
    <form className="gv-form" onSubmit={prepare} data-voucher-form>
      <fieldset><legend>{localized(copy.choose, locale)}</legend>{experiences.map((menu) => <label key={menu.id} className={experienceId === menu.id ? 'selected' : ''}><input type="radio" name="experience" value={menu.id} checked={experienceId === menu.id} onChange={() => setExperienceId(menu.id)} /><span><b>{menu.name}</b><small>{money(menu.pricePerPersonCents)} · {localized(copy.perPerson, locale)}</small></span><Gift size={22} aria-hidden="true" /></label>)}</fieldset>
      <div className="gv-fields"><label>{localized(copy.quantity, locale)}<select value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}>{[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count}</option>)}</select></label><label>{localized(copy.recipient, locale)}<input required maxLength={120} value={recipientName} placeholder={localized(copy.recipientPlaceholder, locale)} onChange={(event) => setRecipientName(event.target.value)} /></label></div>
      <div className="gv-summary"><span>{localized(copy.total, locale)}</span><strong data-voucher-total>{money(value.totalValueCents)}</strong><small>{quantity} × {money(value.unitValueCents)}</small></div>
      <button className="brand-button" type="submit">{localized(copy.prepare, locale)}</button>
      <p className="gv-message" role="status">{message}</p>
    </form>
    <dialog className="gv-dialog" ref={dialog} aria-labelledby="voucher-dialog-title"><form method="dialog"><ShieldCheck size={30} aria-hidden="true" /><h2 id="voucher-dialog-title">{localized(copy.gatewayTitle, locale)}</h2><p>{localized(copy.gatewayBody, locale)}</p><dl><div><dt>{experience?.name}</dt><dd>{quantity} × {money(value.unitValueCents)}</dd></div><div><dt>{localized(copy.total, locale)}</dt><dd>{money(value.totalValueCents)}</dd></div></dl><div><button type="submit" value="cancel">{localized(copy.cancel, locale)}</button><button className="brand-button" type="button" data-issue-voucher onClick={issue}>{localized(copy.issue, locale)}</button></div></form></dialog>
  </>;
}
