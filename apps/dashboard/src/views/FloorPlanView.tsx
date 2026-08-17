import { Check, Link2, Map as MapIcon, Sparkles, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { slotsOverlap, tableAvailability, type BookingStatus, type Restaurant } from '@logic-reserva/domain';
import { DASHBOARD_COPY, dashboardText, type DashboardLocale, type DashboardView } from '../content';
import {
  assignVedraGroupMenu,
  assignVedraGroupTables,
  confirmVedraGroup,
  resetVedraGroupJourney,
  setVedraTourStep,
  startVedraTour,
  type VedraDemoState,
  type VedraGroupStatus,
} from '../state';

interface FloorPlanViewProps {
  locale: DashboardLocale;
  restaurant: Restaurant;
  state: VedraDemoState;
  onChange: (state: VedraDemoState) => void;
  onView: (view: DashboardView) => void;
}

const ACTIVE_STATUSES: readonly BookingStatus[] = ['pending', 'confirmed', 'seated'];
const timeLabel = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export default function FloorPlanView({ locale, restaurant, state, onChange, onView }: FloorPlanViewProps) {
  const copy = DASHBOARD_COPY.floor;
  const [selectedTableId, setSelectedTableId] = useState(restaurant.spaces[0]?.tables[0]?.id ?? '');
  const price = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const allTables = useMemo(() => restaurant.spaces.flatMap((space) => space.tables.map((table) => ({ ...table, space }))), [restaurant]);
  const tableById = useMemo(() => new Map(allTables.map((table) => [table.id, table])), [allTables]);
  const options = useMemo(() => {
    const available = tableAvailability(restaurant, state.bookings, [], [], state.group.slot, state.group.partySize);
    const primarySpaceId = restaurant.spaces[0]?.id;
    return available.filter((option) => option.spaceId === primarySpaceId);
  }, [restaurant, state.bookings, state.group.partySize, state.group.slot]);
  const selectedTable = tableById.get(selectedTableId);
  const selectedBooking = state.bookings.find((booking) =>
    ACTIVE_STATUSES.includes(booking.status)
    && booking.tableIds.includes(selectedTableId)
    && slotsOverlap(booking.slot, state.group.slot),
  );
  const groupStatus: Record<VedraGroupStatus, string> = {
    requested: dashboardText(copy.requested, locale),
    tables_assigned: dashboardText(copy.tablesAssigned, locale),
    menu_assigned: dashboardText(copy.menuAssigned, locale),
    confirmed: dashboardText(copy.confirmed, locale),
  };
  const tableNames = (ids: readonly string[]) => ids.map((id) => tableById.get(id)?.name ?? id).join(' + ');
  const showStep = (step: 1 | 2 | 3) => state.tourMode === 'free' || state.tourStep === step;

  return (
    <section className="rd-view" data-dashboard-view="plano">
      <header className="rd-view-header">
        <div><p className="rd-eyebrow">{dashboardText(copy.eyebrow, locale)}</p><h1>{dashboardText(copy.title, locale)}</h1><p>{dashboardText(copy.body, locale)}</p></div>
        <div className="rd-group-chip"><UsersRound size={17} aria-hidden="true" /><span>{state.group.guest.name}</span><b>{groupStatus[state.group.status]}</b></div>
      </header>

      <div className="rd-floor-layout">
        <aside className="rd-journey" data-group-tour data-group-stage={state.group.status}>
          <header><div><p className="rd-eyebrow">{dashboardText(copy.request, locale)}</p><h2>{state.group.guest.name}</h2></div><span className="badge" data-tone={state.group.status === 'confirmed' ? 'success' : 'warning'}>{groupStatus[state.group.status]}</span></header>
          <dl className="rd-group-summary">
            <div><dt>{dashboardText(copy.date, locale)}</dt><dd>{state.group.slot.date}</dd></div>
            <div><dt>{dashboardText(copy.time, locale)}</dt><dd>{timeLabel(state.group.slot.startMin)}</dd></div>
            <div><dt>{dashboardText(copy.party, locale)}</dt><dd>{state.group.partySize} {dashboardText(copy.people, locale)}</dd></div>
          </dl>

          {state.tourMode === 'unset' && (
            <div className="rd-mode-choice">
              <Sparkles size={26} aria-hidden="true" />
              <h3>{dashboardText(copy.chooseModeTitle, locale)}</h3>
              <p>{dashboardText(copy.chooseModeBody, locale)}</p>
              <button type="button" data-tour-mode="guided" onClick={() => onChange(startVedraTour(state, 'guided'))}><b>{dashboardText(copy.guided, locale)}</b><span>{dashboardText(copy.guidedBody, locale)}</span></button>
              <button type="button" className="ghost" data-tour-mode="free" onClick={() => onChange(startVedraTour(state, 'free'))}><b>{dashboardText(copy.free, locale)}</b><span>{dashboardText(copy.freeBody, locale)}</span></button>
            </div>
          )}

          {state.tourMode !== 'unset' && !state.tourCompleted && (
            <>
              {state.tourMode === 'guided' && <ol className="rd-tour-progress" aria-label={dashboardText(copy.tourLabel, locale)}>{copy.tourSteps.map((label, index) => <li key={label.es} className={state.tourStep === index + 1 ? 'active' : state.tourStep !== null && state.tourStep > index + 1 ? 'complete' : ''}><span>{state.tourStep !== null && state.tourStep > index + 1 ? <Check size={13} aria-hidden="true" /> : index + 1}</span>{dashboardText(label, locale)}</li>)}</ol>}

              {showStep(1) && (
                <div className="rd-tour-card" data-tour-step="1">
                  <span>01</span><h3>{dashboardText(copy.stepOneTitle, locale)}</h3><p>{dashboardText(copy.stepOneBody, locale)}</p>
                  {state.tourMode === 'guided' && <button className="rd-primary-action" type="button" onClick={() => onChange(setVedraTourStep(state, 2))}>{dashboardText(copy.findCombination, locale)}</button>}
                </div>
              )}

              {showStep(2) && (
                <div className="rd-tour-card" data-tour-step="2">
                  <span>02</span><h3>{dashboardText(copy.stepTwoTitle, locale)}</h3><p>{dashboardText(copy.stepTwoBody, locale)}</p>
                  {options.length === 0 ? <p className="rd-empty">{dashboardText(copy.noCombinations, locale)}</p> : <div className="rd-combinations">{options.map((option) => <button type="button" key={option.tableIds.join('-')} className={option.tableIds.join() === state.group.tableIds.join() ? 'selected' : ''} data-table-combination={option.tableIds.join('+')} onClick={() => onChange(assignVedraGroupTables(state, option.tableIds))}><span><Link2 size={15} aria-hidden="true" />{tableNames(option.tableIds)}</span><small>{option.maxSeats} {dashboardText(copy.seats, locale)}</small><b>{dashboardText(copy.chooseCombination, locale)}</b></button>)}</div>}
                </div>
              )}

              {showStep(3) && (
                <div className="rd-tour-card" data-tour-step="3">
                  <span>03</span><h3>{dashboardText(copy.stepThreeTitle, locale)}</h3><p>{dashboardText(copy.stepThreeBody, locale)}</p>
                  <p className="rd-selected-combination"><Check size={15} aria-hidden="true" /><span>{dashboardText(copy.selectedCombination, locale)}</span><b>{tableNames(state.group.tableIds)}</b></p>
                  <label className="rd-menu-select"><span>{dashboardText(copy.menu, locale)}</span><select value={state.group.menuId ?? ''} onChange={(event) => onChange(assignVedraGroupMenu(state, event.target.value))}><option value="">{dashboardText(copy.selectMenu, locale)}</option>{restaurant.menus.filter((menu) => menu.bookableOnline).map((menu) => <option key={menu.id} value={menu.id}>{menu.name} · {price.format(menu.pricePerPersonCents / 100)} {dashboardText(copy.perPerson, locale)}</option>)}</select></label>
                  <button className="rd-primary-action" type="button" data-confirm-group disabled={state.group.status !== 'menu_assigned'} onClick={() => onChange(confirmVedraGroup(state))}>{dashboardText(copy.confirmGroup, locale)}</button>
                </div>
              )}
            </>
          )}

          {state.tourCompleted && (
            <div className="rd-journey-success" data-tour-complete><span><Check size={24} aria-hidden="true" /></span><h3>{dashboardText(copy.completedTitle, locale)}</h3><p>{dashboardText(copy.completedBody, locale)}</p><div><button className="rd-primary-action" type="button" onClick={() => onView('servicio')}>{dashboardText(copy.openService, locale)}</button><button className="rd-secondary-action" type="button" onClick={() => onChange(resetVedraGroupJourney(state))}>{dashboardText(copy.restartJourney, locale)}</button></div></div>
          )}
        </aside>

        <div className="rd-floor-workspace">
          <header><div><p className="rd-eyebrow">{dashboardText(copy.floorTitle, locale)}</p><p>{dashboardText(copy.floorBody, locale)}</p></div><MapIcon size={25} aria-hidden="true" /></header>
          <div className="rd-spaces">
            {restaurant.spaces.map((space) => (
              <section className="rd-space" key={space.id}>
                <header><h2>{space.name}</h2><span>{space.tables.length}</span></header>
                <div className="rd-table-grid">
                  {space.tables.map((table) => {
                    const booking = state.bookings.find((candidate) => ACTIVE_STATUSES.includes(candidate.status) && candidate.tableIds.includes(table.id) && slotsOverlap(candidate.slot, state.group.slot));
                    const isGroup = booking?.id === state.group.bookingId;
                    const isSelected = state.group.status !== 'confirmed' && state.group.tableIds.includes(table.id);
                    const tableState = isGroup ? 'group' : isSelected ? 'selected' : booking === undefined ? 'free' : 'occupied';
                    const stateLabel = tableState === 'group' ? copy.groupTable : tableState === 'selected' ? copy.selectedTable : tableState === 'free' ? copy.freeTable : copy.occupiedTable;
                    const accessibleLabel = `${table.name} · ${dashboardText(stateLabel, locale)} · ${table.minSeats}–${table.maxSeats} ${dashboardText(copy.seats, locale)}`;
                    return <button type="button" aria-label={accessibleLabel} className={`rd-floor-table ${selectedTableId === table.id ? 'active' : ''}`} data-state={tableState} data-table-id={table.id} key={table.id} onClick={() => setSelectedTableId(table.id)}><b>{table.name}</b><span>{dashboardText(stateLabel, locale)}</span><small>{table.minSeats}–{table.maxSeats} {dashboardText(copy.seats, locale)}</small></button>;
                  })}
                </div>
              </section>
            ))}
          </div>

          <aside className="rd-table-detail" data-table-detail>
            <p className="rd-eyebrow">{dashboardText(copy.tableDetail, locale)}</p>
            {selectedTable === undefined ? <p>{dashboardText(copy.selectedHint, locale)}</p> : <><h2>{selectedTable.name}</h2><dl><div><dt>{dashboardText(copy.space, locale)}</dt><dd>{selectedTable.space.name}</dd></div><div><dt>{dashboardText(copy.capacity, locale)}</dt><dd>{selectedTable.minSeats}–{selectedTable.maxSeats} {dashboardText(copy.seats, locale)}</dd></div><div><dt>{dashboardText(copy.connectsWith, locale)}</dt><dd>{selectedTable.combinableWith.length === 0 ? dashboardText(copy.noConnections, locale) : tableNames(selectedTable.combinableWith)}</dd></div><div><dt>{dashboardText(copy.occupancy, locale)}</dt><dd>{selectedBooking?.guest.name ?? dashboardText(copy.available, locale)}</dd></div></dl></>}
          </aside>
        </div>
      </div>
    </section>
  );
}
