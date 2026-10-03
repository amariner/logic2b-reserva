import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { assertNoDoubleBooking, depositFor, type AttendanceConfirmation, type PrivateHire, type RestaurantEvent, type TableBooking } from '../../packages/domain/src/index';
import { getDemoFixture } from '../../apps/web/src/data';

type Brand = 'vedra' | 'solane';
type Locale = 'es' | 'en';
interface StoredState {
  bookings: TableBooking[];
  events?: RestaurantEvent[];
  privateHires?: PrivateHire[];
  attendanceConfirmations?: AttendanceConfirmation[];
}

const ORIGINAL_DATE = '2026-10-12';
const CHANGED_DATE = '2026-10-13';
const keyFor = (brand: Brand) => `logic-reserva-demo-${brand}-v1`;
const pathFor = (brand: Brand, locale: Locale) => `${locale === 'en' ? '/en' : ''}/demos/${brand}/gestion/?vista=reservas`;
const cardFor = (page: Page, bookingId: string) => page.locator(`[data-booking-id="${bookingId}"]`);

function observe(context: BrowserContext, page: Page) {
  const writes: string[] = [];
  const errors: string[] = [];
  context.on('request', (request) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(`${request.method()} ${request.url()}`);
  });
  const monitor = (target: Page) => {
    target.on('pageerror', (error) => errors.push(error.message));
    target.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  };
  monitor(page);
  context.on('page', monitor);
  return { writes, errors };
}

async function readState(page: Page, brand: Brand): Promise<StoredState> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}') as StoredState, keyFor(brand));
}

function bookingFixture(brand: Brand, suffix = 'default'): TableBooking {
  const restaurant = getDemoFixture(brand).restaurant;
  return {
    id: `amendment-${brand}-${suffix}`, restaurantId: brand,
    tableIds: [restaurant.spaces[0].tables[0].id],
    slot: { date: ORIGINAL_DATE, startMin: restaurant.shifts[0].firstSeatingMin, durationMin: 105 },
    partySize: 2, status: 'confirmed', source: 'widget',
    guest: { name: 'Núria Edición', email: 'nuria.amendment@example.test', phone: '+34 612 890 123' },
    menuId: restaurant.menus[0].id,
    bookedAt: '2026-09-30T12:00:00.000Z',
  };
}

function confirmationFor(booking: TableBooking): AttendanceConfirmation {
  return {
    reference: `attendance_${booking.id.replaceAll('-', '_')}`, restaurantId: booking.restaurantId,
    bookingId: booking.id, preparedAt: '2026-10-01T12:00:00.000Z', expiresAt: '2026-10-15T12:00:00.000Z', status: 'prepared',
  };
}

async function seedBooking(page: Page, brand: Brand, locale: Locale, booking = bookingFixture(brand), withConfirmation = false) {
  await page.goto(pathFor(brand, locale), { waitUntil: 'networkidle' });
  await expect(page.locator('[data-new-booking]')).toBeVisible();
  await page.evaluate(({ key, record, attendance }) => {
    const current = JSON.parse(localStorage.getItem(key) ?? '{}') as StoredState;
    localStorage.setItem(key, JSON.stringify({
      ...current,
      bookings: [...current.bookings.filter((item) => item.id !== record.id), record],
      ...(attendance ? { attendanceConfirmations: [...(current.attendanceConfirmations ?? []), attendance] } : {}),
    }));
  }, { key: keyFor(brand), record: booking, attendance: withConfirmation ? confirmationFor(booking) : null });
  await page.reload({ waitUntil: 'networkidle' });
  await expect(cardFor(page, booking.id)).toBeVisible();
  return booking;
}

async function openAttendance(context: BrowserContext, booking: TableBooking, locale: Locale) {
  const attendee = await context.newPage();
  // Hold the fixture within its validity window so this regression is independent
  // of the machine's date and never expires a reference as a side effect.
  await attendee.clock.setFixedTime(new Date('2026-10-02T12:00:00.000Z'));
  const reference = confirmationFor(booking).reference;
  await attendee.goto(`${locale === 'en' ? '/en' : ''}/demos/solane/confirmacion/?ref=${reference}`, { waitUntil: 'networkidle' });
  await expect(attendee.locator('[data-attendance-ready]')).toBeVisible();
  return attendee;
}

async function openEditor(page: Page, bookingId: string) {
  await cardFor(page, bookingId).locator('[data-booking-edit]').click();
  const form = page.locator('[data-booking-amendment-form]');
  await expect(form).toBeVisible();
  return form;
}

async function chooseAvailableTable(form: Locator, except?: string) {
  const choice = await form.locator('select[name="table"]').evaluate((element, excluded) => Array.from((element as HTMLSelectElement).options).find((option) => option.value && !option.disabled && option.value !== excluded)?.value ?? '', except);
  expect(choice).not.toBe('');
  await form.locator('select[name="table"]').selectOption(choice);
  return JSON.parse(choice) as string[];
}

async function proposeNewConditions(form: Locator, partySize = '5') {
  await form.locator('[name="date"]').fill(CHANGED_DATE);
  await form.locator('[name="partySize"]').fill(partySize);
  const time = await form.locator('select[name="time"]').evaluate((element) => (element as HTMLSelectElement).options[2]?.value ?? '');
  expect(time).not.toBe('');
  await form.locator('select[name="time"]').selectOption(time);
  return { tableIds: await chooseAvailableTable(form), startMin: Number(time), partySize: Number(partySize) };
}

async function watchStorage(page: Page, brand: Brand) {
  await page.evaluate((key) => {
    delete document.documentElement.dataset.amendmentStorage;
    const listener = (event: StorageEvent) => {
      if (event.key !== key) return;
      document.documentElement.dataset.amendmentStorage = event.isTrusted ? 'browser' : 'synthetic';
      window.removeEventListener('storage', listener);
    };
    window.addEventListener('storage', listener);
  }, keyFor(brand));
}

function expectInventoryValid(brand: Brand, state: StoredState) {
  expect(() => assertNoDoubleBooking(getDemoFixture(brand).restaurant, state.bookings, state.events ?? [], state.privateHires ?? [])).not.toThrow();
}

test.describe('F32 · reprogramación segura', () => {
  for (const brand of ['vedra', 'solane'] as const) {
    for (const locale of ['es', 'en'] as const) {
      test(`${brand} ${locale}: compara, guarda y persiste cambios conservando identidad y contexto`, async ({ page, context }) => {
        const observed = observe(context, page);
        await page.setViewportSize({ width: locale === 'en' ? 375 : 1366, height: 900 });
        const original = await seedBooking(page, brand, locale, bookingFixture(brand), brand === 'solane');
        const attendee = brand === 'solane' ? await openAttendance(context, original, locale) : undefined;
        const initial = await readState(page, brand);
        const form = await openEditor(page, original.id);
        await expect(form.locator('[data-amendment-before]')).toBeVisible();
        const proposed = await proposeNewConditions(form);
        await expect(form.locator('[data-amendment-after]')).toBeVisible();
        expect(await form.locator('[data-amendment-after]').innerText()).not.toBe(await form.locator('[data-amendment-before]').innerText());
        if (brand === 'solane') await expect(form.locator('[data-amendment-attendance-warning]')).toBeVisible();
        // Editing is a proposal: only an explicit save may change the stored book.
        expect(await readState(page, brand)).toEqual(initial);
        expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
        await form.locator('[data-amendment-save]').click();
        await expect(form).toHaveCount(0);
        const card = cardFor(page, original.id);
        await expect(card.locator('[data-booking-edit]')).toBeFocused();
        await expect(card).toContainText(original.guest.name);
        await expect(page.locator('[name="booking-query"]')).toHaveValue(original.id);

        const accepted = await readState(page, brand);
        expect(accepted.bookings).toHaveLength(initial.bookings.length);
        expect(accepted.bookings.find((booking) => booking.id === original.id)).toEqual({
          ...original,
          slot: { date: CHANGED_DATE, startMin: proposed.startMin, durationMin: 120 },
          partySize: proposed.partySize,
          tableIds: proposed.tableIds,
        });
        if (attendee) {
          expect(accepted.attendanceConfirmations?.some((confirmation) => confirmation.bookingId === original.id)).toBe(false);
          await expect(attendee.locator('[data-attendance-invalid]')).toBeVisible();
          await expect(attendee.locator('[data-attendance-ready]')).toHaveCount(0);
          await expect(attendee.locator('[data-attendance-response]')).toHaveCount(0);
        }
        expectInventoryValid(brand, accepted);
        await page.reload({ waitUntil: 'networkidle' });
        expect((await readState(page, brand)).bookings).toEqual(accepted.bookings);
        await expect(cardFor(page, original.id)).toBeVisible();
        expect(observed.writes).toEqual([]);
        expect(observed.errors).toEqual([]);
        await attendee?.close();
      });
    }
  }

  for (const depositStatus of ['held', 'released'] as const) {
    const locale: Locale = depositStatus === 'held' ? 'es' : 'en';
    test(`solane ${locale}: depósito ${depositStatus} limita la edición a mesas y conserva el recibo exacto`, async ({ page, context }) => {
      const observed = observe(context, page);
      const base = bookingFixture('solane', `deposit-${depositStatus}`);
      const original: TableBooking = {
        ...base,
        deposit: {
          id: `receipt-${base.id}`, status: depositStatus, termsAcceptedAt: '2026-09-30T12:01:00.000Z',
          breakdown: depositFor({ kind: depositStatus === 'held' ? 'prepay' : 'none', menuPercentageBps: depositStatus === 'held' ? 5000 : 0 }, base.partySize, getDemoFixture('solane').restaurant.menus[0].pricePerPersonCents),
        },
      };
      await seedBooking(page, 'solane', locale, original, true);
      const attendee = await openAttendance(context, original, locale);
      const before = await readState(page, 'solane');
      const form = await openEditor(page, original.id);
      await expect(form.locator('[data-amendment-deposit-lock]')).toBeVisible();
      for (const field of ['date', 'shift', 'time', 'partySize']) await expect(form.locator(`[name="${field}"]`)).toBeDisabled();
      const tableIds = await chooseAvailableTable(form, JSON.stringify(original.tableIds));
      await expect(form.locator('[data-amendment-attendance-warning]')).toHaveCount(0);
      await form.locator('[data-amendment-save]').click();
      await expect(form).toHaveCount(0);
      const accepted = await readState(page, 'solane');
      expect(accepted.bookings.find((booking) => booking.id === original.id)).toEqual({ ...original, tableIds });
      expect(accepted.attendanceConfirmations).toEqual(before.attendanceConfirmations);
      await expect(attendee.locator('[data-attendance-ready]')).toBeVisible();
      await expect(attendee.locator('[data-attendance-invalid]')).toHaveCount(0);
      expectInventoryValid('solane', accepted);
      await page.reload({ waitUntil: 'networkidle' });
      expect((await readState(page, 'solane')).bookings.find((booking) => booking.id === original.id)?.deposit).toEqual(original.deposit);
      expect(observed.writes).toEqual([]);
      expect(observed.errors).toEqual([]);
      await attendee.close();
    });
  }

  test('Solane: Cocina no edita y los permisos se actualizan mientras la edición permanece abierta', async ({ page, context }) => {
    const observed = observe(context, page);
    const original = await seedBooking(page, 'solane', 'es', { ...bookingFixture('solane', 'roles'), status: 'pending' });
    const card = cardFor(page, original.id);
    await page.locator('[data-role-selector]').selectOption('kitchen');
    await expect(card.locator('[data-booking-edit]')).toBeDisabled();
    await page.locator('[data-role-selector]').selectOption('floor');
    const form = await openEditor(page, original.id);
    await proposeNewConditions(form);
    await page.locator('[data-role-selector]').selectOption('kitchen');
    await expect(form.locator('[data-amendment-save]')).toBeDisabled();
    await expect(form.locator('[name="date"]')).toBeDisabled();
    await expect(form.locator('[name="table"]')).toBeDisabled();
    expect((await readState(page, 'solane')).bookings.find((booking) => booking.id === original.id)).toEqual(original);
    await form.locator('[data-amendment-cancel]').click();
    await expect(form).toHaveCount(0);
    await page.locator('[data-role-selector]').selectOption('direction');
    await card.locator('[data-booking-action="confirmed"]').click();
    await card.locator('[data-booking-action="seated"]').click();
    await expect(card.locator('[data-booking-edit]')).toHaveCount(0);
    expect(observed.writes).toEqual([]);
    expect(observed.errors).toEqual([]);
  });

  test('Vedra: cancelar una propuesta vuelve al botón de edición sin escribir los cambios', async ({ page, context }) => {
    const observed = observe(context, page);
    await page.setViewportSize({ width: 375, height: 900 });
    const original = await seedBooking(page, 'vedra', 'en');
    const before = await readState(page, 'vedra');
    const form = await openEditor(page, original.id);
    await proposeNewConditions(form);
    await form.locator('[data-amendment-cancel]').click();
    await expect(form).toHaveCount(0);
    await expect(cardFor(page, original.id).locator('[data-booking-edit]')).toBeFocused();
    expect(await readState(page, 'vedra')).toEqual(before);
    await page.reload({ waitUntil: 'networkidle' });
    expect((await readState(page, 'vedra')).bookings.find((booking) => booking.id === original.id)).toEqual(original);
    expect(observed.writes).toEqual([]);
    expect(observed.errors).toEqual([]);
  });

  test('Solane: rechaza una edición obsoleta tras cambiar la reserva en otra pestaña y conserva la propuesta', async ({ page, context }) => {
    const observed = observe(context, page);
    const original = await seedBooking(page, 'solane', 'en');
    const form = await openEditor(page, original.id);
    const proposed = await proposeNewConditions(form);
    const other = await context.newPage();
    await other.goto(pathFor('solane', 'en'), { waitUntil: 'networkidle' });
    await watchStorage(page, 'solane');
    const updated = { ...original, slot: { ...original.slot, startMin: original.slot.startMin + 15 } };
    await other.evaluate(({ key, booking }) => {
      const state = JSON.parse(localStorage.getItem(key) ?? '{}') as StoredState;
      localStorage.setItem(key, JSON.stringify({ ...state, bookings: state.bookings.map((item) => item.id === booking.id ? booking : item) }));
    }, { key: keyFor('solane'), booking: updated });
    await expect(page.locator('html')).toHaveAttribute('data-amendment-storage', 'browser');
    await form.locator('[data-amendment-save]').click();
    await expect(form).toBeVisible();
    await expect(form.getByRole('alert')).toBeVisible();
    await expect(form.getByRole('alert')).toBeFocused();
    await expect(form.locator('[name="date"]')).toHaveValue(CHANGED_DATE);
    await expect(form.locator('[name="time"]')).toHaveValue(String(proposed.startMin));
    await expect(form.locator('[name="partySize"]')).toHaveValue(String(proposed.partySize));
    expect((await readState(page, 'solane')).bookings.find((booking) => booking.id === original.id)).toEqual(updated);
    await form.locator('[data-amendment-cancel]').click();
    const reopened = await openEditor(page, original.id);
    await expect(reopened.locator('[name="time"]')).toHaveValue(String(updated.slot.startMin));
    expect(observed.writes).toEqual([]);
    expect(observed.errors).toEqual([]);
    await other.close();
  });

  test('Vedra: otra pestaña ocupa las mesas propuestas; conserva fecha y personas y permite elegir otras mesas', async ({ page, context }) => {
    const observed = observe(context, page);
    const original = await seedBooking(page, 'vedra', 'es');
    const form = await openEditor(page, original.id);
    const proposed = await proposeNewConditions(form);
    const other = await context.newPage();
    await other.goto(pathFor('vedra', 'es'), { waitUntil: 'networkidle' });
    await watchStorage(page, 'vedra');
    const concurrent: TableBooking = {
      ...original, id: 'amendment-concurrent-occupation', guest: { name: 'Otra reserva desde otra pestaña' },
      tableIds: proposed.tableIds, partySize: proposed.partySize,
      slot: { date: CHANGED_DATE, startMin: proposed.startMin, durationMin: 120 },
    };
    await other.evaluate(({ key, booking }) => {
      const state = JSON.parse(localStorage.getItem(key) ?? '{}') as StoredState;
      localStorage.setItem(key, JSON.stringify({ ...state, bookings: [...state.bookings, booking] }));
    }, { key: keyFor('vedra'), booking: concurrent });
    await expect(page.locator('html')).toHaveAttribute('data-amendment-storage', 'browser');
    await form.locator('[data-amendment-save]').click();
    await expect(form).toBeVisible();
    await expect(form.getByRole('alert')).toBeVisible();
    await expect(form.locator('[name="date"]')).toHaveValue(CHANGED_DATE);
    await expect(form.locator('[name="partySize"]')).toHaveValue(String(proposed.partySize));
    await expect(form.locator('[name="time"]')).toHaveValue(String(proposed.startMin));
    const rejected = await readState(page, 'vedra');
    expect(rejected.bookings.find((booking) => booking.id === original.id)).toEqual(original);
    expect(rejected.bookings.find((booking) => booking.id === concurrent.id)).toEqual(concurrent);
    const nextTables = await chooseAvailableTable(form);
    expect(nextTables.some((tableId) => proposed.tableIds.includes(tableId))).toBe(false);
    await form.locator('[data-amendment-save]').click();
    await expect(form).toHaveCount(0);
    const accepted = await readState(page, 'vedra');
    expect(accepted.bookings.find((booking) => booking.id === original.id)?.tableIds).toEqual(nextTables);
    expectInventoryValid('vedra', accepted);
    expect(observed.writes).toEqual([]);
    expect(observed.errors).toEqual([]);
    await other.close();
  });
});
