import { expect, test, type Page } from '@playwright/test';
import { assertNoDoubleBooking, type PrivateHire, type RestaurantEvent, type TableBooking } from '../../packages/domain/src/index';
import { getDemoFixture } from '../../apps/web/src/data';
import type { VedraDemoState } from '../../apps/dashboard/src/state';

const SOLANE_KEY = 'logic-reserva-demo-solane-v1';
const VEDRA_KEY = 'logic-reserva-demo-vedra-v1';
const DATE = '2026-10-09';
const SLOT = { date: DATE, startMin: 1200, durationMin: 60 };
const solane = getDemoFixture('solane');

interface InventoryState {
  bookings: TableBooking[];
  events: RestaurantEvent[];
  privateHires: PrivateHire[];
}

async function watchExternalStorage(page: Page, key: string) {
  await page.evaluate((storageKey) => {
    delete document.documentElement.dataset.externalInventory;
    const listener = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      document.documentElement.dataset.externalInventory = event.isTrusted ? 'browser-event' : 'synthetic-event';
      window.removeEventListener('storage', listener);
    };
    window.addEventListener('storage', listener);
  }, key);
}

async function readSolane(page: Page): Promise<InventoryState> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}') as InventoryState, SOLANE_KEY);
}

function expectValidSolaneInventory(state: InventoryState) {
  expect(() => assertNoDoubleBooking(solane.restaurant, state.bookings, state.events, state.privateHires)).not.toThrow();
}

for (const kind of ['booking', 'event', 'hire'] as const) {
  const locale = kind === 'event' ? 'en' : 'es';
  test(`F31 · pasarela abierta rechaza ${kind} de otra pestaña y permite recuperar la reserva (${locale})`, async ({ page, context }) => {
    const errors: string[] = [];
    const writes: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    context.on('request', (request) => {
      if (!['GET', 'HEAD'].includes(request.method())) writes.push(`${request.method()} ${request.url()}`);
    });
    if (kind === 'hire') await page.setViewportSize({ width: 375, height: 900 });
    const path = `${locale === 'en' ? '/en' : ''}/demos/solane/`;
    await page.goto(path, { waitUntil: 'networkidle' });

    // For a private-hire conflict the first assignment must be in the Private
    // Room. An existing event consumes the main room until 21:00.
    const mainRoomEvent: RestaurantEvent = {
      id: 'conflict-main-room', restaurantId: 'solane', name: 'Sala reservada',
      slot: SLOT, capacity: 32, priceCents: 12500, soldSeats: 0,
      consumesTableIds: solane.restaurant.spaces[0].tables.map((table) => table.id), status: 'published',
    };
    const seed = {
      version: 1, bookings: solane.bookings, events: [...solane.events, ...(kind === 'hire' ? [mainRoomEvent] : [])],
      privateHires: solane.privateHires, sales: [], waitlist: [], vouchers: [], attendanceConfirmations: [],
      role: 'direction', privateHireTour: { mode: 'choice', step: 1, completed: false },
    };
    await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: SOLANE_KEY, value: seed });
    await page.reload({ waitUntil: 'networkidle' });
    const widget = page.locator('[data-solane-booking-widget]');
    const next = () => widget.getByRole('button', { name: locale === 'en' ? 'Continue' : 'Continuar', exact: true }).click();
    const guestName = `Cliente conflicto ${kind}`;
    const guestEmail = `${kind}@example.test`;
    await widget.locator('[name="date"]').fill(DATE);
    await next();
    const seating = widget.locator('[data-time="20:00"]');
    await expect(seating).toHaveAttribute('data-available-tables', kind === 'hire' ? /sp1/ : /ss1/);
    await seating.click();
    await next();
    await widget.locator('[name="menuId"][value="solane-degustacion"]').check();
    await next();
    await widget.locator('[name="name"]').fill(guestName);
    await widget.locator('[name="email"]').fill(guestEmail);
    await widget.locator('[name="phone"]').fill('+34 600 123 456');
    await widget.locator('[name="depositTerms"]').check();
    await widget.locator('button[type="submit"]').click();
    const gateway = page.locator('[data-deposit-gateway]');
    await expect(gateway).toBeVisible();

    const other = await context.newPage();
    await other.goto('/demos/solane/', { waitUntil: 'networkidle' });
    await watchExternalStorage(page, SOLANE_KEY);
    const latest = await readSolane(other);
    const externalBooking: TableBooking = {
      id: 'conflict-external-booking', restaurantId: 'solane', tableIds: ['ss1'], slot: SLOT,
      partySize: 2, status: 'confirmed', guest: { name: 'Cliente de otra pestaña' }, source: 'phone',
    };
    const externalEvent: RestaurantEvent = {
      ...mainRoomEvent, id: 'conflict-external-event', name: 'Evento de otra pestaña',
      capacity: 4, consumesTableIds: ['ss1'],
    };
    const externalHire: PrivateHire = {
      id: 'conflict-external-hire', restaurantId: 'solane', spaceId: 'solane-privado', slot: SLOT, status: 'blocked',
      proposal: { menuId: 'solane-degustacion', pricePerPersonCents: 12500, minimumGuests: 8, depositCents: 25000 },
    };
    const changed = {
      ...latest,
      bookings: [...latest.bookings, ...(kind === 'booking' ? [externalBooking] : [])],
      events: [...latest.events, ...(kind === 'event' ? [externalEvent] : [])],
      privateHires: [...latest.privateHires, ...(kind === 'hire' ? [externalHire] : [])],
    };
    // Preserve all other versioned state fields while another real Page writes.
    await other.evaluate(({ key, inventory }) => {
      const current = JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, unknown>;
      localStorage.setItem(key, JSON.stringify({ ...current, ...inventory }));
    }, { key: SOLANE_KEY, inventory: changed });
    await expect(page.locator('html')).toHaveAttribute('data-external-inventory', 'browser-event');
    await expect(gateway).toBeVisible();
    await gateway.locator('[data-confirm-deposit]').click();
    await expect(gateway).not.toBeVisible();
    await expect(page.locator('[data-solane-booking-success]')).toHaveCount(0);
    await expect(widget.locator('[role="status"]')).toContainText(locale === 'en' ? 'Availability has changed' : 'La disponibilidad ha cambiado');
    const rejected = await readSolane(page);
    expect(rejected.bookings.some((booking) => booking.guest.name === guestName)).toBe(false);
    expectValidSolaneInventory(rejected);

    // The conflicting occupation ends at 21:00. Retry that adjacent slot with
    // the retained contact/menu, and explicitly accept its terms again.
    await widget.locator('[data-time="21:00"]').click();
    await next();
    await expect(widget.locator('[name="menuId"][value="solane-degustacion"]')).toBeChecked();
    await next();
    await expect(widget.locator('[name="name"]')).toHaveValue(guestName);
    await expect(widget.locator('[name="email"]')).toHaveValue(guestEmail);
    await expect(widget.locator('[name="phone"]')).toHaveValue('+34 600 123 456');
    await expect(widget.locator('[name="depositTerms"]')).not.toBeChecked();
    await widget.locator('[name="depositTerms"]').check();
    await widget.locator('button[type="submit"]').click();
    await gateway.locator('[data-confirm-deposit]').click();
    await expect(page.locator('[data-solane-booking-success]')).toBeVisible();
    const accepted = await readSolane(page);
    const created = accepted.bookings.filter((booking) => booking.guest.name === guestName);
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ slot: { date: DATE, startMin: 1260 }, status: 'confirmed', menuId: 'solane-degustacion', deposit: { status: 'held' } });
    expectValidSolaneInventory(accepted);
    await page.reload({ waitUntil: 'networkidle' });
    expect((await readSolane(page)).bookings.filter((booking) => booking.guest.name === guestName)).toHaveLength(1);
    expect(errors).toEqual([]);
    expect(writes).toEqual([]);
    await other.close();
  });
}

test('F31 · grupo Vedra conserva el menú y cambia de combinación tras un conflicto de otra pestaña', async ({ page, context }) => {
  await page.goto('/demos/vedra/gestion/?vista=plano', { waitUntil: 'networkidle' });
  await page.locator('[data-tour-mode="guided"]').click();
  await page.getByRole('button', { name: 'Proponer combinaciones' }).click();
  await page.locator('[data-table-combination="vs4+vs5"]').click();
  await page.locator('.rd-menu-select select').selectOption('vedra-grupos');
  await expect.poll(async () => page.evaluate((key) => (JSON.parse(localStorage.getItem(key) ?? '{}') as VedraDemoState).group?.status, VEDRA_KEY)).toBe('menu_assigned');

  const other = await context.newPage();
  await other.goto('/demos/vedra/', { waitUntil: 'networkidle' });
  await watchExternalStorage(page, VEDRA_KEY);
  await other.evaluate((key) => {
    const current = JSON.parse(localStorage.getItem(key) ?? '{}') as VedraDemoState;
    const booking: TableBooking = {
      id: 'vedra-external-booking', restaurantId: 'vedra', tableIds: ['vs4'], slot: { ...current.group.slot },
      partySize: 2, status: 'confirmed', source: 'phone', guest: { name: 'Reserva llegada después' },
    };
    localStorage.setItem(key, JSON.stringify({ ...current, bookings: [...current.bookings, booking] }));
  }, VEDRA_KEY);
  await expect(page.locator('html')).toHaveAttribute('data-external-inventory', 'browser-event');
  await page.locator('[data-confirm-group]').click();
  await expect(page.locator('[data-tour-complete]')).toHaveCount(0);
  await expect(page.locator('[data-group-tour] [role="status"]')).toContainText('Las mesas seleccionadas ya no están disponibles');
  await expect(page.locator('[data-tour-step="2"]')).toBeVisible();
  await expect(page.locator('[data-table-combination="vs4+vs5"]')).toHaveCount(0);
  const rejected = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}') as VedraDemoState, VEDRA_KEY);
  expect(rejected.bookings.some((booking) => booking.id === rejected.group.bookingId)).toBe(false);
  expect(rejected.group).toMatchObject({ status: 'menu_assigned', menuId: 'vedra-grupos' });

  await page.locator('[data-table-combination="vs6+vs7"]').click();
  await expect(page.locator('.rd-menu-select select')).toHaveValue('vedra-grupos');
  await page.locator('[data-confirm-group]').click();
  await expect(page.locator('[data-tour-complete]')).toBeVisible();
  const accepted = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}') as VedraDemoState, VEDRA_KEY);
  expect(accepted.group).toMatchObject({ status: 'confirmed', tableIds: ['vs6', 'vs7'], menuId: 'vedra-grupos' });
  expect(accepted.bookings.filter((booking) => booking.id === accepted.group.bookingId)).toHaveLength(1);
  expect(() => assertNoDoubleBooking(getDemoFixture('vedra').restaurant, accepted.bookings, [], [])).not.toThrow();
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('[data-tour-complete]')).toBeVisible();
  await other.close();
});
