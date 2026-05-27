import { searchMockHotels } from '../integrations/hotels/providers/mockHotelProvider.js';
import { searchAmadeusHotels } from '../integrations/hotels/providers/amadeusHotelProvider.js';
import { searchExpediaHotels } from '../integrations/hotels/providers/expediaHotelProvider.js';
import { searchBookingHotels } from '../integrations/hotels/providers/bookingHotelProvider.js';
import { searchRapidApiHotels } from '../integrations/hotels/providers/rapidapiHotelProvider.js';
import { getExpertRecommendations } from './expertKnowledgeService.js';
import { matchHotelsWithExperts } from './hotelExpertMatchService.js';
import { normalizeHotels } from './hotelNormalizer.js';
import { rankHotelOptions } from './hotelRecommendationService.js';

const providerAdapters = {
  mock: searchMockHotels,
  amadeus: searchAmadeusHotels,
  expedia: searchExpediaHotels,
  booking: searchBookingHotels,
  rapidapi: searchRapidApiHotels,
};

function buildTripContext(query) {
  return {
    destination: query.destination,
    profile: query.profile || query.style || 'boutique premium',
    travelerType: query.children || query.family ? 'família' : 'viajantes',
    rhythm: query.rhythm || 'equilibrado',
    budget: query.budget || 'premium consciente',
    children: Boolean(query.children || query.family),
    interests: query.interests || ['hospedagem', 'logística'],
  };
}

function sortOptionsByRanking(options, ranking) {
  const scoreById = new Map((ranking.scoredOptions || []).map((item) => [item.id, item.score.total]));
  return [...options].sort((a, b) => (scoreById.get(b.id) || 0) - (scoreById.get(a.id) || 0));
}

async function runProvider(providerName, query, env) {
  const adapter = providerAdapters[providerName];
  if (!providerName || !adapter) {
    return {
      status: 'not-configured',
      provider: providerName || 'not-configured',
      hotels: [],
      errorMessage: 'Hotel provider não configurado',
    };
  }

  return adapter({ ...query, env });
}

export async function searchHotelsWithEngine({
  destination = 'Lisboa',
  checkIn = '2026-10-12',
  checkOut = '2026-10-16',
  guests = 2,
  style = 'boutique premium',
  env = process.env,
  ...context
} = {}) {
  const providerName = env.HOTEL_PROVIDER || env.HOTEL_API_PROVIDER;
  const query = { destination, checkIn, checkOut, guests, style, ...context };
  const providerResult = await runProvider(providerName, query, env);
  const provider = providerResult.provider || providerName;
  const tripContext = buildTripContext(query);
  const expertRecommendations = getExpertRecommendations({ ...tripContext, limit: 5 });

  if (providerResult.status === 'not-configured' || providerResult.status === 'error') {
    return {
      status: providerResult.status,
      provider,
      query,
      options: [],
      ranking: null,
      expertRecommendations,
      errorMessage: providerResult.errorMessage || 'Não foi possível consultar hotéis reais agora',
      errorStatus: providerResult.errorStatus || null,
      endpoint: providerResult.endpoint || null,
      source: 'hotel-search-engine',
    };
  }

  const normalized = normalizeHotels(providerResult.hotels || providerResult.options || [], {
    provider,
    destination,
  });

  if (!normalized.length && provider !== 'mock') {
    return {
      status: 'error',
      provider,
      query,
      options: [],
      ranking: null,
      expertRecommendations,
      errorMessage: 'Não foi possível consultar hotéis reais agora',
      endpoint: providerResult.endpoints?.join(' -> ') || null,
      source: 'hotel-search-engine',
    };
  }

  const matchedOptions = matchHotelsWithExperts(normalized, expertRecommendations, tripContext);
  const ranking = rankHotelOptions(matchedOptions, {
    style,
    budgetCap: context.budgetCap || (tripContext.budget.includes('econ') ? 1300 : 1800),
  });

  return {
    status: providerResult.status || 'mocked',
    provider,
    query,
    options: sortOptionsByRanking(matchedOptions, ranking),
    ranking,
    expertRecommendations,
    bestPrice: ranking.recommendations.bestPrice,
    bestExpertMatch: ranking.recommendations.bestExpertMatch,
    providerEndpoints: providerResult.endpoints || [],
    source: 'hotel-search-engine',
  };
}
