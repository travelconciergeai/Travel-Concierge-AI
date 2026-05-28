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

async function fetchBookingJson(pathname, params, env, host) {
  const timeoutMs = Number(env.RAPIDAPI_TIMEOUT_MS || 15000);
  const url = new URL(`https://${host}${pathname}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(env, host),
    signal: AbortSignal.timeout(timeoutMs),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return {
    ok: response.ok && payload?.status !== false,
    status: response.status,
    payload,
    endpoint: pathname,
  };
}

function getFirstDestination(payload) {
  const items = Array.isArray(payload?.data) ? payload.data : [];
  return items.find((item) => item.search_type === 'city') || items[0] || null;
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
  if (!env.RAPIDAPI_KEY || host !== DEFAULT_BOOKING_HOST) {
    return {
      status: 'not-configured',
      provider: 'booking',
      hotels: [],
      errorMessage: 'Hotel provider não configurado',
      reason: 'RAPIDAPI_KEY/HOTEL_RAPIDAPI_HOST ausentes ou host inválido para Booking COM.',
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
    if (!destinationResponse.ok || !resolvedDestination?.dest_id || !resolvedDestination?.search_type) {
      return {
        status: 'error',
        provider: 'booking',
        hotels: [],
        errorMessage: 'Não foi possível consultar hotéis reais agora',
        errorStatus: destinationResponse.status,
        endpoint: destinationResponse.endpoint,
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
    if (!searchResponse.ok || !hotels.length) {
      return {
        status: 'error',
        provider: 'booking',
        hotels: [],
        errorMessage: 'Não foi possível consultar hotéis reais agora',
        errorStatus: searchResponse.status,
        endpoint: searchResponse.endpoint,
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
    };
  } catch (error) {
    return {
      status: 'error',
      provider: 'booking',
      hotels: [],
      errorMessage: 'Não foi possível consultar hotéis reais agora',
      errorDetail: error.message,
    };
  }
}
