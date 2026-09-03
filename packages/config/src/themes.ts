import type { DemoSlug } from './index';

export interface ThemeText {
  readonly es: string;
  readonly en: string;
}

export type ThemeTier = 'basico' | 'gestion' | 'inteligente';

export interface ThemeCatalogEntry {
  readonly slug: string;
  readonly name: ThemeText;
  readonly format: ThemeText;
  readonly tone: ThemeText;
  readonly promise: ThemeText;
  readonly level: ThemeTier;
  readonly accent: string;
  readonly surface: string;
  readonly mark: string;
  readonly deepDemo?: DemoSlug;
}

export const THEME_CATALOG: readonly ThemeCatalogEntry[] = [
  {
    slug: 'brasca', name: { es: 'Brasca', en: 'Brasca' }, format: { es: 'Bistró de barrio', en: 'Neighbourhood bistro' }, tone: { es: 'Cálida y directa', en: 'Warm and direct' }, promise: { es: 'Fuego lento, mesa compartida.', en: 'Slow fire, shared table.' }, level: 'basico', accent: '#a3472c', surface: '#f4dfd2', mark: 'B', deepDemo: 'brasca',
  },
  {
    slug: 'vedra', name: { es: 'Vedra', en: 'Vedra' }, format: { es: 'Cocina mediterránea', en: 'Mediterranean kitchen' }, tone: { es: 'Verde y hospitalaria', en: 'Green and welcoming' }, promise: { es: 'Cada mesa encuentra su momento.', en: 'Every table finds its moment.' }, level: 'gestion', accent: '#53613b', surface: '#e4e8d3', mark: 'V', deepDemo: 'vedra',
  },
  {
    slug: 'solane', name: { es: 'Solane', en: 'Solane' }, format: { es: 'Gastronomía contemporánea', en: 'Contemporary fine dining' }, tone: { es: 'Nocturna y precisa', en: 'Nocturnal and precise' }, promise: { es: 'Una noche que empieza antes de sentarse.', en: 'An evening that begins before you sit down.' }, level: 'inteligente', accent: '#202b50', surface: '#e1e5ef', mark: 'S', deepDemo: 'solane',
  },
  {
    slug: 'olivar', name: { es: "L'Olivar", en: "L'Olivar" }, format: { es: 'Arrocería de producto', en: 'Produce-led rice house' }, tone: { es: 'Solar y de temporada', en: 'Seasonal and sunlit' }, promise: { es: 'El campo llega al centro de la mesa.', en: 'The field arrives at the centre of the table.' }, level: 'basico', accent: '#8b6c32', surface: '#f2e8ca', mark: 'O',
  },
  {
    slug: 'mar-de-fondo', name: { es: 'Mar de Fondo', en: 'Mar de Fondo' }, format: { es: 'Casa de pescado y terraza', en: 'Seafood house and terrace' }, tone: { es: 'Salina y abierta', en: 'Salty and open' }, promise: { es: 'El mar marca el ritmo.', en: 'The sea sets the pace.' }, level: 'gestion', accent: '#176b78', surface: '#d9eef0', mark: 'M',
  },
  {
    slug: 'riu-clar', name: { es: 'Riu Clar', en: 'Riu Clar' }, format: { es: 'Hotel y comedor', en: 'Hotel and dining room' }, tone: { es: 'Serena y luminosa', en: 'Calm and light' }, promise: { es: 'Una llegada tranquila empieza aquí.', en: 'A calm arrival starts here.' }, level: 'gestion', accent: '#557b72', surface: '#dcebe5', mark: 'R',
  },
  {
    slug: 'la-duna', name: { es: 'La Duna', en: 'La Duna' }, format: { es: 'Terraza estacional', en: 'Seasonal terrace' }, tone: { es: 'Ligera y mediterránea', en: 'Light and Mediterranean' }, promise: { es: 'Reserva el lugar que pide el verano.', en: 'Book the place summer calls for.' }, level: 'basico', accent: '#bd733e', surface: '#f7e1c9', mark: 'D',
  },
  {
    slug: 'el-delta', name: { es: 'El Delta', en: 'El Delta' }, format: { es: 'Eventos junto al agua', en: 'Waterfront events' }, tone: { es: 'Amplia y celebratoria', en: 'Open and celebratory' }, promise: { es: 'Cada formato encuentra su espacio.', en: 'Every format finds its space.' }, level: 'inteligente', accent: '#315c70', surface: '#dce9ee', mark: 'D',
  },
  {
    slug: 'serralta', name: { es: 'Serralta', en: 'Serralta' }, format: { es: 'Alta cocina', en: 'Fine dining' }, tone: { es: 'Sobria y detallista', en: 'Quiet and precise' }, promise: { es: 'La precisión también se siente.', en: 'Precision can be felt too.' }, level: 'inteligente', accent: '#493b58', surface: '#e8e0eb', mark: 'S',
  },
  {
    slug: 'entre-vinyes', name: { es: 'Entre Vinyes', en: 'Entre Vinyes' }, format: { es: 'Bodega y mesa', en: 'Winery and table' }, tone: { es: 'Terrosa y cercana', en: 'Earthy and close' }, promise: { es: 'Una mesa hecha para alargarla.', en: 'A table made to linger at.' }, level: 'gestion', accent: '#72523c', surface: '#eee1d4', mark: 'E',
  },
  {
    slug: 'la-ballena', name: { es: 'La Ballena', en: 'La Ballena' }, format: { es: 'Bar de barrio', en: 'Neighbourhood bar' }, tone: { es: 'Viva y espontánea', en: 'Lively and spontaneous' }, promise: { es: 'Entra por una y quédate a comer.', en: 'Come in for one and stay for lunch.' }, level: 'basico', accent: '#a43d54', surface: '#f1dce1', mark: 'B',
  },
  {
    slug: 'sol-hivern', name: { es: "Sol d'Hivern", en: "Sol d'Hivern" }, format: { es: 'Cadena casual', en: 'Casual chain' }, tone: { es: 'Clara y consistente', en: 'Clear and consistent' }, promise: { es: 'La misma energía en cada dirección.', en: 'The same energy at every address.' }, level: 'gestion', accent: '#a05b20', surface: '#f4e1c8', mark: 'H',
  },
];

export const themeBySlug = (slug: string): ThemeCatalogEntry | undefined => THEME_CATALOG.find((theme) => theme.slug === slug);
