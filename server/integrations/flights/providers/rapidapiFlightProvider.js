const DEFAULT_RAPIDAPI_HOST = 'flights-sky.p.rapidapi.com';

function toIsoDate(value, fallback) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function addParamIfPresent(params, key, value) {
  if (value !== undefined && value !== null && value !== '') {
    params.set(key, String(value));
  }
}

function getRapidApiHeaders(env, host) {
  return {
    'X-RapidAPI-Key': env.RAPIDAPI_KEY,
    'X-RapidAPI-Host': host,
  };
}

async function fetchRapidApiJson(pathname, params, env, host) {
  const timeoutMs = Number(env.RAPIDAPI_TIMEOUT_MS || 20000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const url = new URL(`https://${host}${pathname}`);
  Object.entries(params || {}).forEach(([key, value]) => addParamIfPresent(url.searchParams, key, value));

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getRapidApiHeaders(env, host),
      signal: controller.signal,
    });
    const text = await response.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { raw: text };
    }

    return {
      ok: response.ok,
      status: response.status,
      endpoint: pathname,
      payload,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function findArray(value, depth = 0) {
  if (!value || depth > 5) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== 'object') return [];

  const preferredKeys = [
    'flights',
    'itineraries',
    'results',
    'data',
    'items',
    'quotes',
    'legs',
    'segments',
  ];

  for (const key of preferredKeys) {
    if (Array.isArray(value[key])) return value[key];
  }

  for (const child of Object.values(value)) {
    const found = findArray(child, depth + 1);
    if (found.length) return found;
  }

  return [];
}

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

function getNested(value, paths = []) {
  for (const path of paths) {
    const current = path.split('.').reduce((acc, part) => first(acc)?.[part], value);
    if (current !== undefined && current !== null && current !== '') return current;
  }
  return null;
}

function getAirline(item) {
  return getNested(item, [
    'airline',
    'carrier',
    'carrier.name',
    'marketingCarrier.name',
    'operatingCarrier.name',
    'legs.carriers.marketing.name',
    'segments.airline',
    'segments.carrier.name',
  ]) || 'Companhia aérea';
}

function getFlightNumber(item) {
  return getNested(item, [
    'flightNumber',
    'flight',
    'number',
    'segments.flightNumber',
    'segments.flight.number',
    'legs.segments.flightNumber',
  ]) || 'Voo sugerido';
}

function getPrice(item) {
  return getNested(item, [
    'price.amount',
    'price.raw',
    'price',
    'totalPrice',
    'pricing.total',
    'fare.price',
    'content.price',
  ]);
}

function getCurrency(item) {
  return getNested(item, [
    'price.currency',
    'currency',
    'pricing.currency',
    'fare.currency',
  ]) || 'BRL';
}

function getStops(item) {
  const stops = getNested(item, ['stops', 'stopCount', 'legs.stopCount']);
  if (stops !== null) return Number(stops) || 0;

  const segments = findArray(item.segments || item.legs?.[0]?.segments || item.legs?.segments);
  return Math.max(0, segments.length - 1);
}

function getDurationMinutes(item) {
  const duration = getNested(item, [
    'durationMinutes',
    'durationInMinutes',
    'duration',
    'legs.durationInMinutes',
    'legs.duration',
  ]);

  if (typeof duration === 'number') return duration;
  const text = String(duration || '').toLowerCase();
  const iso = text.match(/pt(?:(\d+)h)?(?:(\d+)m)?/i);
  if (iso) return (Number(iso[1] || 0) * 60) + Number(iso[2] || 0);
  const hours = Number.parseFloat(text.match(/(\d+(?:[,.]\d+)?)\s*h/)?.[1]?.replace(',', '.') || '0');
  const minutes = Number.parseFloat(text.match(/(\d+)\s*m/)?.[1] || '0');
  return Math.round((hours * 60) + minutes) || 0;
}

function getBookingUrl(item) {
  return getNested(item, [
    'bookingUrl',
    'booking_url',
    'deepLink',
    'deeplink',
    'url',
    'pricingOptions.items.url',
    'pricingOptions.url',
  ]);
}

function getBaggage(item) {
  return getNested(item, [
    'baggage',
    'baggageIncluded',
    'fare.baggage',
    'segments.baggage',
  ]) || 'A confirmar';
}

function mapRapidApiFlight(item, query, index) {
  const origin = getNested(item, [
    'origin',
    'origin.code',
    'departure.airport',
    'departure.airportCode',
    'legs.origin.displayCode',
    'segments.origin',
  ]) || query.origin;
  const destination = getNested(item, [
    'destination',
    'destination.code',
    'arrival.airport',
    'arrival.airportCode',
    'legs.destination.displayCode',
    'segments.destination',
  ]) || query.destination;
  const stops = getStops(item);

  return {
    id: String(item.id || item.offerId || item.token || `rapidapi-flight-${index}`),
    provider: 'rapidapi',
    airline: getAirline(item),
    flightNumber: getFlightNumber(item),
    origin,
    destination,
    departure: getNested(item, [
      'departure',
      'departureTime',
      'departure.time',
      'legs.departure',
      'segments.departure',
    ]),
    arrival: getNested(item, [
      'arrival',
      'arrivalTime',
      'arrival.time',
      'legs.arrival',
      'segments.arrival',
    ]),
    durationMinutes: getDurationMinutes(item),
    stops,
    stopoverInfo: stops === 0 ? 'Direto' : `${stops} conexão${stops > 1 ? 'ões' : ''}`,
    price: getPrice(item),
    currency: getCurrency(item),
    bookingUrl: getBookingUrl(item),
    cabinClass: query.cabin,
    cabin: query.cabin,
    baggage: getBaggage(item),
    baggageIncluded: getBaggage(item),
    raw: item,
    recommendationReason: 'Resultado real consultado via Flights Scraper Sky.',
    confidence: 0.82,
  };
}

function buildFlightParams(query) {
  return {
    fromEntityId: query.origin,
    toEntityId: query.destination,
    origin: query.origin,
    destination: query.destination,
    departureDate: query.date,
    returnDate: query.returnDate,
    date: query.date,
    adults: query.travelers,
    cabinClass: query.cabin,
    currency: query.currency,
    market: query.market,
    locale: query.locale,
  };
}

export async function searchRapidApiFlights({
  origin = 'GRU',
  destination = 'LIS',
  date = '2026-10-12',
  returnDate = '',
  travelers = 2,
  cabin = 'economy',
  currency = 'BRL',
  market = 'BR',
  locale = 'pt-BR',
  env = process.env,
} = {}) {
  const host = env.FLIGHT_RAPIDAPI_HOST || env.RAPIDAPI_FLIGHT_HOST || env.RAPIDAPI_HOST || DEFAULT_RAPIDAPI_HOST;
  if (!env.RAPIDAPI_KEY || host !== DEFAULT_RAPIDAPI_HOST) {
    return {
      status: 'not-configured',
      provider: 'rapidapi',
      flights: [],
      errorMessage: 'Flight provider não configurado',
      reason: 'RAPIDAPI_KEY/FLIGHT_RAPIDAPI_HOST ausentes ou host inválido para Flights Scraper Sky.',
    };
  }

  const query = {
    origin,
    destination,
    date: toIsoDate(date, '2026-10-12'),
    returnDate: returnDate ? toIsoDate(returnDate, '2026-10-22') : '',
    travelers,
    cabin,
    currency,
    market,
    locale,
  };
  const pathname = query.returnDate ? '/flights/search-roundtrip' : '/flights/search-one-way';

  try {
    const searchResponse = await fetchRapidApiJson(pathname, buildFlightParams(query), env, host);
    const flights = findArray(searchResponse.payload)
      .filter((item) => item && typeof item === 'object')
      .slice(0, 12)
      .map((item, index) => mapRapidApiFlight(item, query, index))
      .filter((flight) => flight.airline || flight.price || flight.departure || flight.arrival);

    if (!searchResponse.ok || !flights.length) {
      return {
        status: 'error',
        provider: 'rapidapi',
        flights: [],
        errorMessage: 'Não foi possível consultar voos reais agora',
        errorStatus: searchResponse.status,
        endpoint: searchResponse.endpoint,
      };
    }

    return {
      status: 'live',
      provider: 'rapidapi',
      query,
      flights,
      endpoints: [pathname],
    };
  } catch (error) {
    return {
      status: 'error',
      provider: 'rapidapi',
      flights: [],
      errorMessage: 'Não foi possível consultar voos reais agora',
      errorDetail: error.message,
    };
  }
}
