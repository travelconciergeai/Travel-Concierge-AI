function parseDuration(duration = '') {
  const text = String(duration).toLowerCase();
  const hours = Number.parseFloat(text.match(/(\d+(?:[,.]\d+)?)\s*h/)?.[1]?.replace(',', '.') || '0');
  const minutes = Number.parseFloat(text.match(/(\d+)\s*min/)?.[1] || '0');
  return hours * 60 + minutes;
}

function parseMoney(value = '') {
  const numeric = String(value).replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.');
  const amount = Number.parseFloat(numeric);
  return Number.isFinite(amount) ? amount : null;
}

function includesAny(value = '', terms = []) {
  const text = String(value).toLowerCase();
  return terms.some((term) => text.includes(term));
}

function scoreTour(tour, context = {}) {
  const searchable = [tour.title, tour.city, tour.duration, tour.host, tour.price, tour.bestFor, context.style].join(' ');
  const durationMinutes = parseDuration(tour.duration);
  const priceAmount = parseMoney(tour.price);
  const shortEnough = durationMinutes > 0 && durationMinutes <= 180;
  const veryLight = durationMinutes > 0 && durationMinutes <= 120;
  const familyContext = !!context.family;

  const scores = {
    childFit: 0,
    duration: shortEnough ? 7 : 3,
    transferEase: 5,
    value: priceAmount ? Math.max(1, 8 - Math.round(priceAmount / 80)) : 4,
    memorable: 0,
    lowFriction: veryLight ? 7 : 5,
    styleFit: 0,
    uniqueExperience: 0,
    accessibility: 5,
    timingFit: veryLight ? 7 : 5,
  };

  if (includesAny(searchable, ['família', 'family', 'primeira vez', 'walking', 'autoral'])) scores.childFit += familyContext ? 6 : 3;
  if (includesAny(searchable, ['fado', 'íntimo', 'intimo', 'vintage', 'autoral', 'expert'])) scores.memorable += 7;
  if (includesAny(searchable, ['walking', 'primeira vez', 'autor', 'cultura', 'gastronomia'])) scores.styleFit += 5;
  if (includesAny(searchable, ['íntimo', 'intimo', 'vintage', 'privado', 'autoral'])) scores.uniqueExperience += 6;
  if (includesAny(searchable, ['walking', 'leve', 'primeira vez'])) scores.accessibility += 2;
  if (includesAny(searchable, ['noite especial', 'fado'])) scores.timingFit += 2;

  if (familyContext && veryLight) scores.lowFriction += 2;
  if (familyContext && durationMinutes > 180) scores.childFit -= 2;

  const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
  return { ...scores, total, durationMinutes, priceAmount };
}

function pickBest(scored, metric) {
  return [...scored].sort((a, b) => b.score[metric] - a.score[metric] || b.score.total - a.score.total)[0];
}

function toRecommendation(item, reason) {
  if (!item) return null;
  return {
    id: item.tour.id,
    title: item.tour.title,
    reason,
    score: item.score.total,
  };
}

export function rankTourOptions(options = [], context = {}) {
  const scored = options.map((tour) => ({
    tour,
    score: scoreTour(tour, context),
  }));

  const bestOverall = [...scored].sort((a, b) => b.score.total - a.score.total)[0];
  const bestFamily = pickBest(scored, 'childFit');
  const bestValue = pickBest(scored, 'value');
  const mostMemorable = pickBest(scored, 'memorable');
  const lightest = pickBest(scored, 'lowFriction');

  return {
    criteria: [
      'compatibilidade com crianças',
      'duração',
      'deslocamento',
      'custo-benefício',
      'valor memorável',
      'baixa fricção logística',
      'aderência ao estilo da viagem',
      'potencial de experiência única',
      'acessibilidade',
      'melhor horário no roteiro',
    ],
    scoredOptions: scored.map(({ tour, score }) => ({
      id: tour.id,
      title: tour.title,
      score,
    })),
    recommendations: {
      bestOverall: toRecommendation(bestOverall, 'Melhor equilíbrio entre memória, logística, duração e aderência ao estilo da viagem.'),
      bestFamily: toRecommendation(bestFamily, 'Melhor para família por duração, acessibilidade e baixa fricção.'),
      bestValue: toRecommendation(bestValue, 'Melhor custo-benefício considerando preço, duração e valor percebido.'),
      mostMemorable: toRecommendation(mostMemorable, 'Experiência com maior potencial de virar memória da viagem.'),
      lightest: toRecommendation(lightest, 'Passeio mais leve, com menor desgaste e encaixe simples no roteiro.'),
    },
    summary: bestOverall
      ? `${bestOverall.tour.title} é a melhor escolha geral pelo equilíbrio entre logística e valor memorável.`
      : 'Ainda não há passeios suficientes para recomendar uma melhor escolha.',
  };
}
