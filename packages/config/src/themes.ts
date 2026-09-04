import type { Locale } from './index';

export interface ThemeText {
  readonly es: string;
  readonly en: string;
}

export type ThemeDepth = 'deep' | 'web-only';
export type ThemeLayout = 'editorial' | 'split' | 'poster' | 'panorama' | 'minimal' | 'modular' | 'market';
export type ThemeType = 'serif' | 'sans' | 'condensed' | 'mixed';

export interface ThemePalette {
  readonly primary: string;
  readonly accent: string;
  readonly paper: string;
  readonly ink: string;
  readonly muted: string;
}

export interface ThemeWebCopy {
  readonly body: ThemeText;
  readonly menuTitle: ThemeText;
  readonly menuIntro: ThemeText;
  readonly menu: readonly {
    readonly name: ThemeText;
    readonly detail: ThemeText;
  }[];
  readonly storyTitle: ThemeText;
  readonly story: ThemeText;
  readonly hours: ThemeText;
  readonly address: ThemeText;
}

export interface ThemeEntry {
  readonly slug: string;
  readonly name: string;
  readonly mark: string;
  readonly format: ThemeText;
  readonly location: ThemeText;
  readonly promise: ThemeText;
  readonly tone: ThemeText;
  readonly level: ThemeText;
  readonly depth: ThemeDepth;
  readonly layout: ThemeLayout;
  readonly type: ThemeType;
  readonly palette: ThemePalette;
  readonly screenshotBase: string;
  readonly imageBase?: string;
  readonly web?: ThemeWebCopy;
}

const t = (es: string, en: string): ThemeText => ({ es, en });
const item = (es: string, en: string, detailEs: string, detailEn: string) => ({ name: t(es, en), detail: t(detailEs, detailEn) });

export const THEME_CATALOG = [
  {
    slug: 'brasca', name: 'Brasca', mark: 'BR', format: t('Bistró de barrio', 'Neighbourhood bistro'), location: t('Valencia', 'Valencia'),
    promise: t('Fuego lento, mesa compartida.', 'Slow fire, shared table.'), tone: t('Cercano, táctil y sin ceremonia', 'Warm, tactile and informal'), level: t('Básico · recorrido profundo', 'Basic · deep journey'),
    depth: 'deep', layout: 'editorial', type: 'serif', palette: { primary: '#a3472c', accent: '#d27a3c', paper: '#fbf4eb', ink: '#2d1a13', muted: '#765d52' }, screenshotBase: '01-brasca-marca', imageBase: '/images/heroes/brasca-v2',
  },
  {
    slug: 'vedra', name: 'Vedra', mark: 'VE', format: t('Restaurante mediterráneo', 'Mediterranean restaurant'), location: t('Madrid', 'Madrid'),
    promise: t('Cada mesa encuentra su momento.', 'Every table finds its moment.'), tone: t('Natural, luminoso y ordenado', 'Natural, bright and composed'), level: t('Gestión · recorrido profundo', 'Management · deep journey'),
    depth: 'deep', layout: 'split', type: 'sans', palette: { primary: '#53613b', accent: '#9aa66b', paper: '#f6f7ee', ink: '#1d2417', muted: '#626b55' }, screenshotBase: '03-vedra-reserva', imageBase: '/images/heroes/vedra-v2',
  },
  {
    slug: 'solane', name: 'Solane', mark: 'SO', format: t('Gastronómico contemporáneo', 'Contemporary fine dining'), location: t('Barcelona', 'Barcelona'),
    promise: t('Una noche que empieza antes de sentarse.', 'An evening that begins before you sit down.'), tone: t('Preciso, nocturno y ceremonial', 'Precise, nocturnal and ceremonial'), level: t('Inteligente · recorrido profundo', 'Intelligent · deep journey'),
    depth: 'deep', layout: 'minimal', type: 'serif', palette: { primary: '#202b50', accent: '#bd913b', paper: '#f4f5f8', ink: '#11182b', muted: '#5b6274' }, screenshotBase: '05-solane-inventario', imageBase: '/images/heroes/solane-v2',
  },
  {
    slug: 'la-trece', name: 'La Trece', mark: '13', format: t('Bar de barrio', 'Neighbourhood bar'), location: t('Zaragoza', 'Zaragoza'),
    promise: t('La barra que siempre guarda un hueco.', 'The bar that always keeps a place for you.'), tone: t('Directo, popular y gráfico', 'Direct, familiar and graphic'), level: t('Dirección web', 'Website direction'),
    depth: 'web-only', layout: 'poster', type: 'condensed', palette: { primary: '#b9322a', accent: '#f3c845', paper: '#fff5dd', ink: '#21150e', muted: '#705f4d' }, screenshotBase: '09-la-trece-web',
    web: { body: t('Vermut, bocados calientes y una barra que conoce el ritmo del barrio. La web va al grano: hoy, ahora y dónde sentarse.', 'Vermouth, hot bites and a bar that knows the rhythm of its neighbourhood. The website gets to the point: today, now and where to sit.'), menuTitle: t('Lo que sale hoy', 'What is coming out today'), menuIntro: t('Pocas cosas, escritas grande y servidas sin espera.', 'A short list, written large and served without delay.'), menu: [item('Gilda de la casa', 'House gilda', 'Piparra, anchoa y aceituna', 'Guindilla, anchovy and olive'), item('Tortilla al momento', 'Fresh tortilla', 'Jugosa, con cebolla', 'Soft-set, with onion'), item('Vermut de grifo', 'Vermouth on tap', 'Rojo, naranja y sifón', 'Red vermouth, orange and soda')], storyTitle: t('La barra es el plano.', 'The bar is the floor plan.'), story: t('La Trece no necesita explicar un concepto. Enseña la pizarra, el horario y la energía del local antes de llevarte al punto de reserva.', 'La Trece needs no concept statement. It shows the board, opening times and room energy before taking you to the booking point.'), hours: t('Mar–dom · 12:00–00:00', 'Tue–Sun · 12:00–00:00'), address: t('Plaza ficticia del Carbón, 13', '13 Fictional Coal Square') },
  },
  {
    slug: 'salobre', name: 'Salobre', mark: 'SA', format: t('Arrocería', 'Rice restaurant'), location: t('Alicante', 'Alicante'),
    promise: t('El arroz llega cuando la mesa está lista.', 'The rice arrives when the table is ready.'), tone: t('Mediterráneo, sereno y solar', 'Mediterranean, calm and sunlit'), level: t('Dirección web', 'Website direction'),
    depth: 'web-only', layout: 'editorial', type: 'serif', palette: { primary: '#153b5b', accent: '#d89b2b', paper: '#f8f0da', ink: '#132532', muted: '#65717a' }, screenshotBase: '10-salobre-web',
    web: { body: t('Arroces al centro, producto de lonja y tiempos que se respetan. La reserva empieza explicando para cuántos y qué quieres compartir.', 'Rice dishes for the table, market fish and timing worth respecting. Booking starts by asking how many guests and what they want to share.'), menuTitle: t('Fuego, caldo y reposo', 'Fire, stock and rest'), menuIntro: t('Cada arroz se prepara para la mesa completa.', 'Every rice dish is prepared for the whole table.'), menu: [item('Arroz del señoret', 'Shelled seafood rice', 'Gamba, calamar y fondo de roca', 'Prawn, squid and rockfish stock'), item('Arroz de verduras', 'Vegetable rice', 'Alcachofa, judía y romero', 'Artichoke, beans and rosemary'), item('Caldero Salobre', 'Salobre fish stew', 'Pescado, patata y alioli', 'Fish, potato and aioli')], storyTitle: t('El tiempo también se reserva.', 'Time is part of the booking.'), story: t('La web prioriza servicio, tamaño de mesa y elección de arroz para que cocina y cliente compartan la misma expectativa antes de llegar.', 'The website prioritises service, party size and rice choice so kitchen and guest share the same expectation before arrival.'), hours: t('Jue–lun · 13:00–17:00', 'Thu–Mon · 13:00–17:00'), address: t('Paseo ficticio de la Sal, 8', '8 Fictional Salt Promenade') },
  },
  {
    slug: 'trama', name: 'Trama', mark: 'TR', format: t('Grupo pequeño', 'Small restaurant group'), location: t('Bilbao · 3 casas', 'Bilbao · 3 venues'),
    promise: t('Tres casas. Una manera de recibir.', 'Three venues. One way of welcoming.'), tone: t('Modular, urbano y humano', 'Modular, urban and human'), level: t('Dirección web', 'Website direction'),
    depth: 'web-only', layout: 'modular', type: 'sans', palette: { primary: '#174d3f', accent: '#ea6a4e', paper: '#f2f0e8', ink: '#17332c', muted: '#68746f' }, screenshotBase: '11-trama-web',
    web: { body: t('Tres restaurantes con cartas distintas y una misma forma de cuidar el servicio. La web ayuda a elegir local antes de pedir mesa.', 'Three restaurants with different menus and one shared approach to service. The website helps guests choose a venue before requesting a table.'), menuTitle: t('Elige tu Trama', 'Choose your Trama'), menuIntro: t('Centro, Ría o Taller: la ocasión decide el local.', 'Centro, Ría or Taller: the occasion chooses the venue.'), menu: [item('Trama Centro', 'Trama Centro', 'Carta urbana y barra abierta', 'Urban menu and open bar'), item('Trama Ría', 'Trama Ría', 'Pescado, brasa y sobremesa', 'Fish, fire and long lunches'), item('Trama Taller', 'Trama Taller', 'Grupos, pases y mesa común', 'Groups, set menus and shared table')], storyTitle: t('Una marca, tres decisiones claras.', 'One brand, three clear choices.'), story: t('La arquitectura separa ubicación, carta y disponibilidad sin convertir el grupo en un directorio frío de locales.', 'The architecture separates location, menu and availability without turning the group into a cold venue directory.'), hours: t('Horarios según local', 'Hours vary by venue'), address: t('Tres direcciones ficticias en Bilbao', 'Three fictional Bilbao addresses') },
  },
  {
    slug: 'umbral', name: 'Umbral', mark: 'UM', format: t('Restaurante de hotel', 'Hotel restaurant'), location: t('Sevilla', 'Seville'),
    promise: t('La ciudad entra por el comedor.', 'The city enters through the dining room.'), tone: t('Hospitalario, cultural y pausado', 'Hospitable, cultured and unhurried'), level: t('Dirección web', 'Website direction'),
    depth: 'web-only', layout: 'split', type: 'mixed', palette: { primary: '#49384f', accent: '#b79761', paper: '#f2eee7', ink: '#2e2531', muted: '#746c73' }, screenshotBase: '12-umbral-web',
    web: { body: t('Desayunos abiertos a la ciudad, sobremesas bajo el patio y cenas para huéspedes y vecinos. Hotel y restaurante se encuentran sin confundirse.', 'Breakfast open to the city, lunches beneath the courtyard and dinner for guests and neighbours. Hotel and restaurant meet without becoming the same thing.'), menuTitle: t('Del patio a la mesa', 'From courtyard to table'), menuIntro: t('Tres momentos que no exigen alojarse.', 'Three moments that do not require an overnight stay.'), menu: [item('Desayuno Umbral', 'Umbral breakfast', 'Panadería, fruta y cocina caliente', 'Bakery, fruit and hot kitchen'), item('Mesa de patio', 'Courtyard lunch', 'Andalucía en cuatro pases', 'Andalusia in four courses'), item('Cena de ciudad', 'City dinner', 'Carta corta hasta medianoche', 'Short menu until midnight')], storyTitle: t('El restaurante tiene puerta propia.', 'The restaurant has its own front door.'), story: t('La dirección separa la reserva de mesa de la estancia y explica qué espacios pertenecen al restaurante antes de mezclar servicios del hotel.', 'The direction separates table booking from hotel stays and explains which spaces belong to the restaurant before mixing hotel services.'), hours: t('Todos los días · 07:30–00:00', 'Daily · 07:30–00:00'), address: t('Hotel ficticio Umbral · Patio Sur', 'Fictional Umbral Hotel · South Courtyard') },
  },
  {
    slug: 'nacre', name: 'Nacre', mark: 'N', format: t('Alta cocina', 'Fine dining'), location: t('San Sebastián', 'San Sebastián'),
    promise: t('El detalle cambia la memoria de la noche.', 'Detail changes how the evening is remembered.'), tone: t('Mínimo, preciso y sensorial', 'Minimal, precise and sensory'), level: t('Dirección web', 'Website direction'),
    depth: 'web-only', layout: 'minimal', type: 'serif', palette: { primary: '#181818', accent: '#aaa296', paper: '#f4f2ee', ink: '#161616', muted: '#706d68' }, screenshotBase: '13-nacre-web',
    web: { body: t('Una secuencia de temporada, doce mesas y un servicio que empieza al confirmar restricciones y ritmo de la experiencia.', 'A seasonal sequence, twelve tables and service that begins by confirming dietary needs and the pace of the experience.'), menuTitle: t('Una única secuencia', 'One sequence'), menuIntro: t('El menú cambia; la forma de recibir permanece.', 'The menu changes; the way of welcoming remains.'), menu: [item('Marea', 'Tide', 'Mar, sal y fermentos', 'Sea, salt and ferments'), item('Bosque', 'Forest', 'Hojas, humo y fondo oscuro', 'Leaves, smoke and dark stock'), item('Luz', 'Light', 'Cítricos, leche y flores', 'Citrus, milk and flowers')], storyTitle: t('Menos información. Más intención.', 'Less information. More intent.'), story: t('La web elimina ruido, explica duración y condiciones, y reserva el protagonismo para la secuencia y el servicio.', 'The website removes noise, explains duration and terms, and leaves the sequence and service in the foreground.'), hours: t('Mié–sáb · 20:00', 'Wed–Sat · 20:00'), address: t('Paseo ficticio de Miraconcha, 4', '4 Fictional Miraconcha Walk') },
  },
  {
    slug: 'brisa-alta', name: 'Brisa Alta', mark: 'BA', format: t('Terraza estacional', 'Seasonal terrace'), location: t('Málaga', 'Málaga'),
    promise: t('La mesa empieza con la luz.', 'The table begins with the light.'), tone: t('Abierto, luminoso y estacional', 'Open, bright and seasonal'), level: t('Dirección web', 'Website direction'),
    depth: 'web-only', layout: 'panorama', type: 'sans', palette: { primary: '#166c8c', accent: '#e78b53', paper: '#fff4e8', ink: '#153d4d', muted: '#667d83' }, screenshotBase: '14-brisa-alta-web',
    web: { body: t('Una terraza que cambia de hora, carta y temperatura. La web hace visible la temporada y qué ocurre si el tiempo no acompaña.', 'A terrace that changes with time, menu and temperature. The website makes the season and weather policy visible.'), menuTitle: t('Carta de cielo abierto', 'Open-sky menu'), menuIntro: t('Platos frescos, brasas suaves y cócteles al caer el sol.', 'Fresh plates, gentle fire and cocktails at sunset.'), menu: [item('Tomate y almendra', 'Tomato and almond', 'Huerta, ajo blanco y albahaca', 'Garden tomato, almond and basil'), item('Pescado a la brasa', 'Grilled fish', 'Pieza del día y limón asado', 'Daily catch and roasted lemon'), item('Brisa 19:42', 'Brisa 19:42', 'Pomelo, hierbabuena y sal', 'Grapefruit, mint and salt')], storyTitle: t('La temporada es parte del producto.', 'The season is part of the product.'), story: t('El diseño prioriza apertura, franjas horarias y política meteorológica para no prometer una terraza fuera de contexto.', 'The design prioritises opening dates, time slots and weather policy so the terrace is never promised out of context.'), hours: t('May–oct · 18:00–01:00', 'May–Oct · 18:00–01:00'), address: t('Azotea ficticia del Puerto, 6', '6 Fictional Harbour Rooftop') },
  },
  {
    slug: 'nave-nueve', name: 'Nave Nueve', mark: 'N9', format: t('Local de eventos', 'Events venue'), location: t('Madrid', 'Madrid'),
    promise: t('Cada celebración cambia el espacio.', 'Every celebration changes the space.'), tone: t('Industrial, flexible y contundente', 'Industrial, flexible and bold'), level: t('Dirección web', 'Website direction'),
    depth: 'web-only', layout: 'poster', type: 'condensed', palette: { primary: '#1e1e1e', accent: '#d8f15a', paper: '#eeede8', ink: '#1b1b1b', muted: '#66645f' }, screenshotBase: '15-nave-nueve-web',
    web: { body: t('Una nave diáfana para comidas, lanzamientos y celebraciones. La web empieza por aforo, montaje y fecha, no por una mesa estándar.', 'An open venue for dinners, launches and celebrations. The website begins with capacity, layout and date, not a standard table.'), menuTitle: t('Tres maneras de ocuparla', 'Three ways to use it'), menuIntro: t('El espacio cambia antes que el evento empiece.', 'The room changes before the event begins.'), menu: [item('Mesa larga', 'Long table', 'Hasta 80 personas sentadas', 'Up to 80 seated guests'), item('Cóctel abierto', 'Open cocktail', 'Circulación y cuatro estaciones', 'Free flow and four food stations'), item('Escena completa', 'Full stage', 'Cena, presentación y música', 'Dinner, presentation and music')], storyTitle: t('Primero el plano. Después la propuesta.', 'Floor plan first. Proposal second.'), story: t('La dirección convierte medidas, aforo y formatos en una lectura comercial clara antes de abrir un circuito de grupos por proyecto.', 'The direction turns dimensions, capacity and formats into a clear commercial read before opening a project-specific group journey.'), hours: t('Visitas con cita previa', 'Visits by appointment'), address: t('Distrito industrial ficticio · Nave 9', 'Fictional industrial district · Unit 9') },
  },
  {
    slug: 'miga-club', name: 'Miga Club', mark: 'MC', format: t('Cadena casual', 'Casual chain'), location: t('Barcelona · 4 locales', 'Barcelona · 4 venues'),
    promise: t('Comer bien entre una cosa y la siguiente.', 'Eat well between one thing and the next.'), tone: t('Rápido, alegre y reconocible', 'Fast, cheerful and recognisable'), level: t('Dirección web', 'Website direction'),
    depth: 'web-only', layout: 'modular', type: 'sans', palette: { primary: '#2154d1', accent: '#f3d647', paper: '#fff9e4', ink: '#152653', muted: '#657093' }, screenshotBase: '16-miga-club-web',
    web: { body: t('Bocadillos calientes, platos de mediodía y cuatro locales con el mismo pulso. La web resuelve ubicación y ocasión en pocos segundos.', 'Hot sandwiches, lunch plates and four venues with the same rhythm. The website resolves location and occasion in seconds.'), menuTitle: t('Tu pausa, a tu manera', 'Your break, your way'), menuIntro: t('Comer aquí, recoger o encontrar el local más cercano.', 'Eat in, pick up or find the nearest venue.'), menu: [item('Miga caliente', 'Hot Miga', 'Pollo, encurtidos y salsa Club', 'Chicken, pickles and Club sauce'), item('Plato del día', 'Plate of the day', 'Verdura, cereal y guiso', 'Vegetables, grain and stew'), item('Combo tarde', 'Afternoon combo', 'Bocadillo, bebida y fruta', 'Sandwich, drink and fruit')], storyTitle: t('La consistencia también puede tener carácter.', 'Consistency can still have character.'), story: t('Un sistema modular conserva marca y velocidad, pero deja que cada local explique barrio, horario y disponibilidad sin duplicar la web.', 'A modular system preserves brand and speed while each venue can explain its neighbourhood, hours and availability without duplicating the website.'), hours: t('Lun–dom · 09:00–23:00', 'Mon–Sun · 09:00–23:00'), address: t('Cuatro direcciones ficticias en Barcelona', 'Four fictional Barcelona addresses') },
  },
  {
    slug: 'mercat-33', name: 'Mercat 33', mark: '33', format: t('Espacio gastronómico', 'Food hall'), location: t('Valencia', 'Valencia'),
    promise: t('Muchas cocinas. Una sola mesa.', 'Many kitchens. One table.'), tone: t('Plural, local y cartográfico', 'Plural, local and map-like'), level: t('Dirección web', 'Website direction'),
    depth: 'web-only', layout: 'market', type: 'mixed', palette: { primary: '#7a2430', accent: '#2d8a7a', paper: '#f6f0e6', ink: '#3c2527', muted: '#756666' }, screenshotBase: '17-mercat-33-web',
    web: { body: t('Ocho cocinas, una barra central y mesas compartidas. La web funciona como mapa: qué hay, dónde está y cuándo ocurre.', 'Eight kitchens, one central bar and shared tables. The website works as a map: what is on, where it is and when it happens.'), menuTitle: t('El mercado hoy', 'The market today'), menuIntro: t('Cocinas independientes, horarios compartidos y una agenda común.', 'Independent kitchens, shared hours and one common programme.'), menu: [item('Puesto 04 · Mar', 'Stall 04 · Sea', 'Crudos, fritura y conserva', 'Raw fish, fried bites and preserves'), item('Puesto 11 · Masa', 'Stall 11 · Dough', 'Horno, fermento y temporada', 'Oven, fermentation and season'), item('Patio 33', 'Courtyard 33', 'Catas, música y mesas largas', 'Tastings, music and long tables')], storyTitle: t('Orientarse también forma parte de reservar.', 'Finding your way is part of booking.'), story: t('La dirección agrupa puestos, agenda y zonas sin fingir un único restaurante. Cualquier reserva de grupo se plantea como circuito por proyecto.', 'The direction groups stalls, events and zones without pretending it is one restaurant. Any group booking journey is scoped per project.'), hours: t('Mar–dom · 10:00–00:00', 'Tue–Sun · 10:00–00:00'), address: t('Mercado ficticio del Turia, 33', '33 Fictional Turia Market') },
  },
] as const satisfies readonly ThemeEntry[];

export type ThemeSlug = (typeof THEME_CATALOG)[number]['slug'];

export const localizedThemeText = (value: ThemeText, locale: Locale): string => value[locale];

export const themeUrl = (slug: ThemeSlug, locale: Locale = 'es'): string =>
  `${locale === 'en' ? '/en' : ''}/demos/${slug}/`;

export const themeDetailUrl = (slug: ThemeSlug, locale: Locale = 'es'): string =>
  `${locale === 'en' ? '/en' : ''}/temas/${slug}/`;

export const themeContactUrl = (slug: ThemeSlug, locale: Locale = 'es'): string =>
  `${locale === 'en' ? '/en' : ''}/empezar/?theme=${slug}`;

export const themeMetaDescription = (theme: ThemeEntry): ThemeText => ({
  es: `Explora la dirección web ${theme.name} de Logic Reserva para ${theme.format.es.toLocaleLowerCase()}: una demo ficticia ${theme.tone.es.toLocaleLowerCase()} con alcance y límites claros.`,
  en: `Explore the ${theme.name} website direction by Logic Reserva for a ${theme.format.en.toLocaleLowerCase()}: a fictional, ${theme.tone.en.toLocaleLowerCase()} demo with scope and limits.`,
});

export const getTheme = (slug: string): ThemeEntry | undefined =>
  THEME_CATALOG.find((theme) => theme.slug === slug);

export const WEB_ONLY_THEMES = THEME_CATALOG.filter((theme) => theme.depth === 'web-only');
