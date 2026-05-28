const DEFAULT_BOOKING_HOST = 'booking-com15.p.rapidapi.com';

function toIsoDate(value, fallback) {
  return String(value || fallback).slice(0, 10);
}

function nightsBetween(checkIn, checkOut) {
  const start = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  const diff = Math.round((end - start) / 86400000);
  return Math.max(1, diff || 1);
}

function buildHeaders(env, host) {
  return {
    'Accept': 'application/json',
    'X-RapidAPI-Key': env.RAPIDAPI_KEY,
    'X-RapidAPI-Host': host,
  };
}

function classifyProviderIssue({ status, errorType, payload } = {}) {
  const message = String(
    payload?.message
    || payload?.error
    || payload?.errors?.[0]?.message
    || '',
  ).toLowerCase();

  if (errorType) return errorType;
  if (status === 401 || status === 403) return 'auth-error';
  if (status === 429 || message.includes('quota') || message.includes('limit')) return 'quota-error';
  if (status >= 500) return 'provider-unavailable';
  if (status >= 400) return 'provider-error';
  return null;
}

function summarizePayload(payload) {
  if (!payload || typeof payload !== 'object') return { type: typeof payload };
  const data = payload.data;
  return {
    topLevelKeys: Object.keys(payload).slice(0, 20),
    status: payload.status,
    message: payload.message || payload.error || null,
    dataType: Array.isArray(data) ? 'array' : typeof data,
    dataCount: Array.isArray(data) ? data.length : null,
    dataKeys: data && !Array.isArray(data) && typeof data === 'object' ? Object.keys(data).slice(0, 20) : [],
  };
}

async function fetchBookingJson(pathname, params, env, host) {
  const timeoutMs = Number(env.RAPIDAPI_TIMEOUT_MS || 15000);
  const url = new URL(`https://${host}${pathname}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const startedAt = Date.now();
  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: buildHeaders(env, host),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const errorType = ['AbortError', 'TimeoutError'].includes(error.name) ? 'timeout' : 'provider-unavailable';
    return {
      ok: false,
      status: null,
      payload: null,
      endpoint: pathname,
      url: url.toString(),
      elapsedMs: Date.now() - startedAt,
      errorType,
      errorMessage: error.message,
    };
  }

  let payload = null;
  let rawPreview = null;
  try {
    const raw = await response.text();
    rawPreview = raw.slice(0, 700);
    payload = raw ? JSON.parse(raw) : null;
  } catch (error) {
    return {
      ok: false,
      status: response.status,
      payload: null,
      endpoint: pathname,
      url: url.toString(),
      elapsedMs: Date.now() - startedAt,
      errorType: 'parsing-error',
      errorMessage: error.message,
      rawPreview,
    };
  }

  return {
    ok: response.ok && payload?.status !== false,
    status: response.status,
    payload,
    endpoint: pathname,
    url: url.toString(),
    elapsedMs: Date.now() - startedAt,
    errorType: classifyProviderIssue({ status: response.status, payload }),
    errorMessage: buildErrorDetail({ status: response.status, payload }),
    payloadSummary: summarizePayload(payload),
  };
}

function getFirstDestination(payload) {
  const items = Array.isArray(payload?.data) ? payload.data : [];
  return items.find((item) => item.search_type === 'city') || items[0] || null;
}

function buildErrorDetail(response) {
  const message = response.payload?.message
    || response.payload?.error
    || response.payload?.errors?.[0]?.message
    || null;

  if (response.status === 429) return message || 'RapidAPI retornou 429. Quota do provider Booking COM atingida.';
  if (response.status === 403) return message || 'RapidAPI retornou 403. Verifique assinatura, host e endpoint do provider Booking COM.';
  return message;
}

function buildDiagnostics({ host, endpoint, status, phase, response }) {
  const errorType = classifyProviderIssue({
    status,
    errorType: response?.errorType,
    payload: response?.payload,
  });

  return {
    host,
    endpoint,
    phase,
    status,
    errorType,
    elapsedMs: response?.elapsedMs || null,
    requiredHost: DEFAULT_BOOKING_HOST,
    requiredHeaders: ['X-RapidAPI-Key', 'X-RapidAPI-Host'],
    likelyCause: errorType === 'timeout'
      ? 'Timeout ao consultar o provider Booking COM.'
      : errorType === 'parsing-error'
        ? 'Provider respondeu algo que não pôde ser interpretado como JSON.'
        : status === 429
      ? 'Quota/limite do plano RapidAPI atingido.'
      : status === 403
        ? 'Chave sem assinatura no Booking COM, host incorreto ou endpoint fora do plano.'
        : status >= 400
          ? 'Parâmetros, endpoint ou disponibilidade do provider devem ser revisados.'
          : null,
    providerMessage: buildErrorDetail(response || {}),
    payloadSummary: response?.payloadSummary || null,
    rawPreview: response?.rawPreview || null,
  };
}

function buildProviderStep(phase, response, extra = {}) {
  return {
    phase,
    endpoint: response?.endpoint || null,
    status: response?.status || null,
    ok: Boolean(response?.ok),
    errorType: classifyProviderIssue({
      status: response?.status,
      errorType: response?.errorType,
      payload: response?.payload,
    }),
    errorMessage: response?.errorMessage || buildErrorDetail(response || {}) || null,
    elapsedMs: response?.elapsedMs || null,
    payloadSummary: response?.payloadSummary || summarizePayload(response?.payload),
    ...extra,
  };
}

function getHotels(payload) {
  if (Array.isArray(payload?.data?.hotels)) return payload.data.hotels;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.hotels)) return payload.hotels;
  return [];
}

function getDetails(payload) {
  return payload?.data || payload?.hotel || payload || {};
}

function getRooms(payload) {
  if (Array.isArray(payload?.data?.rooms)) return payload.data.rooms;
  if (Array.isArray(payload?.data?.block)) return payload.data.block;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rooms)) return payload.rooms;
  return [];
}

function getImage(hotel, details) {
  return hotel.property?.photoUrls?.[0]
    || hotel.property?.photoUrl
    || hotel.property?.mainPhotoUrl
    || details.main_photo_url
    || details.photo_url
    || details.photos?.[0]?.url
    || details.photos?.[0]?.large_url
    || null;
}

function getPrice(hotel, rooms, nights) {
  const gross = hotel.priceBreakdown?.grossPrice || hotel.property?.priceBreakdown?.grossPrice;
  const searchPrice = gross?.value ?? gross?.amount ?? hotel.priceBreakdown?.grossPrice?.price;
  const roomPrice = rooms[0]?.product_price_breakdown?.gross_amount?.value
    ?? rooms[0]?.price_breakdown?.gross_price
    ?? rooms[0]?.price;
  const total = Number(searchPrice ?? roomPrice);
  return Number.isFinite(total) ? Math.round((total / nights) * 100) / 100 : searchPrice ?? roomPrice ?? null;
}

function getTotalPrice(hotel, rooms) {
  const gross = hotel.priceBreakdown?.grossPrice || hotel.property?.priceBreakdown?.grossPrice;
  return gross?.value
    ?? gross?.amount
    ?? rooms[0]?.product_price_breakdown?.gross_amount?.value
    ?? rooms[0]?.price_breakdown?.gross_price
    ?? null;
}

function buildBookingUrl(hotelId, details, query) {
  const direct = details.url || details.hotel_url || details.deep_link_url;
  if (direct) return direct;

  const url = new URL(`https://www.booking.com/hotel/x.html`);
  url.searchParams.set('aid', '304142');
  url.searchParams.set('hotel_id', String(hotelId));
  url.searchParams.set('checkin', query.checkIn);
  url.searchParams.set('checkout', query.checkOut);
  url.searchParams.set('group_adults', String(query.guests));
  url.searchParams.set('no_rooms', '1');
  url.searchParams.set('selected_currency', 'BRL');
  return url.toString();
}

function mapBookingHotel(hotel, details, rooms, query) {
  const property = hotel.property || hotel;
  const hotelId = hotel.hotel_id || property.id || property.hotel_id || details.hotel_id;
  const nights = nightsBetween(query.checkIn, query.checkOut);
  const currency = hotel.priceBreakdown?.grossPrice?.currency
    || property.priceBreakdown?.grossPrice?.currency
    || rooms[0]?.product_price_breakdown?.gross_amount?.currency
    || 'BRL';

  return {
    id: hotelId,
    hotelId,
    name: property.name || details.hotel_name || details.name,
    city: property.wishlistName || details.city || details.city_name || query.destination,
    image: getImage(hotel, details),
    nightlyRate: getPrice(hotel, rooms, nights),
    totalRate: getTotalPrice(hotel, rooms),
    currency,
    rating: property.reviewScore || details.review_score || details.rawData?.reviewScore,
    reviewCount: property.reviewCount || details.review_nr || details.reviewCount,
    latitude: property.latitude || details.latitude,
    longitude: property.longitude || details.longitude,
    locationScore: property.reviewScoreLocation || details.location_score || 0,
    perks: [
      property.reviewScoreWord,
      rooms[0]?.mealplan,
      rooms[0]?.name,
    ].filter(Boolean),
    bestFor: property.reviewScoreWord ? `avaliação ${property.reviewScoreWord}` : 'hotel real via Booking.com',
    bookingUrl: buildBookingUrl(hotelId, details, query),
    cancellationPolicy: rooms[0]?.paymentterms?.cancellation?.description || rooms[0]?.refundable_until || 'Política a confirmar no Booking.com.',
    style: property.propertyClass ? `${property.propertyClass} estrelas` : 'hotel',
    provider: 'booking',
  };
}

export async function searchBookingHotels({
  destination = 'Lisboa',
  checkIn = '2026-10-12',
  checkOut = '2026-10-16',
  guests = 2,
  env = process.env,
} = {}) {
  const host = env.HOTEL_RAPIDAPI_HOST || env.RAPIDAPI_HOST || DEFAULT_BOOKING_HOST;
  const debugSteps = [];
  const debug = {
    provider: 'booking',
    host,
    hasRapidApiKey: Boolean(env.RAPIDAPI_KEY),
    dataMode: env.DATA_MODE || null,
    timeoutMs: Number(env.RAPIDAPI_TIMEOUT_MS || 15000),
    steps: debugSteps,
  };

  if (!env.RAPIDAPI_KEY || host !== DEFAULT_BOOKING_HOST) {
    return {
      status: 'not-configured',
      provider: 'booking',
      hotels: [],
      errorMessage: 'Hotel provider não configurado',
      reason: 'RAPIDAPI_KEY/HOTEL_RAPIDAPI_HOST ausentes ou host inválido para Booking COM.',
      diagnostics: {
        host,
        requiredHost: DEFAULT_BOOKING_HOST,
        requiredHeaders: ['X-RapidAPI-Key', 'X-RapidAPI-Host'],
        likelyCause: 'RAPIDAPI_KEY ausente ou HOTEL_RAPIDAPI_HOST diferente de booking-com15.p.rapidapi.com.',
      },
      debug: {
        ...debug,
        errorType: 'auth-error',
        config: {
          hasRapidApiKey: Boolean(env.RAPIDAPI_KEY),
          host,
          requiredHost: DEFAULT_BOOKING_HOST,
        },
      },
    };
  }

  const query = {
    destination,
    checkIn: toIsoDate(checkIn, '2026-10-12'),
    checkOut: toIsoDate(checkOut, '2026-10-16'),
    guests,
  };

  try {
    const destinationResponse = await fetchBookingJson('/api/v1/hotels/searchDestination', {
      query: destination,
    }, env, host);

    const resolvedDestination = getFirstDestination(destinationResponse.payload);
    debugSteps.push(buildProviderStep('destination', destinationResponse, {
      resolvedDestination: resolvedDestination ? {
        dest_id: resolvedDestination.dest_id,
        search_type: resolvedDestination.search_type,
        label: resolvedDestination.label || resolvedDestination.name || resolvedDestination.city_name || null,
      } : null,
    }));

    if (!destinationResponse.ok || !resolvedDestination?.dest_id || !resolvedDestination?.search_type) {
      return {
        status: 'error',
        provider: 'booking',
        hotels: [],
        errorMessage: 'Não foi possível consultar hotéis reais agora',
        errorStatus: destinationResponse.status,
        endpoint: destinationResponse.endpoint,
        errorDetail: buildErrorDetail(destinationResponse),
        diagnostics: buildDiagnostics({
          host,
          endpoint: destinationResponse.endpoint,
          status: destinationResponse.status,
          phase: 'destination',
          response: destinationResponse,
        }),
        debug: {
          ...debug,
          errorType: destinationResponse.errorType || 'empty-response',
        },
      };
    }

    const searchResponse = await fetchBookingJson('/api/v1/hotels/searchHotels', {
      dest_id: resolvedDestination.dest_id,
      search_type: resolvedDestination.search_type,
      arrival_date: query.checkIn,
      departure_date: query.checkOut,
      adults: guests,
      room_qty: 1,
      currency_code: 'BRL',
      languagecode: 'en-us',
      page_number: 1,
      units: 'metric',
    }, env, host);

    const hotels = getHotels(searchResponse.payload).slice(0, 8);
    debugSteps.push(buildProviderStep('search', searchResponse, {
      rawHotelCount: getHotels(searchResponse.payload).length,
      limitedHotelCount: hotels.length,
    }));

    if (!searchResponse.ok || !hotels.length) {
      return {
        status: 'error',
        provider: 'booking',
        hotels: [],
        errorMessage: 'Não foi possível consultar hotéis reais agora',
        errorStatus: searchResponse.status,
        endpoint: searchResponse.endpoint,
        errorDetail: buildErrorDetail(searchResponse),
        diagnostics: buildDiagnostics({
          host,
          endpoint: searchResponse.endpoint,
          status: searchResponse.status,
          phase: 'search',
          response: searchResponse,
        }),
        debug: {
          ...debug,
          errorType: searchResponse.errorType || 'empty-response',
        },
      };
    }

    const enrichedHotels = await Promise.all(hotels.map(async (hotel) => {
      const hotelId = hotel.hotel_id || hotel.property?.id;
      if (!hotelId) return mapBookingHotel(hotel, {}, [], query);

      const [detailsResponse, roomsResponse] = await Promise.all([
        fetchBookingJson('/api/v1/hotels/getHotelDetails', {
          hotel_id: hotelId,
          arrival_date: query.checkIn,
          departure_date: query.checkOut,
          adults: guests,
          room_qty: 1,
          units: 'metric',
          temperature_unit: 'c',
          languagecode: 'en-us',
          currency_code: 'BRL',
        }, env, host),
        fetchBookingJson('/api/v1/hotels/getRooms', {
          hotel_id: hotelId,
          arrival_date: query.checkIn,
          departure_date: query.checkOut,
          adults: guests,
          room_qty: 1,
          units: 'metric',
          languagecode: 'en-us',
          currency_code: 'BRL',
        }, env, host),
      ]);

      debugSteps.push({
        phase: 'enrichment',
        hotelId,
        details: buildProviderStep('details', detailsResponse),
        rooms: buildProviderStep('rooms', roomsResponse),
      });

      return mapBookingHotel(
        hotel,
        detailsResponse.ok ? getDetails(detailsResponse.payload) : {},
        roomsResponse.ok ? getRooms(roomsResponse.payload) : [],
        query,
      );
    }));

    return {
      status: 'live',
      provider: 'booking',
      hotels: enrichedHotels.filter((hotel) => hotel.id && hotel.name),
      destination: resolvedDestination,
      endpoints: [
        '/api/v1/hotels/searchDestination',
        '/api/v1/hotels/searchHotels',
        '/api/v1/hotels/getHotelDetails',
        '/api/v1/hotels/getRooms',
      ],
      diagnostics: {
        host,
        endpoint: '/api/v1/hotels/searchHotels',
        status: 'live',
        phase: 'complete',
        resolvedDestination,
        providerHotelCount: enrichedHotels.length,
        normalizedCandidateCount: enrichedHotels.filter((hotel) => hotel.id && hotel.name).length,
      },
      debug: {
        ...debug,
        rawHotelCount: hotels.length,
        mappedHotelCount: enrichedHotels.length,
        returnedHotelCount: enrichedHotels.filter((hotel) => hotel.id && hotel.name).length,
        sampleHotel: enrichedHotels.find((hotel) => hotel.id && hotel.name) || null,
      },
    };
  } catch (error) {
    return {
      status: 'error',
      provider: 'booking',
      hotels: [],
      errorMessage: 'Não foi possível consultar hotéis reais agora',
      errorDetail: error.message,
      diagnostics: {
        host,
        requiredHost: DEFAULT_BOOKING_HOST,
        likelyCause: 'Falha inesperada no adapter Booking COM.',
      },
      debug: {
        ...debug,
        errorType: 'provider-unavailable',
        errorMessage: error.message,
      },
    };
  }
}
