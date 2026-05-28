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

export function mapHotelSearchResult(hotel, index = 0) {
  return {
    id: hotel.id || `hotel-${index}`,
    name: hotel.name || 'Hotel sugerido',
    city: hotel.city || 'Destino',
    image: hotel.image || null,
    rating: hotel.rating || 0,
    reviewCount: hotel.reviewCount || 0,
    nights: hotel.nights || 4,
    price: hotel.nightlyRate || hotel.totalRate || 'Sob consulta',
    nightlyRate: hotel.nightlyRate || 'Sob consulta',
    perk: hotel.matchReason || hotel.bestFor || formatReviews(hotel.reviewCount) || 'Curadoria Voya',
    tone: tones[index % tones.length],
    tag: hotel.provider ? String(hotel.provider).toUpperCase() : 'Voya Collection',
    bookingUrl: hotel.bookingUrl || null,
    provider: hotel.provider || null,
    cancellationPolicy: hotel.cancellationPolicy || 'A confirmar',
    raw: hotel,
  };
}

export function getStoredHotelSearchResults() {
  try {
    const payload = JSON.parse(window.localStorage.getItem(HOTEL_SEARCH_STORAGE_KEYS[DATA_MODE]) || 'null');
    if (!Array.isArray(payload?.options)) return [];
    return payload.options.map(mapHotelSearchResult);
  } catch {
    return [];
  }
}

export function saveHotelSearchResults(options = [], { status = 'mocked' } = {}) {
  if (!Array.isArray(options) || !options.length) return;
  if (isRealDataMode() && status !== 'live') return;

  window.localStorage.setItem(HOTEL_SEARCH_STORAGE_KEYS[DATA_MODE], JSON.stringify({
    savedAt: Date.now(),
    dataMode: DATA_MODE,
    status,
    options,
  }));
  window.dispatchEvent(new CustomEvent(HOTEL_SEARCH_EVENT, { detail: { options, status } }));
}

export function subscribeHotelSearchResults(callback) {
  const handler = (event) => callback((event.detail?.options || []).map(mapHotelSearchResult));
  window.addEventListener(HOTEL_SEARCH_EVENT, handler);
  return () => window.removeEventListener(HOTEL_SEARCH_EVENT, handler);
}
