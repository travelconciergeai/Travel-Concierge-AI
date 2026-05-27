function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function includesAny(searchable, values = []) {
  return values.some((value) => value && searchable.includes(normalize(value)));
}

function scoreHotelAgainstInsight(hotel, insight, tripContext = {}) {
  const searchable = normalize([
    hotel.name,
    hotel.city,
    hotel.neighborhood,
    hotel.style,
    hotel.bestFor,
    hotel.perks?.join(' '),
    tripContext.profile,
    tripContext.travelerType,
    tripContext.rhythm,
    tripContext.budget,
  ].join(' '));

  const tags = insight.tags || [];
  const applicableTo = insight.applicableTo || [];
  let score = 0;

  if (includesAny(searchable, tags)) score += 2;
  if (includesAny(searchable, applicableTo)) score += 2;
  if (tripContext.children && includesAny(searchable, ['família', 'familia', 'crianças', 'criancas', 'quarto família'])) score += 2;
  if (includesAny(searchable, ['central', 'centro', 'alfama', 'baixa', 'bairro', 'localização', 'localizacao'])) score += 1;
  if (includesAny(searchable, ['premium', 'boutique', 'serviço', 'servico', 'late checkout', 'upgrade'])) score += 1;

  return score + Number(insight.confidence || 0);
}

export function matchHotelsWithExperts(hotels = [], expertRecommendations = [], tripContext = {}) {
  return hotels.map((hotel) => {
    const bestMatch = expertRecommendations
      .map((insight) => ({
        insight,
        score: scoreHotelAgainstInsight(hotel, insight, tripContext),
      }))
      .sort((a, b) => b.score - a.score)[0];

    if (!bestMatch || bestMatch.score <= 1) {
      return {
        ...hotel,
        matchedExpertRecommendation: null,
        matchReason: 'Sem match forte de expert para este perfil.',
        confidence: hotel.confidence || 0.45,
      };
    }

    return {
      ...hotel,
      matchedExpertRecommendation: bestMatch.insight,
      matchReason: `${bestMatch.insight.expertName} reforça ${bestMatch.insight.category}: ${bestMatch.insight.insight}`,
      confidence: Math.min(0.98, Math.round((bestMatch.score / 8) * 100) / 100),
    };
  });
}
