import { searchFlightsWithEngine } from '../../server/services/flightSearchEngine.js';
import { sendJson } from '../_utils.js';

function validateFlight(flight = {}) {
  return {
    id: flight.id,
    airline: flight.airline || null,
    duration: flight.duration || null,
    durationMinutes: flight.durationMinutes || null,
    stops: Number.isFinite(Number(flight.stops)) ? Number(flight.stops) : null,
    price: flight.price || null,
    bookingUrl: flight.bookingUrl || null,
    origin: flight.origin || null,
    destination: flight.destination || null,
    cabinClass: flight.cabinClass || flight.cabin || null,
    baggage: flight.baggage || flight.baggageIncluded || null,
    valid: Boolean(
      flight.airline
      && (flight.duration || flight.durationMinutes)
      && flight.price
      && flight.origin
      && flight.destination
    ),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const result = await searchFlightsWithEngine({
      origin: 'GRU',
      destination: 'LIS',
      date: '2026-10-10',
      returnDate: '2026-10-25',
      travelers: 2,
      cabin: 'economy',
      allowMockFallback: false,
      env: {
        ...process.env,
        FLIGHT_PROVIDER: 'rapidapi',
        FLIGHT_RAPIDAPI_HOST: process.env.FLIGHT_RAPIDAPI_HOST || 'flights-sky.p.rapidapi.com',
      },
    });

    if (result.status !== 'live' || !result.options?.length) {
      sendJson(res, 200, {
        status: 'error',
        provider: result.provider,
        errorMessage: result.errorMessage || 'Não foi possível consultar voos reais agora',
        errorStatus: result.errorStatus || null,
        errorDetail: result.errorDetail || null,
        endpoint: result.providerEndpoint || null,
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
      query: result.query,
      providerEndpoints: result.providerEndpoints,
      options: result.options,
      ranking: result.ranking,
      validation: result.options.map(validateFlight),
    });
  } catch (error) {
    sendJson(res, 200, {
      status: 'error',
      provider: 'rapidapi',
      errorMessage: error.message || 'Não foi possível consultar voos reais agora',
      options: [],
      validation: [],
    });
  }
}
