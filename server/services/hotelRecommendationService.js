function parseRate(rate = '') {
  if (typeof rate === 'number') return rate;
  const numeric = String(rate).replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.');
  const value = Number.parseFloat(numeric);
  return Number.isFinite(value) ? value : null;
}

function includesAny(value = '', terms = []) {
  const text = String(value).toLowerCase();
  return terms.some((term) => text.includes(term));
}

function scoreHotel(hotel, context = {}) {
  const perks = Array.isArray(hotel.perks) ? hotel.perks.join(' ') : String(hotel.perks || '');
  const expertText = hotel.matchedExpertRecommendation?.insight || hotel.matchReason || '';
  const searchable = [hotel.name, hotel.city, hotel.style, hotel.neighborhood, hotel.bestFor, perks, expertText].join(' ');
  const rate = hotel.nightlyRateAmount || parseRate(hotel.nightlyRate);
  const budgetCap = context.budgetCap || 1600;

  const scores = {
    family: 0,
    proximity: 0,
    value: 0,
    comfort: 0,
    walletBenefits: 0,
    milesPotential: 0,
    styleFit: 0,
    budgetFit: 0,
    price: rate ? Math.max(1, 10 - Math.round(rate / 250)) : 2,
    expertMatch: Math.round(Number(hotel.confidence || 0) * 10),
  };

  if (includesAny(searchable, ['family', 'família', 'quarto', 'breakfast', 'café', 'localização'])) scores.family += 2;
  if (includesAny(searchable, ['localização', 'localizacao', 'central', 'centro', 'bairro', 'walk', 'alfama', 'baixa'])) scores.proximity += 3;
  if (includesAny(searchable, ['upgrade', 'late checkout', 'crédito', 'credito', 'café', 'benefício'])) scores.value += 2;
  if (includesAny(searchable, ['premium', 'spa', 'luxo', 'serviço', 'editorial'])) scores.comfort += 3;
  if (includesAny(searchable, ['upgrade', 'late checkout', 'crédito', 'vip', 'seguro'])) scores.walletBenefits += 3;
  if (includesAny(searchable, ['pontos', 'milhas', 'cashback', 'parceiro'])) scores.milesPotential += 3;
  if (includesAny(searchable, ['boutique', 'editorial', 'premium', context.style || ''])) scores.styleFit += 2;

  if (rate && rate <= budgetCap) scores.budgetFit += 3;
  if (rate && rate <= budgetCap * 0.85) scores.value += 2;
  if (!rate) scores.budgetFit += 1;
  if (hotel.locationScore >= 9) scores.proximity += 2;
  if (hotel.rating >= 4.7) scores.comfort += 2;
  if (hotel.bookingUrl) scores.value += 1;

  const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
  return { ...scores, total };
}

function pickBest(scored, metric) {
  return [...scored].sort((a, b) => b.score[metric] - a.score[metric] || b.score.total - a.score.total)[0];
}

function toRecommendation(item, reason) {
  if (!item) return null;
  return {
    id: item.hotel.id,
    name: item.hotel.name,
    provider: item.hotel.provider,
    bookingUrl: item.hotel.bookingUrl,
    matchedExpertRecommendation: item.hotel.matchedExpertRecommendation,
    reason,
    score: item.score.total,
  };
}

export function rankHotelOptions(options = [], context = {}) {
  const scored = options.map((hotel) => ({
    hotel,
    score: scoreHotel(hotel, context),
  }));

  const bestOverall = [...scored].sort((a, b) => b.score.total - a.score.total)[0];
  const bestPrice = pickBest(scored, 'price');
  const bestExpertMatch = pickBest(scored, 'expertMatch');
  const bestValue = pickBest(scored, 'value');
  const bestPremium = pickBest(scored, 'comfort');
  const bestFamily = pickBest(scored, 'family');

  return {
    criteria: [
      'perfil familiar',
      'proximidade',
      'custo-benefício',
      'conforto',
      'benefícios da Wallet',
      'potencial de pontos/milhas',
      'estilo da viagem',
      'orçamento',
      'melhor preço',
      'match com expert',
    ],
    scoredOptions: scored.map(({ hotel, score }) => ({
      id: hotel.id,
      name: hotel.name,
      provider: hotel.provider,
      score,
    })),
    recommendations: {
      bestOverall: toRecommendation(bestOverall, 'Melhor equilíbrio entre localização, conforto, benefícios e aderência ao estilo da viagem.'),
      bestPrice: toRecommendation(bestPrice, 'Melhor preço entre as opções normalizadas, sem ignorar localização e atrito.'),
      bestExpertMatch: toRecommendation(bestExpertMatch, 'Melhor aderência aos insights mockados dos experts para este perfil.'),
      bestValue: toRecommendation(bestValue, 'Melhor custo-benefício considerando tarifa, benefícios incluídos e localização.'),
      bestPremium: toRecommendation(bestPremium, 'Melhor opção premium para conforto, serviço e experiência mais completa.'),
      bestFamily: toRecommendation(bestFamily, 'Melhor opção para família, com logística mais simples e benefícios práticos.'),
    },
    summary: bestOverall
      ? `${bestOverall.hotel.name} é a melhor escolha geral pelo equilíbrio entre conforto, localização e benefícios.`
      : 'Ainda não há hotéis suficientes para recomendar uma melhor escolha.',
  };
}
