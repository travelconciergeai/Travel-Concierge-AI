import { DATA_MODE, isRealDataMode } from './dataMode.js';
import { getActiveTripContext, mergeActiveTripContext, updateActiveContextFromHotel } from './activeTripContext.js';

const TRIP_STORAGE_KEYS = {
  mock: 'voya_mock_trips',
  real: 'voya_real_trips',
};
const TRIP_EVENT = 'voya:trip-drafts-updated';

const tones = ['warm', 'sage', 'cool', 'coral'];

function readPayload() {
  try {
    const payload = JSON.parse(window.localStorage.getItem(TRIP_STORAGE_KEYS[DATA_MODE]) || 'null');
    return Array.isArray(payload?.trips) ? payload.trips : [];
  } catch {
    return [];
  }
}

function writePayload(trips) {
  window.localStorage.setItem(TRIP_STORAGE_KEYS[DATA_MODE], JSON.stringify({
    savedAt: Date.now(),
    dataMode: DATA_MODE,
    trips,
  }));
  window.dispatchEvent(new CustomEvent(TRIP_EVENT, { detail: { trips } }));
}

function slug(value = 'viagem') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    || 'viagem';
}

function formatHotelPrice(hotel = {}) {
  const total = hotel.totalRate || hotel.raw?.totalRate;
  const nightly = hotel.nightlyRate || hotel.raw?.nightlyRate;
  if (total && nightly) return `${nightly}/noite · ${total} total`;
  return nightly || total || 'valor a confirmar';
}

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function isDestinationCompatible(destination = '', hotelCity = '') {
  const contextDestination = normalizeText(destination);
  const city = normalizeText(hotelCity);
  if (!contextDestination || !city || contextDestination === 'a definir' || city === 'a definir') return true;
  if (contextDestination.includes(city) || city.includes(contextDestination)) return true;

  const aliasGroups = [
    ['lisboa', 'lisbon'],
    ['porto', 'oporto'],
    ['roma', 'rome'],
    ['florenca', 'florence'],
    ['milao', 'milan'],
    ['nova york', 'new york'],
    ['toquio', 'tokyo'],
  ];
  if (aliasGroups.some((group) => group.some((alias) => contextDestination.includes(alias)) && group.some((alias) => city.includes(alias)))) return true;

  const countryCities = {
    portugal: ['lisboa', 'lisbon', 'porto', 'oporto', 'douro', 'lamego', 'sintra', 'cascais'],
    argentina: ['buenos aires', 'mendoza', 'bariloche', 'ushuaia'],
    brasil: ['sao paulo', 'rio de janeiro', 'salvador', 'florianopolis'],
    estadosunidos: ['orlando', 'miami', 'nova york', 'new york', 'los angeles'],
    franca: ['paris', 'nice', 'lyon', 'bordeaux'],
    italia: ['roma', 'veneza', 'florenca', 'milao'],
    japao: ['toquio', 'kyoto', 'osaka'],
  };

  const compactDestination = contextDestination.replace(/\s+/g, '');
  return countryCities[compactDestination]?.some((knownCity) => city.includes(knownCity)) || false;
}

function formatTravelers(value) {
  const text = String(value || '').trim();
  if (!text) return 'A definir';
  if (/^\d+$/.test(text)) return `${text} viajantes`;
  return text;
}

function buildProgressiveTrip(hotel, existing) {
  const activeContext = getActiveTripContext();
  const city = hotel.city || hotel.raw?.city || activeContext.city || activeContext.destination || 'A definir';
  const destination = activeContext.destination || activeContext.country || city || 'A definir';
  const title = existing?.title || `${destination} — roteiro em construção`;
  const hotelItem = {
    t: 'tarde',
    title: hotel.name,
    place: city,
    dur: hotel.nights ? `${hotel.nights} noites` : 'estadia a confirmar',
    tag: 'hotel',
    vibe: hotel.perk || 'hotel aplicado',
    conf: true,
    bookingUrl: hotel.bookingUrl || null,
    provider: hotel.provider || hotel.raw?.provider || null,
    price: formatHotelPrice(hotel),
  };

  return {
    id: existing?.id || `real-trip-${slug(city)}-${Date.now()}`,
    title,
    dates: existing?.dates || activeContext.dates || activeContext.flexibility || 'A definir',
    state: 'Em planejamento',
    travelers: existing?.travelers || formatTravelers(activeContext.travelers),
    budget: existing?.budget || activeContext.budget || 'A definir',
    tone: existing?.tone || tones[readPayload().length % tones.length],
    cover: existing?.cover || city,
    coverSeed: existing?.coverSeed || `real-trip-${slug(city)}`,
    coverLabel: existing?.coverLabel || city,
    progress: Math.max(existing?.progress || 0, 24),
    blurb: `Roteiro progressivo com base em ${city}. Hotel aplicado; voos, passeios e dias ainda podem ser completados.`,
    baseCity: city,
    destination,
    appliedHotel: {
      id: hotel.id,
      name: hotel.name,
      city,
      rating: hotel.rating,
      reviewCount: hotel.reviewCount,
      nightlyRate: hotel.nightlyRate,
      totalRate: hotel.totalRate,
      bookingUrl: hotel.bookingUrl,
      provider: hotel.provider,
      recommendationReason: hotel.perk,
      raw: hotel.raw,
    },
    days: [
      {
        d: 1,
        date: 'Chegada',
        city,
        items: [hotelItem],
      },
      {
        d: 2,
        date: 'Dia livre',
        city,
        items: [],
      },
      {
        d: 3,
        date: 'A completar',
        city,
        items: [],
      },
    ],
    insights: [
      { kind: 'tip', text: 'Próximo passo: buscar voos para este roteiro.' },
      { kind: 'benefit', text: 'Adicionar passeios ajuda a equilibrar localização, ritmo e deslocamentos.' },
      { kind: 'miles', text: 'Quando houver voos, dá para avaliar milhas e benefícios da Wallet.' },
    ],
    nextSteps: [
      'Buscar voos para este roteiro',
      'Adicionar passeios',
      'Editar dias da viagem',
      'Ver roteiro em Minhas Viagens',
    ],
    updatedAt: Date.now(),
  };
}

export function getStoredTrips() {
  return readPayload();
}

export function getStoredTripById(id) {
  return readPayload().find((trip) => trip.id === id) || null;
}

export function getMostRecentTrip() {
  return readPayload().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0] || null;
}

export function applyHotelToProgressiveTrip(hotel) {
  if (isRealDataMode() && hotel.searchStatus !== 'live') return null;
  const activeContext = getActiveTripContext();
  const hotelCity = hotel.city || hotel.raw?.city || '';
  const contextDestination = activeContext.destination || activeContext.city || hotel.searchQuery?.destination || hotel.raw?.destination || '';
  if (!isDestinationCompatible(contextDestination, hotelCity)) return null;

  updateActiveContextFromHotel(hotel);
  const trips = readPayload();
  const city = hotelCity || activeContext.city || activeContext.destination || 'A definir';
  const cityKey = normalizeText(city);
  const destinationKey = normalizeText(activeContext.destination || hotel.searchQuery?.destination || '');
  const existingIndex = trips.findIndex((trip) => (
    trip.id === activeContext.tripId
    || normalizeText(trip.baseCity) === cityKey
    || (destinationKey && normalizeText(trip.destination) === destinationKey)
    || trip.appliedHotel?.id === hotel.id
  ));
  const existing = existingIndex >= 0 ? trips[existingIndex] : null;
  const nextTrip = buildProgressiveTrip(hotel, existing);
  const nextTrips = existingIndex >= 0
    ? trips.map((trip, index) => (index === existingIndex ? nextTrip : trip))
    : [nextTrip, ...trips];
  writePayload(nextTrips);
  mergeActiveTripContext({ tripId: nextTrip.id });
  return nextTrip;
}

export function subscribeTrips(callback) {
  const handler = (event) => callback(event.detail?.trips || readPayload());
  window.addEventListener(TRIP_EVENT, handler);
  return () => window.removeEventListener(TRIP_EVENT, handler);
}
