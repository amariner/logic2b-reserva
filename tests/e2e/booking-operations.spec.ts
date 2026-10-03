import { expect, test, type Page } from '@playwright/test';
import type { TableBooking } from '@logic-reserva/domain';

type Brand = 'vedra' | 'solane';
type Locale = 'es' | 'en';

const BOOKING_DATE = '2026-10-05';
const PHONE = '+34 (612) 345-678';
const pathFor = (brand: Brand, locale: Locale, view = 'reservas') => `${locale === 'en' ? '/en' : ''}/demos/${brand}/gestion/?vista=${view}`;
const storageKey = (brand: Brand) => `logic-reserva-demo-${brand}-v1`;
const timeLabel = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

function observeBrowser(page: Page) {
  const writes: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(`${request.method()} ${request.url()}`);
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  return { writes, errors };
}

async function storedBookings(page: Page, brand: Brand): Promise<TableBooking[]> {
  return page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? '{}') as { bookings?: TableBooking[] };
    return state.bookings ?? [];
  }, storageKey(brand));
}

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
}

async function enterPhoneBooking(page: Page, brand: Brand, locale: Locale) {
  const name = `Ángela Núñez ${brand} ${locale}`;
  const email = `angela.${brand}.${locale}@example.test`;
  await page.locator('[data-new-booking]').click();
  const form = page.locator('[data-manual-booking-form]');
  await expect(form).toBeVisible();
  await expect(form.locator('[name="guestName"]')).toBeFocused();
  await form.locator('[name="guestName"]').fill(name);
  await form.locator('[name="phone"]').fill(PHONE);
  await form.locator('[name="email"]').fill(email);
  await form.locator('[name="date"]').fill(BOOKING_DATE);
  await form.locator('[name="partySize"]').fill('3');

  const shiftValue = await form.locator('select[name="shift"]').evaluate((element) => (element as HTMLSelectElement).options[0]?.value ?? '');
  expect(shiftValue).not.toBe('');
  await form.locator('select[name="shift"]').selectOption(shiftValue);
  const startTime = await form.locator('select[name="time"]').evaluate((element) => (element as HTMLSelectElement).options[1]?.value ?? '');
  expect(startTime).not.toBe('');
  await form.locator('select[name="time"]').selectOption(startTime);
  const tableValue = await form.locator('select[name="table"]').evaluate((element) => Array.from((element as HTMLSelectElement).options).find((option) => option.value && !option.disabled)?.value ?? '');
  expect(tableValue).not.toBe('');
  await form.locator('select[name="table"]').selectOption(tableValue);
  const menuId = await form.locator('select[name="menu"]').evaluate((element) => Array.from((element as HTMLSelectElement).options).find((option) => option.value)?.value ?? '');
  expect(menuId).not.toBe('');
  await form.locator('select[name="menu"]').selectOption(menuId);
  await expectNoOverflow(page);
  await form.locator('button[type="submit"]').click();
  await expect(form).toHaveCount(0);
  await expect(page.locator('[data-new-booking]')).toBeFocused();
  const card = page.locator('[data-booking-id]').filter({ hasText: name });
  await expect(card).toBeVisible();
  await expect(card.locator('[data-booking-status]')).toHaveText(locale === 'en' ? 'Confirmed' : 'Confirmada');
  await expect.poll(async () => (await storedBookings(page, brand)).some((booking) => booking.guest.name === name)).toBe(true);
  const booking = (await storedBookings(page, brand)).find((candidate) => candidate.guest.name === name)!;
  expect(booking).toMatchObject({
    restaurantId: brand,
    guest: { name, email, phone: PHONE },
    partySize: 3,
    source: 'phone',
    status: 'confirmed',
    menuId,
    slot: { date: BOOKING_DATE, startMin: Number(startTime) },
    bookedAt: expect.any(String),
  });
  expect(booking.tableIds).toEqual(JSON.parse(tableValue));
  expect(booking.deposit).toBeUndefined();
  return { booking, shiftValue, startTime, tableValue };
}

test.describe('F31 · libro operativo de reservas', () => {
  for (const brand of ['vedra', 'solane'] as const) {
    for (const locale of ['es', 'en'] as const) {
      const width = locale === 'en' ? 375 : 1366;

      test(`${brand} ${locale}: alta telefónica persistente y mesa retirada del inventario a ${width}px`, async ({ page }) => {
        const observed = observeBrowser(page);
        await page.setViewportSize({ width, height: 900 });
        await page.goto(pathFor(brand, locale), { waitUntil: 'networkidle' });
        await expect(page.locator('[data-new-booking]')).toHaveText(locale === 'en' ? 'New booking' : 'Nueva reserva');
        const { booking, shiftValue, startTime, tableValue } = await enterPhoneBooking(page, brand, locale);
        await expectNoOverflow(page);

        await page.reload({ waitUntil: 'networkidle' });
        await expect(page.locator(`[data-booking-id="${booking.id}"]`)).toContainText(booking.guest.name);
        expect((await storedBookings(page, brand)).find((candidate) => candidate.id === booking.id)).toEqual(booking);

        await page.locator('[data-new-booking]').click();
        const form = page.locator('[data-manual-booking-form]');
        await form.locator('[name="date"]').fill(booking.slot.date);
        await form.locator('[name="partySize"]').fill(String(booking.partySize));
        await form.locator('[name="shift"]').selectOption(shiftValue);
        await form.locator('[name="time"]').selectOption(startTime);
        const availableTables = await form.locator('select[name="table"]').evaluate((element) => Array.from((element as HTMLSelectElement).options).map((option) => option.value));
        expect(availableTables).not.toContain(tableValue);
        await expectNoOverflow(page);
        expect(observed.writes).toEqual([]);
        expect(observed.errors).toEqual([]);
      });

      test(`${brand} ${locale}: búsqueda por nombre y teléfono, filtros combinados y recuperación del vacío`, async ({ page }) => {
        const observed = observeBrowser(page);
        await page.setViewportSize({ width, height: 900 });
        await page.goto(pathFor(brand, locale), { waitUntil: 'networkidle' });
        const { booking } = await enterPhoneBooking(page, brand, locale);
        const filters = page.locator('[data-reservation-filters]');
        const rows = page.locator('[data-reservation-list] [data-booking-id]');
        const query = filters.locator('[name="booking-query"]');
        const reset = filters.locator('[data-clear-reservation-filters]');
        await reset.click();
        const total = await rows.count();
        expect(total).toBeGreaterThan(1);

        await query.fill('angela nunez');
        await expect(rows).toHaveCount(1);
        await expect(rows).toContainText(booking.guest.name);
        await query.fill('612345678');
        await expect(rows).toHaveCount(1);
        await filters.locator('[name="booking-date-filter"]').fill(booking.slot.date);
        await filters.locator('[name="booking-service-filter"]').selectOption(brand === 'vedra' ? 'lunch' : 'dinner');
        await filters.locator('[name="booking-status-filter"]').selectOption('confirmed');
        await filters.locator('[name="booking-source-filter"]').selectOption('phone');
        await expect(rows).toHaveCount(1);
        await expect(filters.locator('[data-reservation-results]')).toHaveText(locale === 'en' ? `1 of ${total} bookings` : `1 de ${total} reservas`);

        await filters.locator('[name="booking-status-filter"]').selectOption('cancelled');
        await expect(rows).toHaveCount(0);
        await expect(filters).toContainText(locale === 'en' ? 'No matches.' : 'No hay coincidencias.');
        await filters.locator('[name="booking-status-filter"]').selectOption('active');
        await expect(rows).toHaveCount(1);
        await filters.locator('[name="booking-source-filter"]').selectOption('widget');
        await expect(rows).toHaveCount(0);
        await filters.locator('[name="booking-source-filter"]').selectOption('phone');
        await filters.locator('[name="booking-date-filter"]').fill('2026-10-06');
        await expect(rows).toHaveCount(0);
        if (brand === 'vedra') {
          await filters.locator('[name="booking-date-filter"]').fill(booking.slot.date);
          await filters.locator('[name="booking-service-filter"]').selectOption('dinner');
          await expect(rows).toHaveCount(0);
        }
        await reset.click();
        await expect(rows).toHaveCount(total);
        await expect(query).toHaveValue('');
        await expect(filters.locator('[name="booking-date-filter"]')).toHaveValue('');
        for (const field of ['service', 'status', 'source']) await expect(filters.locator(`[name="booking-${field}-filter"]`)).toHaveValue('all');
        await expect(reset).toBeDisabled();
        await expectNoOverflow(page);
        expect(observed.writes).toEqual([]);
        expect(observed.errors).toEqual([]);
      });

      test(`${brand} ${locale}: vaciar y recuperar la fecha del servicio mantiene el gestor operativo`, async ({ page }) => {
        const observed = observeBrowser(page);
        await page.goto(pathFor(brand, locale, 'servicio'), { waitUntil: 'networkidle' });
        const service = page.locator('[data-dashboard-view="servicio"]');
        const date = service.locator('input[type="date"]');
        const originalDate = await date.inputValue();
        await date.fill('');
        await expect(service.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(service).toContainText(locale === 'en' ? 'Choose a valid date to view the service.' : 'Elige una fecha válida para consultar el servicio.');
        await date.fill(originalDate);
        await expect(date).toHaveValue(originalDate);
        await expect(service).not.toContainText(locale === 'en' ? 'Choose a valid date to view the service.' : 'Elige una fecha válida para consultar el servicio.');
        expect(observed.writes).toEqual([]);
        expect(observed.errors).toEqual([]);
      });
    }
  }

  for (const locale of ['es', 'en'] as const) {
    test(`solane ${locale}: reserva sin depósito confirma, se sienta y libera el plano; Cocina solo consulta`, async ({ page }) => {
      const observed = observeBrowser(page);
      await page.setViewportSize({ width: locale === 'en' ? 375 : 1366, height: 900 });
      await page.goto(pathFor('solane', locale), { waitUntil: 'networkidle' });
      const initial = await storedBookings(page, 'solane');
      const pending = initial.find((booking) => booking.status === 'pending' && !booking.deposit);
      expect(pending).toBeDefined();
      if (!pending) throw new Error('The demo must include a pending booking without a deposit.');
      const bookingCard = page.locator(`[data-booking-id="${pending.id}"]`);
      await page.locator('[data-role-selector]').selectOption('kitchen');
      await expect(page.locator('[data-new-booking]')).toBeDisabled();
      await expect(bookingCard.locator('[data-booking-action="confirmed"]')).toBeDisabled();
      await expect(bookingCard.locator('[data-booking-action="cancelled"]')).toBeDisabled();
      expect(await storedBookings(page, 'solane')).toEqual(initial);

      await page.locator('[data-role-selector]').selectOption('floor');
      await bookingCard.locator('[data-booking-action="confirmed"]').click();
      await expect(bookingCard.locator('[data-booking-status]')).toHaveText(locale === 'en' ? 'Confirmed' : 'Confirmada');
      await bookingCard.locator('[data-booking-action="seated"]').click();
      await expect(bookingCard.locator('[data-booking-status]')).toHaveText(locale === 'en' ? 'Seated' : 'Sentada');

      const checkFloor = async (state: 'occupied' | 'free') => {
        await page.goto(pathFor('solane', locale, 'plano'), { waitUntil: 'networkidle' });
        const floor = page.locator('[data-dashboard-view="plano"]');
        await floor.locator('input[type="date"]').fill(pending.slot.date);
        await floor.locator('input[type="time"]').fill(timeLabel(pending.slot.startMin));
        for (const tableId of pending.tableIds) await expect(floor.locator(`[data-table-id="${tableId}"]`)).toHaveAttribute('data-state', state);
      };
      await checkFloor('occupied');
      await page.goto(pathFor('solane', locale), { waitUntil: 'networkidle' });
      await expect(bookingCard.locator('[data-booking-status]')).toHaveText(locale === 'en' ? 'Seated' : 'Sentada');
      await bookingCard.locator('[data-booking-action="finished"]').click();
      await expect(bookingCard.locator('[data-booking-status]')).toHaveText(locale === 'en' ? 'Finished' : 'Finalizada');
      await expect(bookingCard.locator('[data-booking-action]')).toHaveCount(0);
      await checkFloor('free');
      const finished = (await storedBookings(page, 'solane')).find((booking) => booking.id === pending.id);
      expect(finished?.status).toBe('finished');
      expect(finished?.deposit).toBeUndefined();
      await expectNoOverflow(page);
      expect(observed.writes).toEqual([]);
      expect(observed.errors).toEqual([]);
    });
  }
});
