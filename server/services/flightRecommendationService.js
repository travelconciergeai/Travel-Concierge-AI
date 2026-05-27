function parseDuration(duration = '') {
  if (typeof duration === 'number') return duration;
  const text = String(duration).toLowerCase();
  const hours = Number.parseFloat(text.match(/(\d+(?:[,.]\d+)?)\s*h/)?.[1]?.replace(',', '.') || '0');
  const minutes = Number.parseFloat(text.match(/(\d+)\s*min/)?.[1] || '0');
  return hours * 60 + minutes;
}

function parseMoney(value = '') {
  if (typeof value === 'number') return value;
  const numeric = String(value).replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.');
  const amount = Number.parseFloat(numeric);
  return Number.isFinite(amount) ? amount : null;
}

function includesAny(value = '', terms = []) {
  const text = String(value).toLowerCase();
  return terms.some((term) => text.includes(term));
}

function scoreFlight(flight, context = {}) {
  const durationMinutes = flight.durationMinutes || parseDuration(flight.duration);
  const priceAmount = flight.priceAmount || parseMoney(flight.price);
  const searchable = [
    flight.airline,
    flight.flightNumber,
    flight.flight,
    flight.origin,
    flight.destination,
    flight.cabin,
    flight.milesPrice,
    flight.miles,
    flight.stopoverInfo,
    flight.walletBenefits?.join(' '),
    flight.recommendationReason,
    flight.bestFor,
  ].join(' ');
  const direct = Number(flight.stops || 0) === 0;
  const premiumCabin = includesAny(searchable, ['executiva', 'business', 'premium']);
  const hasMiles = includesAny(searchable, ['milhas', 'miles', 'tap', 'latam pass']);
  const hasLounge = includesAny(searchable, ['executiva', 'business', 'tap', 'star alliance', 'latam']);
  const connectionRisk = direct ? 9 : includesAny(searchable, ['curta', '1h05', '1h']) ? 2 : 5;

  const scores = {
    duration: durationMinutes ? Math.max(1, 12 - Math.round(durationMinutes / 90)) : 2,
    connections: direct ? 8 : Math.max(1, 5 - Number(flight.stops || 0)),
    familyTiming: flight.familyScore || (direct ? 6 : 3),
    comfort: flight.comfortScore || (premiumCabin ? 7 : 3),
    price: priceAmount ? Math.max(1, 10 - Math.round(priceAmount / 900)) : 3,
    miles: hasMiles ? 7 : 1,
    walletLounge: hasLounge ? 6 : 1,
    connectionRisk,
    arrivalComfort: durationMinutes && durationMinutes <= 720 ? 6 : 3,
    confidence: Math.round(Number(flight.confidence || 0) * 10),
  };

  if (context.family) {
    scores.familyTiming += direct ? 2 : 0;
    scores.connectionRisk += direct ? 1 : -1;
  }

  const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
  return { ...scores, total, durationMinutes, priceAmount };
}

function pickBest(scored, metric) {
  return [...scored].sort((a, b) => b.score[metric] - a.score[metric] || b.score.total - a.score.total)[0];
}

function toRecommendation(item, reason) {
  if (!item) return null;
  return {
    id: item.flight.id,
    label: `${item.flight.airline} ${item.flight.flightNumber || item.flight.flight}`,
    provider: item.flight.provider,
    bookingUrl: item.flight.bookingUrl,
    milesPrice: item.flight.milesPrice,
    price: item.flight.price,
    stopoverInfo: item.flight.stopoverInfo,
    reason,
    score: item.score.total,
  };
}

export function rankFlightOptions(options = [], context = {}) {
  const scored = options.map((flight) => ({
    flight,
    score: scoreFlight(flight, context),
  }));

  const bestOverall = [...scored].sort((a, b) => b.score.total - a.score.total)[0];
  const bestPrice = pickBest(scored, 'price');
  const bestFamily = pickBest(scored, 'familyTiming');
  const bestMiles = pickBest(scored, 'miles');
  const bestComfort = pickBest(scored, 'comfort');
  const shortestDuration = pickBest(scored, 'duration');
  const lowestConnectionRisk = pickBest(scored, 'connectionRisk');

  return {
    criteria: [
      'menor duração total',
      'menor número de conexões',
      'melhor horário para família',
      'conforto',
      'preço',
      'uso de milhas',
      'acesso a lounge pela Wallet',
      'risco de conexão curta',
      'chegada em horário confortável',
    ],
    scoredOptions: scored.map(({ flight, score }) => ({
      id: flight.id,
      label: `${flight.airline} ${flight.flightNumber || flight.flight}`,
      provider: flight.provider,
      score,
    })),
    recommendations: {
      bestOverall: toRecommendation(bestOverall, 'Melhor equilíbrio entre duração, conforto, conexões e uso da Wallet.'),
      bestPrice: toRecommendation(bestPrice, 'Melhor preço relativo sem ignorar duração e risco de conexão.'),
      bestFamily: toRecommendation(bestFamily, 'Melhor para família por reduzir atrito, conexão e desgaste.'),
      bestMiles: toRecommendation(bestMiles, 'Melhor opção para usar milhas/pontos com boa lógica de emissão.'),
      bestComfort: toRecommendation(bestComfort, 'Melhor conforto por cabine, lounge e menor desgaste total.'),
      shortestDuration: toRecommendation(shortestDuration, 'Menor duração total entre as opções analisadas.'),
      lowestConnectionRisk: toRecommendation(lowestConnectionRisk, 'Menor risco operacional por conexão direta ou conexão menos apertada.'),
    },
    summary: bestOverall
      ? `${bestOverall.flight.airline} ${bestOverall.flight.flightNumber || bestOverall.flight.flight} é a melhor escolha geral pelo equilíbrio entre tempo, conforto e risco.`
      : 'Ainda não há voos suficientes para recomendar uma melhor escolha.',
  };
}
