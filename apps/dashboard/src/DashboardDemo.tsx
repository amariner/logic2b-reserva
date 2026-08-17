import type { DemoSlug } from '@logic-reserva/config';

export interface DashboardDemoProps {
  slug: Exclude<DemoSlug, 'brasca'>; // el nivel Inicio no tiene gestor
  locale?: 'es' | 'en';
}

// Esqueleto F0: el gestor real (vistas servicio, plano, reservas, eventos…)
// se construye en las fases F5–F10 del roadmap.
export default function DashboardDemo({ slug, locale = 'es' }: DashboardDemoProps) {
  const label = locale === 'en' ? 'Manager under construction' : 'Gestor en construcción';
  return (
    <section className="rd-shell">
      <p className="rd-eyebrow">{slug}</p>
      <h1>{label}</h1>
    </section>
  );
}
