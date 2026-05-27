function getHotelItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.hotels)) return payload.hotels;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export async function searchAmadeusHotels({
  destination = 'Lisboa',
  checkIn = '2026-10-12',
  checkOut = '2026-10-16',
  guests = 2,
  style = 'boutique premium',
  env = process.env,
} = {}) {
  const apiKey = env.HOTEL_API_KEY || env.AMADEUS_HOTEL_API_KEY;
  const baseUrl = env.HOTEL_API_BASE_URL;

  if (!apiKey || !baseUrl) {
    return {
      status: 'not-configured',
      provider: 'amadeus',
      hotels: [],
      errorMessage: 'Hotel provider não configurado',
      reason: 'HOTEL_API_KEY/HOTEL_API_BASE_URL ausentes.',
    };
  }

  try {
    const url = new URL(baseUrl);
    url.searchParams.set('destination', destination);
    url.searchParams.set('checkIn', checkIn);
    url.searchParams.set('checkOut', checkOut);
    url.searchParams.set('guests', String(guests));
    url.searchParams.set('style', style);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Key': apiKey,
      },
    });

    if (!response.ok) {
      return {
        status: 'error',
        provider: 'amadeus',
        hotels: [],
        errorMessage: 'Não foi possível consultar hotéis reais agora',
        errorStatus: response.status,
      };
    }

    const payload = await response.json();
    return {
      status: 'live',
      provider: 'amadeus',
      hotels: getHotelItems(payload),
      rawProviderStatus: response.status,
    };
  } catch (error) {
    return {
      status: 'error',
      provider: 'amadeus',
      hotels: [],
      errorMessage: 'Não foi possível consultar hotéis reais agora',
      errorDetail: error.message,
    };
  }
}
