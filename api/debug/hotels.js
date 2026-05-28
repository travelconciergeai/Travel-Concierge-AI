import { searchHotelsWithEngine } from '../../server/services/hotelSearchEngine.js';
import { sendJson } from '../_utils.js';

function validateHotel(hotel = {}) {
  return {
    id: hotel.id,
    name: hotel.name || null,
    city: hotel.city || null,
    provider: hotel.provider || null,
    nightlyRate: hotel.nightlyRate || null,
    totalRate: hotel.totalRate || null,
    rating: hotel.rating || null,
    reviewCount: hotel.reviewCount || null,
    bookingUrl: hotel.bookingUrl || null,
    image: hotel.image || null,
    valid: Boolean(hotel.name && hotel.provider && (hotel.nightlyRate || hotel.totalRate)),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const result = await searchHotelsWithEngine({
      destination: 'Lisboa',
      checkIn: '2026-10-10',
      checkOut: '2026-10-25',
      guests: 2,
      allowMockFallback: false,
      env: {
        ...process.env,
        DATA_MODE: 'real',
        HOTEL_PROVIDER: 'booking',
        HOTEL_RAPIDAPI_HOST: process.env.HOTEL_RAPIDAPI_HOST || 'booking-com15.p.rapidapi.com',
      },
    });

    if (result.status !== 'live' || !result.options?.length) {
      sendJson(res, 200, {
        status: 'error',
        provider: result.provider,
        endpoint: result.endpoint || result.providerEndpoints?.[0] || null,
        errorMessage: result.errorMessage || 'Não foi possível consultar hotéis reais agora',
        errorStatus: result.errorStatus || null,
        errorDetail: result.errorDetail || null,
        diagnostics: result.diagnostics || null,
        query: result.query,
        options: [],
        validation: [],
      });
      return;
    }

    sendJson(res, 200, {
      status: result.status,
      provider: result.provider,
      endpoint: result.providerEndpoints?.[0] || null,
      query: result.query,
      providerEndpoints: result.providerEndpoints,
      diagnostics: result.diagnostics,
      options: result.options,
      ranking: result.ranking,
      validation: result.options.map(validateHotel),
    });
  } catch (error) {
    sendJson(res, 200, {
      status: 'error',
      provider: 'booking',
      errorMessage: error.message || 'Não foi possível consultar hotéis reais agora',
      options: [],
      validation: [],
    });
  }
}
