import { DATA_MODE } from './dataMode.js';

const ACTIVE_TRIP_CONTEXT_KEYS = {
  mock: 'voya_mock_active_trip_context',
  real: 'voya_real_active_trip_context',
};
const ACTIVE_TRIP_CONTEXT_EVENT = 'voya:active-trip-context-updated';

const EMPTY_CONTEXT = {
  destination: '',
  city: '',
  country: '',
  travelers: '',
  dates: '',
  flexibility: '',
  hotel: null,
  flights: [],
  tours: [],
  tripStyle: '',
  accommodationStyle: '',
  budget: '',
  priority: '',
  purpose: '',
  tripId: '',
};

function compact(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''));
  return value;
}

function normalizePatch(patch = {}) {
  const dateRange = patch.dates || ((patch.userProvidedDates && (patch.checkIn || patch.checkOut))
    ? [patch.checkIn, patch.checkOut].filter(Boolean).join(' → ')
    : '');
  const normalized = {
    destination: patch.destination || patch.city || '',
    city: patch.city || patch.destination || '',
    country: patch.country || '',
    travelers: patch.travelers || patch.profile || '',
    dates: dateRange,
    flexibility: patch.flexibility || (String(dateRange || '').includes('flex') ? 'flexível' : ''),
    hotel: patch.hotel || null,
    flights: patch.flights || [],
    tours: patch.tours || [],
    tripStyle: patch.tripStyle || patch.style || '',
    accommodationStyle: patch.accommodationStyle || '',
    budget: patch.userProvidedBudget ? patch.budget || '' : '',
    priority: patch.priority || patch.priorities?.[0] || '',
    purpose: patch.purpose || patch.tripPurpose || '',
    tripId: patch.tripId || '',
  };
  return Object.fromEntries(Object.entries(normalized).map(([key, value]) => [key, compact(value)]).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === 'object') return Object.keys(value).length > 0;
    return Boolean(value);
  }));
}

export function getActiveTripContext() {
  try {
    const payload = JSON.parse(window.localStorage.getItem(ACTIVE_TRIP_CONTEXT_KEYS[DATA_MODE]) || 'null');
    return { ...EMPTY_CONTEXT, ...(payload?.context || {}) };
  } catch {
    return { ...EMPTY_CONTEXT };
  }
}

export function saveActiveTripContext(context = {}) {
  const next = { ...EMPTY_CONTEXT, ...compact(context), updatedAt: Date.now(), dataMode: DATA_MODE };
  window.localStorage.setItem(ACTIVE_TRIP_CONTEXT_KEYS[DATA_MODE], JSON.stringify({
    savedAt: Date.now(),
    dataMode: DATA_MODE,
    context: next,
  }));
  window.dispatchEvent(new CustomEvent(ACTIVE_TRIP_CONTEXT_EVENT, { detail: { context: next } }));
  return next;
}

export function mergeActiveTripContext(patch = {}) {
  const current = getActiveTripContext();
  return saveActiveTripContext({ ...current, ...normalizePatch(patch) });
}

export function updateActiveContextFromHotel(hotel = {}) {
  const current = getActiveTripContext();
  return mergeActiveTripContext({
    destination: current.destination || hotel.searchQuery?.destination || hotel.raw?.destination || hotel.city,
    city: hotel.city || current.city,
    hotel: {
      id: hotel.id,
      name: hotel.name,
      city: hotel.city,
      rating: hotel.rating,
      reviewCount: hotel.reviewCount,
      nightlyRate: hotel.nightlyRate,
      totalRate: hotel.totalRate,
      bookingUrl: hotel.bookingUrl,
      provider: hotel.provider,
      recommendationReason: hotel.perk,
      raw: hotel.raw,
    },
    accommodationStyle: hotel.raw?.style || hotel.perk || '',
  });
}

export function activeTripContextToText(context = getActiveTripContext()) {
  return [
    context.destination && `Destino: ${context.destination}.`,
    context.city && `Cidade: ${context.city}.`,
    context.country && `País: ${context.country}.`,
    context.travelers && `Viajantes: ${context.travelers}.`,
    context.dates && `Datas: ${context.dates}.`,
    context.flexibility && `Flexibilidade: ${context.flexibility}.`,
    context.tripStyle && `Estilo: ${context.tripStyle}.`,
    context.accommodationStyle && `Hospedagem: ${context.accommodationStyle}.`,
    context.budget && `Orçamento: ${context.budget}.`,
    context.priority && `Prioridade: ${context.priority}.`,
    context.purpose && `Propósito: ${context.purpose}.`,
    context.hotel?.name && `Hotel aplicado: ${context.hotel.name} em ${context.hotel.city || context.city || context.destination}.`,
  ].filter(Boolean).join(' ');
}

export function subscribeActiveTripContext(callback) {
  const handler = (event) => callback(event.detail?.context || getActiveTripContext());
  window.addEventListener(ACTIVE_TRIP_CONTEXT_EVENT, handler);
  return () => window.removeEventListener(ACTIVE_TRIP_CONTEXT_EVENT, handler);
}
