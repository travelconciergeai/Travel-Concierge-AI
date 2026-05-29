import { DATA_MODE, isRealDataMode } from './dataMode.js';

const HOTEL_SEARCH_STORAGE_KEYS = {
  mock: 'voya_mock_hotels',
  real: 'voya_real_hotels',
};
const HOTEL_SEARCH_EVENT = 'voya:hotel-search-updated';

const tones = ['warm', 'coral', 'sage', 'cool'];

function formatReviews(count) {
  if (!count) return null;
  return `${Number(count).toLocaleString('pt-BR')} avaliações`;
}

function formatMoney(value, currency = 'BRL') {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string') return value;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function mapHotelSearchResult(hotel, index = 0, meta = {}) {
  const currency = hotel.currency || meta.currency || 'BRL';
  return {
    id: hotel.id || `hotel-${index}`,
    name: hotel.name || 'Hotel sugerido',
    city: hotel.city || 'A definir',
    image: hotel.image || null,
    rating: hotel.rating || 0,
    reviewCount: hotel.reviewCount || 0,
    nights: hotel.nights || 4,
    price: formatMoney(hotel.totalRate, currency) || formatMoney(hotel.nightlyRate, currency) || 'Sob consulta',
    nightlyRate: formatMoney(hotel.nightlyRate, currency) || 'Sob consulta',
    totalRate: formatMoney(hotel.totalRate, currency) || null,
    perk: hotel.matchReason || hotel.bestFor || formatReviews(hotel.reviewCount) || 'Curadoria Voya',
    tone: tones[index % tones.length],
    tag: hotel.provider ? String(hotel.provider).toUpperCase() : 'Voya Collection',
    bookingUrl: hotel.bookingUrl || null,
    provider: hotel.provider || null,
    searchStatus: meta.status || hotel.status || null,
    searchQuery: meta.query || null,
    cancellationPolicy: hotel.cancellationPolicy || 'A confirmar',
    raw: hotel,
  };
}

export function getStoredHotelSearchResults() {
  try {
    const payload = JSON.parse(window.localStorage.getItem(HOTEL_SEARCH_STORAGE_KEYS[DATA_MODE]) || 'null');
    if (!Array.isArray(payload?.options)) return [];
    return payload.options.map((hotel, index) => mapHotelSearchResult(hotel, index, payload));
  } catch {
    return [];
  }
}

export function saveHotelSearchResults(options = [], { status = 'mocked', query = null } = {}) {
  if (!Array.isArray(options) || !options.length) return;
  if (isRealDataMode() && status !== 'live') return;

  window.localStorage.setItem(HOTEL_SEARCH_STORAGE_KEYS[DATA_MODE], JSON.stringify({
    savedAt: Date.now(),
    dataMode: DATA_MODE,
    status,
    query,
    options,
  }));
  window.dispatchEvent(new CustomEvent(HOTEL_SEARCH_EVENT, { detail: { options, status, query } }));
}

export function subscribeHotelSearchResults(callback) {
  const handler = (event) => callback((event.detail?.options || []).map((hotel, index) => mapHotelSearchResult(hotel, index, event.detail || {})));
  window.addEventListener(HOTEL_SEARCH_EVENT, handler);
  return () => window.removeEventListener(HOTEL_SEARCH_EVENT, handler);
}
