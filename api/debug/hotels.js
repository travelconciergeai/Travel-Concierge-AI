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

function classifyHotelDebug(result = {}) {
  const errorType = result.debug?.errorType
    || result.debug?.providerDebug?.errorType
    || result.diagnostics?.errorType
    || null;

  if (result.status === 'live' && result.options?.length) return 'ok';
  if (result.status === 'not-configured') return 'auth-error';
  if (errorType) return errorType;
  if (result.errorStatus === 401 || result.errorStatus === 403) return 'auth-error';
  if (result.errorStatus === 429) return 'quota-error';
  if (result.errorStatus >= 500) return 'provider-unavailable';
  if (result.debug?.providerHotelCount > 0 && result.debug?.normalizedCount === 0) return 'normalization-error';
  if (result.debug?.normalizedCount > 0 && result.debug?.rankedCount === 0) return 'ranking-error';
  if (result.status === 'error' && !result.options?.length) return 'empty-response';
  return 'unknown-error';
}

function buildDebugResponse(result, env) {
  const issueType = classifyHotelDebug(result);
  const base = {
    status: result.status === 'live' && result.options?.length ? 'ok' : 'error',
    issueType,
    provider: result.provider,
    endpoint: result.endpoint || result.providerEndpoints?.[0] || result.diagnostics?.endpoint || null,
    errorMessage: result.errorMessage || null,
    errorStatus: result.errorStatus || null,
    errorDetail: result.errorDetail || null,
    environment: {
      dataMode: 'real',
      provider: env.HOTEL_PROVIDER,
      host: env.HOTEL_RAPIDAPI_HOST,
      hasRapidApiKey: Boolean(env.RAPIDAPI_KEY),
    },
    query: result.query,
    diagnostics: result.diagnostics || null,
    providerDebug: result.debug || null,
    pipeline: {
      providerHotelCount: result.debug?.providerHotelCount ?? result.debug?.providerDebug?.providerHotelCount ?? null,
      normalizedCount: result.debug?.normalizedCount ?? null,
      matchedCount: result.debug?.matchedCount ?? null,
      rankedCount: result.debug?.rankedCount ?? null,
      optionCount: result.options?.length || 0,
    },
    providerEndpoints: result.providerEndpoints || [],
    options: result.options || [],
    ranking: result.ranking || null,
    validation: (result.options || []).map(validateHotel),
  };

  return base;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const debugEnv = {
    ...process.env,
    DATA_MODE: 'real',
    HOTEL_PROVIDER: 'booking',
    HOTEL_RAPIDAPI_HOST: process.env.HOTEL_RAPIDAPI_HOST || 'booking-com15.p.rapidapi.com',
  };

  try {
    const result = await searchHotelsWithEngine({
      destination: 'Lisboa',
      checkIn: '2026-10-10',
      checkOut: '2026-10-25',
      guests: 2,
      allowMockFallback: false,
      env: debugEnv,
    });

    const payload = buildDebugResponse(result, debugEnv);
    console.info('[hotel-debug]', JSON.stringify({
      status: payload.status,
      issueType: payload.issueType,
      provider: payload.provider,
      endpoint: payload.endpoint,
      errorStatus: payload.errorStatus,
      pipeline: payload.pipeline,
      hasRapidApiKey: payload.environment.hasRapidApiKey,
    }));
    sendJson(res, 200, payload);
  } catch (error) {
    console.error('[hotel-debug] unexpected failure', error);
    sendJson(res, 200, {
      status: 'error',
      issueType: error.name === 'TimeoutError' ? 'timeout' : 'provider-unavailable',
      provider: 'booking',
      errorMessage: error.message || 'Não foi possível consultar hotéis reais agora',
      environment: {
        dataMode: 'real',
        provider: debugEnv.HOTEL_PROVIDER,
        host: debugEnv.HOTEL_RAPIDAPI_HOST,
        hasRapidApiKey: Boolean(debugEnv.RAPIDAPI_KEY),
      },
      options: [],
      validation: [],
    });
  }
}
