import { rankFlightOptions } from './flightRecommendationService.js';
import { rankHotelOptions } from './hotelRecommendationService.js';
import { rankTourOptions } from './tourRecommendationService.js';
import { getExpertRecommendations } from './expertKnowledgeService.js';

function getRecommendation(source, key) {
  return source?.ranking?.recommendations?.[key] || source?.recommendations?.[key] || null;
}

function withRanking(source, ranker, context) {
  if (source?.ranking) return source;
  return {
    ...source,
    ranking: ranker(source?.options || [], context),
  };
}

function getLabel(item, fallback = 'opção recomendada') {
  return item?.label || item?.name || item?.title || fallback;
}

function compact(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function inferProfile({ profile = {}, message = '' } = {}) {
  const text = String(message).toLowerCase();
  return {
    family: profile.family ?? /fam[ií]lia|crian[cç]a|filho|filha/i.test(text),
    budget: profile.budget || (/econom|barato|or[cç]amento/i.test(text) ? 'econômico controlado' : 'premium consciente'),
    rhythm: profile.rhythm || (/leve|tranquilo|descanso|calmo/i.test(text) ? 'leve' : 'equilibrado'),
    style: profile.style || 'curadoria premium com baixa fricção',
  };
}

function inferDestination({ flights, hotels, tours, message = '' } = {}) {
  const fromHotels = hotels?.query?.destination || hotels?.options?.[0]?.city;
  const fromTours = tours?.query?.destination || tours?.options?.[0]?.city;
  const fromMessage = String(message).match(/lisboa|paris|orlando|porto/i)?.[0];
  return fromHotels || fromTours || fromMessage || flights?.query?.destination || 'Lisboa';
}

function inferInterests(message = '') {
  const text = String(message).toLowerCase();
  return [
    /gastronomia|restaurante|jantar|comida/.test(text) ? 'gastronomia' : null,
    /cultura|museu|hist[oó]ria|arte/.test(text) ? 'cultura' : null,
    /parque|disney|crian[cç]a/.test(text) ? 'parques' : null,
    /milha|pontos|wallet|cart[aã]o/.test(text) ? 'milhas' : null,
    /hotel|hospedagem/.test(text) ? 'hospedagem' : null,
  ].filter(Boolean);
}

function buildCombination({ flight, hotel, tour, rationale, tone }) {
  return {
    flight,
    hotel,
    tour,
    rationale: compact(rationale),
    tone,
  };
}

export function orchestrateTripRecommendation({
  flights,
  hotels,
  tours,
  wallet,
  miles,
  profile,
  budget,
  rhythm,
  expertInsights,
  message = '',
  env = process.env,
} = {}) {
  const tripProfile = inferProfile({ profile: { ...profile, budget, rhythm }, message });
  const destination = inferDestination({ flights, hotels, tours, message });
  const rankedFlights = withRanking(flights, rankFlightOptions, { family: tripProfile.family });
  const rankedHotels = withRanking(hotels, rankHotelOptions, {
    style: tripProfile.style,
    budgetCap: tripProfile.budget === 'econômico controlado' ? 1400 : 1800,
  });
  const rankedTours = withRanking(tours, rankTourOptions, {
    family: tripProfile.family,
    style: tripProfile.style,
  });
  const usedExpertInsights = expertInsights || getExpertRecommendations({
    destination,
    profile: tripProfile.style,
    travelerType: tripProfile.family ? 'família' : 'viajantes',
    rhythm: tripProfile.rhythm,
    budget: tripProfile.budget,
    children: tripProfile.family,
    interests: inferInterests(message),
    env,
  });
  const leadExpert = usedExpertInsights[0];

  const flightOverall = getRecommendation(rankedFlights, 'bestOverall');
  const flightPrice = getRecommendation(rankedFlights, 'bestPrice');
  const flightFamily = getRecommendation(rankedFlights, 'bestFamily');
  const flightMiles = getRecommendation(rankedFlights, 'bestMiles');
  const flightComfort = getRecommendation(rankedFlights, 'bestComfort');

  const hotelOverall = getRecommendation(rankedHotels, 'bestOverall');
  const hotelValue = getRecommendation(rankedHotels, 'bestValue');
  const hotelPremium = getRecommendation(rankedHotels, 'bestPremium');
  const hotelFamily = getRecommendation(rankedHotels, 'bestFamily');

  const tourOverall = getRecommendation(rankedTours, 'bestOverall');
  const tourValue = getRecommendation(rankedTours, 'bestValue');
  const tourFamily = getRecommendation(rankedTours, 'bestFamily');
  const tourMemorable = getRecommendation(rankedTours, 'mostMemorable');
  const tourLight = getRecommendation(rankedTours, 'lightest');

  const walletCards = wallet?.cards || ['Voya Signature', 'TAP Miles & Go Infinite'];
  const walletRecommendation = wallet?.recommendation || 'Usar benefícios de hotel na Wallet e avaliar sala VIP no voo principal.';
  const milesSummary = miles?.summary || 'Comparar emissão com milhas no trecho internacional e pagamento em dinheiro quando a tarifa estiver competitiva.';

  const bestOverall = buildCombination({
    flight: flightOverall,
    hotel: hotelOverall,
    tour: tourOverall,
    tone: 'equilibrada',
    rationale: `Eu combinaria ${getLabel(flightOverall, 'o melhor voo geral')}, ${getLabel(hotelOverall, 'o hotel mais equilibrado')} e ${getLabel(tourOverall, 'o passeio mais bem encaixado')}. A lógica é reduzir atrito sem perder qualidade percebida.${leadExpert ? ` O insight de ${leadExpert.expertName} reforça: ${leadExpert.insight}` : ''}`,
  });

  const mostEconomical = buildCombination({
    flight: flightPrice,
    hotel: hotelValue,
    tour: tourValue,
    tone: 'econômica',
    rationale: `A opção mais econômica combina ${getLabel(flightPrice, 'o voo de melhor preço')}, ${getLabel(hotelValue, 'o hotel de melhor custo-benefício')} e ${getLabel(tourValue, 'o passeio com melhor valor')}. Eu só validaria se a economia não cria conexões cansativas ou deslocamentos demais.`,
  });

  const mostComfortable = buildCombination({
    flight: flightComfort,
    hotel: hotelPremium,
    tour: tourMemorable,
    tone: 'confortável',
    rationale: `Para conforto, eu subiria para ${getLabel(flightComfort, 'o voo mais confortável')}, manteria ${getLabel(hotelPremium, 'a opção premium')} e escolheria ${getLabel(tourMemorable, 'a experiência mais memorável')}. Não é a cesta mais barata, mas protege energia e qualidade da viagem.`,
  });

  const bestFamily = buildCombination({
    flight: flightFamily,
    hotel: hotelFamily,
    tour: tourFamily || tourLight,
    tone: 'familiar',
    rationale: `Para família, eu priorizaria ${getLabel(flightFamily, 'o voo com menor desgaste')}, ${getLabel(hotelFamily, 'o hotel mais prático')} e ${getLabel(tourFamily || tourLight, 'um passeio leve')}. A decisão favorece previsibilidade, pausas e baixa fricção.`,
  });

  const milesWalletStrategy = {
    cards: walletCards,
    summary: compact(`${walletRecommendation} ${milesSummary}`),
    recommendation: `Usaria ${walletCards[0]} para maximizar benefícios de hotel e compararia ${getLabel(flightMiles, 'a melhor opção com milhas')} antes de emitir.`,
  };

  const alerts = [
    tripProfile.family ? 'Com crianças, evitar conexão apertada e chegada muito tarde vale mais do que uma pequena economia.' : null,
    tripProfile.rhythm === 'leve' ? 'Ritmo leve pede menos passeios por dia e mais tempo livre entre deslocamentos.' : null,
    'Dados de voos, hotéis, passeios, Wallet e experts ainda estão mockados nesta etapa.',
    'Antes de reservar, validar disponibilidade real, regras tarifárias e política de cancelamento.',
  ].filter(Boolean);

  return {
    status: 'mocked',
    action: 'recomendarViagem',
    profile: tripProfile,
    destination,
    expertInsights: usedExpertInsights,
    recommendations: {
      bestOverall,
      mostEconomical,
      mostComfortable,
      bestFamily,
      milesWalletStrategy,
      alerts,
    },
    summary: `Para esse perfil ${tripProfile.family ? 'familiar' : 'de viagem'}, a melhor combinação geral é ${getLabel(flightOverall, 'o voo mais equilibrado')} + ${getLabel(hotelOverall, 'o hotel mais equilibrado')} + ${getLabel(tourOverall, 'o passeio mais bem encaixado')}. A recomendação é estratégica: menos atrito, bom uso de Wallet/milhas e ritmo ${tripProfile.rhythm}.`,
  };
}
