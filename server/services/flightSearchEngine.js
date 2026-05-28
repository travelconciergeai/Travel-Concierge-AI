import { searchMockFlights } from '../integrations/flights/providers/mockFlightProvider.js';
import { searchAmadeusFlights } from '../integrations/flights/providers/amadeusFlightProvider.js';
import { searchDuffelFlights } from '../integrations/flights/providers/duffelFlightProvider.js';
import { searchLatamFlights } from '../integrations/flights/providers/latamFlightProvider.js';
import { searchRapidApiFlights } from '../integrations/flights/providers/rapidapiFlightProvider.js';
import { normalizeFlights } from './flightNormalizer.js';
import { rankFlightOptions } from './flightRecommendationService.js';

const providerAdapters = {
  mock: searchMockFlights,
  amadeus: searchAmadeusFlights,
  duffel: searchDuffelFlights,
  latam: searchLatamFlights,
  rapidapi: searchRapidApiFlights,
};

function sortOptionsByRanking(options, ranking) {
  const scoreById = new Map((ranking.scoredOptions || []).map((item) => [item.id, item.score.total]));
  return [...options].sort((a, b) => (scoreById.get(b.id) || 0) - (scoreById.get(a.id) || 0));
}

async function runProvider(providerName, query, env) {
  const adapter = providerAdapters[providerName] || providerAdapters.mock;
  const result = await adapter({ ...query, env });

  if (!result.flights?.length && providerName !== 'mock') {
    const fallback = await searchMockFlights(query);
    return {
      ...fallback,
      provider: 'mock',
      status: 'mocked',
      fallbackFrom: providerName,
      fallbackReason: result.errorMessage || result.reason || 'Provider real sem dados disponíveis.',
      providerErrorStatus: result.errorStatus || null,
      providerEndpoint: result.endpoint || null,
    };
  }

  return result;
}

export async function searchFlightsWithEngine({
  origin = 'GRU',
  destination = 'LIS',
  date = '2026-10-12',
  travelers = 2,
  cabin = 'executiva',
  env = process.env,
  ...context
} = {}) {
  const providerName = env.FLIGHT_PROVIDER || 'mock';
  const query = { origin, destination, date, travelers, cabin, ...context };
  const providerResult = await runProvider(providerName, query, env);
  const provider = providerResult.provider || providerName;
  const normalized = normalizeFlights(providerResult.flights || providerResult.options || [], {
    provider,
    origin,
    destination,
  });
  const ranking = rankFlightOptions(normalized, {
    family: Boolean(context.children || context.family),
  });

  return {
    status: providerResult.status || 'mocked',
    provider,
    query,
    options: sortOptionsByRanking(normalized, ranking),
    ranking,
    bestPrice: ranking.recommendations.bestPrice,
    bestMiles: ranking.recommendations.bestMiles,
    bestFamily: ranking.recommendations.bestFamily,
    fallbackFrom: providerResult.fallbackFrom || null,
    fallbackReason: providerResult.fallbackReason || null,
    providerEndpoints: providerResult.endpoints || [],
    source: 'flight-search-engine',
  };
}
