import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';

export interface MobileDashboardNavItem<View extends string> {
  id: View;
  label: string;
  icon: LucideIcon;
}

interface MobileDashboardNavProps<View extends string> {
  ariaLabel: string;
  currentView: View;
  items: readonly MobileDashboardNavItem<View>[];
  primaryViews: readonly View[];
  moreLabel: string;
  onSelect: (view: View) => void;
}

export default function MobileDashboardNav<View extends string>({
  ariaLabel,
  currentView,
  items,
  primaryViews,
  moreLabel,
  onSelect,
}: MobileDashboardNavProps<View>) {
  const details = useRef<HTMLDetailsElement>(null);
  const primary = primaryViews.flatMap((view) => {
    const item = items.find((candidate) => candidate.id === view);
    return item === undefined ? [] : [item];
  });
  const secondary = items.filter((item) => !primaryViews.includes(item.id));
  const secondaryActive = secondary.some((item) => item.id === currentView);

  useEffect(() => {
    if (details.current) details.current.open = false;
  }, [currentView]);

  const select = (view: View) => {
    if (details.current) details.current.open = false;
    onSelect(view);
  };

  return (
    <nav className="rd-mobile-nav" aria-label={ariaLabel} data-mobile-dashboard-nav>
      {primary.map((item) => {
        const Icon = item.icon;
        return <button key={item.id} type="button" className={currentView === item.id ? 'active' : ''} aria-current={currentView === item.id ? 'page' : undefined} onClick={() => select(item.id)}><Icon size={20} aria-hidden="true" /><span>{item.label}</span></button>;
      })}
      {secondary.length > 0 && <details ref={details} className={secondaryActive ? 'active' : ''}>
        <summary aria-current={secondaryActive ? 'page' : undefined}><MoreHorizontal size={20} aria-hidden="true" /><span>{moreLabel}</span></summary>
        <div className="rd-mobile-nav__more" aria-label={moreLabel}>
          {secondary.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} type="button" className={currentView === item.id ? 'active' : ''} aria-current={currentView === item.id ? 'page' : undefined} onClick={() => select(item.id)}><Icon size={19} aria-hidden="true" /><span>{item.label}</span></button>;
          })}
        </div>
      </details>}
    </nav>
  );
}
