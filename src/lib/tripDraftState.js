import { DATA_MODE, isRealDataMode } from './dataMode.js';

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

function buildProgressiveTrip(hotel, existing) {
  const city = hotel.city || hotel.raw?.city || 'Destino';
  const title = existing?.title || `${city} — roteiro em construção`;
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
    dates: existing?.dates || 'Datas a definir',
    state: 'Em planejamento',
    travelers: existing?.travelers || 'A definir',
    budget: existing?.budget || 'A definir',
    tone: existing?.tone || tones[readPayload().length % tones.length],
    cover: existing?.cover || city,
    coverSeed: existing?.coverSeed || `real-trip-${slug(city)}`,
    coverLabel: existing?.coverLabel || city,
    progress: Math.max(existing?.progress || 0, 24),
    blurb: `Roteiro progressivo com base em ${city}. Hotel aplicado; voos, passeios e dias ainda podem ser completados.`,
    baseCity: city,
    destination: hotel.raw?.destination || city,
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
  const trips = readPayload();
  const city = hotel.city || hotel.raw?.city || 'Destino';
  const existingIndex = trips.findIndex((trip) => trip.baseCity === city || trip.appliedHotel?.id === hotel.id);
  const existing = existingIndex >= 0 ? trips[existingIndex] : null;
  const nextTrip = buildProgressiveTrip(hotel, existing);
  const nextTrips = existingIndex >= 0
    ? trips.map((trip, index) => (index === existingIndex ? nextTrip : trip))
    : [nextTrip, ...trips];
  writePayload(nextTrips);
  return nextTrip;
}

export function subscribeTrips(callback) {
  const handler = (event) => callback(event.detail?.trips || readPayload());
  window.addEventListener(TRIP_EVENT, handler);
  return () => window.removeEventListener(TRIP_EVENT, handler);
}
