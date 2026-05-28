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
    'Accept': 'application/json',
    'User-Agent': 'VoyaTravelConcierge/1.0',
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
    'airports',
    'places',
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

function buildErrorDetail(response) {
  const message = response.payload?.message
    || response.payload?.error
    || response.payload?.errors?.[0]?.message
    || response.payload?.raw
    || null;

  if (response.status === 403) {
    return message || 'RapidAPI retornou 403. Verifique se a chave está inscrita no provider Flights Scraper Sky e se o host do plano é flights-sky.p.rapidapi.com.';
  }

  return message;
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

function getAirportCode(item) {
  return getNested(item, [
    'skyId',
    'sky_id',
    'iata',
    'iataCode',
    'code',
    'navigation.relevantFlightParams.skyId',
    'presentation.skyId',
  ]);
}

function getAirportEntityId(item) {
  return getNested(item, [
    'entityId',
    'entity_id',
    'navigation.relevantFlightParams.entityId',
    'presentation.entityId',
    'id',
  ]);
}

function pickAirport(payload, fallbackCode) {
  const fallback = String(fallbackCode || '').toUpperCase();
  const items = findArray(payload).filter((item) => item && typeof item === 'object');
  return items.find((item) => String(getAirportCode(item) || '').toUpperCase() === fallback)
    || items.find((item) => String(getNested(item, ['type', 'entityType', 'navigation.entityType']) || '').toLowerCase().includes('airport'))
    || items[0]
    || null;
}

async function resolveAirport({ query, fallbackCode, env, host }) {
  const response = await fetchRapidApiJson('/flights/airports', {
    query,
    market: env.FLIGHT_MARKET || 'BR',
    locale: env.FLIGHT_LOCALE || 'pt-BR',
  }, env, host);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      endpoint: response.endpoint,
      errorDetail: buildErrorDetail(response),
      airport: null,
    };
  }

  const airport = pickAirport(response.payload, fallbackCode);
  return {
    ok: Boolean(airport),
    status: response.status,
    endpoint: response.endpoint,
    errorDetail: airport ? null : 'A API não retornou aeroporto compatível.',
    airport,
    skyId: getAirportCode(airport) || fallbackCode,
    entityId: getAirportEntityId(airport),
  };
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
    fromEntityId: query.originEntityId,
    toEntityId: query.destinationEntityId,
    fromSkyId: query.originSkyId,
    toSkyId: query.destinationSkyId,
    fromId: query.originSkyId,
    toId: query.destinationSkyId,
    originSkyId: query.originSkyId,
    destinationSkyId: query.destinationSkyId,
    originEntityId: query.originEntityId,
    destinationEntityId: query.destinationEntityId,
    origin: query.origin,
    destination: query.destination,
    departureDate: query.date,
    departDate: query.date,
    returnDate: query.returnDate,
    date: query.date,
    adults: query.travelers,
    cabinClass: query.cabin,
    currency: query.currency,
    market: query.market,
    locale: query.locale,
  };
}

async function searchFlightsWithFallback({ pathname, query, env, host }) {
  const primary = await fetchRapidApiJson(pathname, buildFlightParams(query), env, host);
  if (primary.ok || pathname === '/flights/search-one-way' || primary.status !== 403) {
    return { response: primary, endpoint: pathname, fallbackFrom: null };
  }

  const fallback = await fetchRapidApiJson('/flights/search-one-way', {
    ...buildFlightParams({ ...query, returnDate: '' }),
    returnDate: '',
  }, env, host);

  return {
    response: fallback,
    endpoint: '/flights/search-one-way',
    fallbackFrom: pathname,
    originalResponse: primary,
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
    const [originAirport, destinationAirport] = await Promise.all([
      resolveAirport({ query: origin, fallbackCode: origin, env, host }),
      resolveAirport({ query: destination, fallbackCode: destination, env, host }),
    ]);

    if (!originAirport.ok || !destinationAirport.ok) {
      const failed = !originAirport.ok ? originAirport : destinationAirport;
      return {
        status: 'error',
        provider: 'rapidapi',
        flights: [],
        errorMessage: failed.status === 403
          ? 'Flights Scraper Sky retornou 403 ao resolver aeroportos'
          : 'Não foi possível resolver aeroportos reais agora',
        errorStatus: failed.status,
        endpoint: failed.endpoint,
        errorDetail: failed.errorDetail,
        diagnostics: {
          host,
          requiredHeaders: ['X-RapidAPI-Key', 'X-RapidAPI-Host'],
          requiredAirportLookup: true,
          originLookup: {
            status: originAirport.status,
            endpoint: originAirport.endpoint,
          },
          destinationLookup: {
            status: destinationAirport.status,
            endpoint: destinationAirport.endpoint,
          },
        },
      };
    }

    const resolvedQuery = {
      ...query,
      originSkyId: originAirport.skyId,
      destinationSkyId: destinationAirport.skyId,
      originEntityId: originAirport.entityId,
      destinationEntityId: destinationAirport.entityId,
    };
    const searchResult = await searchFlightsWithFallback({ pathname, query: resolvedQuery, env, host });
    const searchResponse = searchResult.response;
    const flights = findArray(searchResponse.payload)
      .filter((item) => item && typeof item === 'object')
      .slice(0, 12)
      .map((item, index) => mapRapidApiFlight(item, resolvedQuery, index))
      .filter((flight) => flight.airline || flight.price || flight.departure || flight.arrival);

    if (!searchResponse.ok || !flights.length) {
      return {
        status: 'error',
        provider: 'rapidapi',
        flights: [],
        errorMessage: searchResponse.status === 403
          ? 'Flights Scraper Sky retornou 403 na busca de voos'
          : 'Não foi possível consultar voos reais agora',
        errorStatus: searchResponse.status,
        endpoint: searchResponse.endpoint,
        errorDetail: buildErrorDetail(searchResponse),
        diagnostics: {
          host,
          endpoint: searchResult.endpoint,
          fallbackFromEndpoint: searchResult.fallbackFrom,
          originalRoundtripStatus: searchResult.originalResponse?.status || null,
          originalRoundtripError: searchResult.originalResponse ? buildErrorDetail(searchResult.originalResponse) : null,
          usedAirportLookup: true,
          originSkyId: resolvedQuery.originSkyId,
          originEntityId: resolvedQuery.originEntityId,
          destinationSkyId: resolvedQuery.destinationSkyId,
          destinationEntityId: resolvedQuery.destinationEntityId,
          requiredHeaders: ['X-RapidAPI-Key', 'X-RapidAPI-Host'],
          likelyCause: searchResponse.status === 403
            ? 'Chave sem assinatura nesse provider/endpoint ou endpoint indisponível no plano atual.'
            : null,
        },
      };
    }

    return {
      status: 'live',
      provider: 'rapidapi',
      query: resolvedQuery,
      flights,
      endpoints: ['/flights/airports', searchResult.endpoint],
      diagnostics: {
        host,
        fallbackFromEndpoint: searchResult.fallbackFrom,
        originalRoundtripStatus: searchResult.originalResponse?.status || null,
        usedAirportLookup: true,
        originSkyId: resolvedQuery.originSkyId,
        originEntityId: resolvedQuery.originEntityId,
        destinationSkyId: resolvedQuery.destinationSkyId,
        destinationEntityId: resolvedQuery.destinationEntityId,
      },
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
