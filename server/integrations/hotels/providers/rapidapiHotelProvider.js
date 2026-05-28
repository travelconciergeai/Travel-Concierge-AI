const DEFAULT_RAPIDAPI_HOST = 'hotels-com-provider.p.rapidapi.com';

function getHotelItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.propertySearch?.properties)) return payload.data.propertySearch.properties;
  if (Array.isArray(payload?.propertySearch?.properties)) return payload.propertySearch.properties;
  if (Array.isArray(payload?.properties)) return payload.properties;
  if (Array.isArray(payload?.propertySearchListings)) {
    return payload.propertySearchListings.filter((item) => Object.keys(item || {}).length > 1);
  }
  if (Array.isArray(payload?.searchResults?.results)) return payload.searchResults.results;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.hotels)) return payload.hotels;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function getDestinationEntities(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.suggestions)) {
    return payload.suggestions.flatMap((suggestion) => suggestion.entities || []);
  }
  if (Array.isArray(payload?.entities)) return payload.entities;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function getDestinationId(payload, fallbackDestination) {
  const entities = getDestinationEntities(payload);
  const city = String(fallbackDestination || '').toLowerCase();
  const cityMatch = entities.find((entity) => (
    entity.type === 'CITY'
    && String(entity.regionNames?.fullName || entity.name || entity.caption || '').toLowerCase().includes(city.replace('lisboa', 'lisbon'))
  ));
  const match = entities.find((entity) => String(entity.regionNames?.fullName || entity.name || entity.caption || '').toLowerCase().includes(city));
  const selected = cityMatch || match || entities[0];
  return selected?.destinationId || selected?.destId || selected?.gaiaId || selected?.regionId || selected?.id || null;
}

function toIsoDate(value, fallback) {
  return String(value || fallback).slice(0, 10);
}

function buildRapidApiHeaders(env) {
  return {
    'Accept': 'application/json',
    'X-RapidAPI-Key': env.RAPIDAPI_KEY,
    'X-RapidAPI-Host': env.HOTEL_RAPIDAPI_HOST || env.RAPIDAPI_HOST || DEFAULT_RAPIDAPI_HOST,
  };
}

async function fetchRapidApiJson(url, env) {
  const timeoutMs = Number(env.RAPIDAPI_TIMEOUT_MS || 15000);
  const response = await fetch(url, {
    method: 'GET',
    headers: buildRapidApiHeaders(env),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      payload: null,
    };
  }

  return {
    ok: true,
    status: response.status,
    payload: await response.json(),
  };
}

function getPrice(item) {
  return item.priceSection?.priceSummary?.displayMessages?.[0]?.lineItems?.[0]?.price?.formatted
    || item.priceSection?.priceSummary?.lead?.formatted
    || item.priceSection?.priceSummary?.options?.[0]?.formattedDisplayPrice
    || item.priceSection?.priceSummary?.price?.formatted
    || item.priceSection?.priceSummary?.price?.amount
    || item.price?.lead?.formatted
    || item.price?.displayMessages?.[0]?.lineItems?.[0]?.price?.formatted
    || item.price?.options?.[0]?.formattedDisplayPrice
    || item.price?.amount
    || item.price?.current
    || item.price?.formatted
    || item.ratePlan?.price?.current
    || item.ratePlan?.price?.exactCurrent
    || item.nightlyRate
    || item.rate;
}

function getTotalPrice(item) {
  return item.priceSection?.priceSummary?.displayMessages?.[1]?.lineItems?.[0]?.value
    || item.ratePlan?.price?.current
    || item.ratePlan?.price?.exactCurrent
    || item.price?.displayMessages?.[1]?.lineItems?.[0]?.value
    || item.price?.current
    || item.price?.lead?.formatted
    || item.price?.amount
    || item.nightlyRate
    || item.rate;
}

function getImage(item) {
  return item.mediaSection?.gallery?.media?.[0]?.media?.url
    || item.mediaSection?.gallery?.media?.[0]?.url
    || item.propertyImage?.image?.url
    || item.optimizedThumbUrls?.srpDesktop
    || item.optimizedThumbUrls?.thumbnail
    || item.thumbnailUrl
    || item.image
    || item.imageUrl
    || item.propertyImage?.image?.url
    || item.photos?.[0]?.url
    || null;
}

function buildBookingUrl(item, { checkIn, checkOut, guests }) {
  const deepLink = item.urls?.deepLink || item.url || item.bookingUrl;
  if (deepLink) return deepLink;

  const id = item.id || item.hotelId || item.propertyId;
  if (!id) return null;

  const url = new URL(`https://www.hotels.com/ho${id}/`);
  url.searchParams.set('chkin', checkIn);
  url.searchParams.set('chkout', checkOut);
  url.searchParams.set('x_pwa', '1');
  url.searchParams.set('useRewards', 'false');
  url.searchParams.set('rm1', `a${guests}`);
  return url.toString();
}

function mapRapidApiHotel(item, query) {
  const price = getPrice(item);
  const resourceValue = item.cardLink?.resource?.value || item.cardLink?.url;
  const rating = item.reviewsSection?.summary?.score
    || item.reviewsSection?.summary?.formattedScore
    || item.star
    || item.starRating
    || item.guestReviews?.rating
    || item.reviews?.score
    || item.rating;

  return {
    id: item.id || item.hotelId || item.propertyId || item.headingSection?.hotelId || resourceValue?.match(/ho(\d+)/)?.[1],
    name: item.name || item.propertyName || item.headingSection?.heading,
    city: item.neighborhood?.name || item.address?.locality || item.location?.city || query.destination,
    neighborhood: item.neighborhood || item.address?.neighborhood,
    nightlyRate: price,
    totalRate: getTotalPrice(item) || item.totalPrice || price,
    currency: item.ratePlan?.price?.currency || item.price?.currencyInfo?.code || item.price?.currency || 'BRL',
    image: getImage(item),
    rating,
    locationScore: Number(item.destinationInfo?.distanceFromDestination?.value ? 8 : item.landmarks?.[0]?.distance ? 8 : 0),
    perks: [
      item.ratePlan?.features?.freeCancellation ? 'cancelamento grátis' : null,
      item.ratePlan?.features?.paymentPreference ? item.ratePlan.features.paymentPreference : null,
      item.guestReviews?.badgeText || item.reviews?.scoreMessage,
    ].filter(Boolean),
    bestFor: item.label || item.supplierHotelId || item.headingSection ? 'hotel real via RapidAPI' : 'curadoria Voya',
    bookingUrl: resourceValue?.startsWith('http') ? resourceValue : buildBookingUrl(item, query),
    cancellationPolicy: item.ratePlan?.features?.freeCancellation ? 'Cancelamento grátis indicado pelo provider.' : 'Política a confirmar no provider.',
    style: item.starRating ? `${item.starRating} estrelas` : 'hotel',
  };
}

async function resolveDestinationId({ host, destination, env }) {
  const v2Url = new URL(`https://${host}/v2/regions`);
  v2Url.searchParams.set('query', destination);
  v2Url.searchParams.set('locale', 'en_US');
  v2Url.searchParams.set('domain', 'US');

  const v2Response = await fetchRapidApiJson(v2Url, env);
  if (v2Response.ok) {
    return {
      destinationId: getDestinationId(v2Response.payload, destination),
      status: v2Response.status,
      endpoint: '/v2/regions',
    };
  }

  const v1Url = new URL(`https://${host}/v1/destinations/search`);
  v1Url.searchParams.set('query', destination);
  v1Url.searchParams.set('locale', 'pt_BR');
  v1Url.searchParams.set('currency', 'BRL');

  const v1Response = await fetchRapidApiJson(v1Url, env);
  return {
    destinationId: v1Response.ok ? getDestinationId(v1Response.payload, destination) : null,
    status: v1Response.status,
    endpoint: '/v1/destinations/search',
  };
}

async function searchHotelsByDestination({ host, destinationId, query, env }) {
  const v2Url = new URL(`https://${host}/v2/hotels/search`);
  v2Url.searchParams.set('region_id', destinationId);
  v2Url.searchParams.set('checkin_date', query.checkIn);
  v2Url.searchParams.set('checkout_date', query.checkOut);
  v2Url.searchParams.set('adults_number', String(query.guests));
  v2Url.searchParams.set('locale', 'en_US');
  v2Url.searchParams.set('domain', 'US');
  v2Url.searchParams.set('sort_order', 'REVIEW');

  const v2Response = await fetchRapidApiJson(v2Url, env);
  if (v2Response.ok) {
    return {
      payload: v2Response.payload,
      status: v2Response.status,
      endpoint: '/v2/hotels/search',
    };
  }

  const v1Url = new URL(`https://${host}/v1/hotels/search`);
  v1Url.searchParams.set('destination_id', destinationId);
  v1Url.searchParams.set('checkin_date', query.checkIn);
  v1Url.searchParams.set('checkout_date', query.checkOut);
  v1Url.searchParams.set('adults_number', String(query.guests));
  v1Url.searchParams.set('locale', 'pt_BR');
  v1Url.searchParams.set('currency', 'BRL');
  v1Url.searchParams.set('sort_order', 'REVIEW');

  const v1Response = await fetchRapidApiJson(v1Url, env);
  return {
    payload: v1Response.ok ? v1Response.payload : null,
    status: v1Response.status,
    endpoint: '/v1/hotels/search',
  };
}

export async function searchRapidApiHotels({
  destination = 'Lisboa',
  checkIn = '2026-10-12',
  checkOut = '2026-10-16',
  guests = 2,
  env = process.env,
} = {}) {
  const host = env.HOTEL_RAPIDAPI_HOST || env.RAPIDAPI_HOST || DEFAULT_RAPIDAPI_HOST;

  if (!env.RAPIDAPI_KEY || !host) {
    return {
      status: 'not-configured',
      provider: 'rapidapi',
      hotels: [],
      errorMessage: 'Hotel provider não configurado',
      reason: 'RAPIDAPI_KEY/HOTEL_RAPIDAPI_HOST ausentes.',
    };
  }

  const query = {
    destination,
    checkIn: toIsoDate(checkIn, '2026-10-12'),
    checkOut: toIsoDate(checkOut, '2026-10-16'),
    guests,
  };

  try {
    const destinationResult = await resolveDestinationId({ host, destination, env });
    if (!destinationResult.destinationId) {
      return {
        status: 'error',
        provider: 'rapidapi',
        hotels: [],
        errorMessage: 'Não foi possível consultar hotéis reais agora',
        errorStatus: destinationResult.status,
        endpoint: destinationResult.endpoint,
      };
    }

    const hotelsResult = await searchHotelsByDestination({
      host,
      destinationId: destinationResult.destinationId,
      query,
      env,
    });
    if (!hotelsResult.payload) {
      return {
        status: 'error',
        provider: 'rapidapi',
        hotels: [],
        errorMessage: 'Não foi possível consultar hotéis reais agora',
        errorStatus: hotelsResult.status,
        endpoint: hotelsResult.endpoint,
      };
    }

    return {
      status: 'live',
      provider: 'rapidapi',
      hotels: getHotelItems(hotelsResult.payload).map((item) => mapRapidApiHotel(item, query)),
      rawProviderStatus: hotelsResult.status,
      destinationId: destinationResult.destinationId,
      endpoints: [destinationResult.endpoint, hotelsResult.endpoint],
    };
  } catch (error) {
    return {
      status: 'error',
      provider: 'rapidapi',
      hotels: [],
      errorMessage: 'Não foi possível consultar hotéis reais agora',
      errorDetail: error.message,
    };
  }
}
