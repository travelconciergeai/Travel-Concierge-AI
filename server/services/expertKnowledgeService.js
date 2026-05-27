const MOCK_EXPERT_INSIGHTS = [
  {
    expertName: 'Esteban Pelo Mundo',
    destination: 'Orlando',
    category: 'parques',
    insight: 'Em viagem com crianças, intercale parque intenso com manhã mais lenta ou dia de piscina.',
    reason: 'O descanso planejado reduz irritação, melhora o aproveitamento dos parques e evita excesso de deslocamento.',
    applicableTo: ['família', 'crianças', 'ritmo leve', 'Disney'],
    confidence: 0.92,
    tags: ['orlando', 'disney', 'criancas', 'descanso', 'parques'],
  },
  {
    expertName: 'Esteban Pelo Mundo',
    destination: 'Orlando',
    category: 'logística',
    insight: 'Para primeira viagem à Disney, priorize menos parques e mais tempo de respiro entre eles.',
    reason: 'A experiência tende a ser melhor quando a família não tenta esgotar todas as atrações em poucos dias.',
    applicableTo: ['primeira vez', 'família', 'crianças', 'ritmo equilibrado'],
    confidence: 0.88,
    tags: ['orlando', 'disney', 'familia', 'primeira-vez', 'ritmo'],
  },
  {
    expertName: 'Status Viajante',
    destination: 'Lisboa',
    category: 'custo-benefício',
    insight: 'Em Lisboa, hotel bem localizado costuma economizar mais tempo e energia do que uma diária levemente mais barata fora do centro.',
    reason: 'A economia aparente pode virar mais deslocamento, mais transporte e menos flexibilidade no roteiro.',
    applicableTo: ['casal', 'família', 'orçamento controlado', 'ritmo leve'],
    confidence: 0.9,
    tags: ['lisboa', 'hotel', 'localizacao', 'custo-beneficio', 'logistica'],
  },
  {
    expertName: 'Status Viajante',
    destination: 'Paris',
    category: 'hospedagem',
    insight: 'Para Paris, vale pagar um pouco mais por bairro estratégico quando o roteiro inclui museus, gastronomia e caminhadas.',
    reason: 'A localização certa reduz atrito diário e protege a qualidade percebida da viagem.',
    applicableTo: ['Europa', 'cultura', 'gastronomia', 'premium consciente'],
    confidence: 0.86,
    tags: ['paris', 'hotel', 'bairro', 'cultura', 'gastronomia'],
  },
  {
    expertName: 'Jaime Drummond',
    destination: 'Lisboa',
    category: 'experiências memoráveis',
    insight: 'Combine uma experiência cultural curta com uma reserva gastronômica especial em vez de empilhar muitas atividades no mesmo dia.',
    reason: 'A viagem fica mais autoral e menos cansativa, com mais chance de criar memória real.',
    applicableTo: ['Europa', 'cultura', 'gastronomia', 'ritmo equilibrado'],
    confidence: 0.89,
    tags: ['lisboa', 'cultura', 'gastronomia', 'experiencias', 'memoria'],
  },
  {
    expertName: 'Jaime Drummond',
    destination: 'Porto',
    category: 'cultura',
    insight: 'No Porto, deixe margem para caminhar sem agenda rígida entre experiências de vinho e refeições.',
    reason: 'A cidade recompensa deslocamentos curtos, pausas e descoberta espontânea.',
    applicableTo: ['Europa', 'casal', 'gastronomia', 'ritmo leve'],
    confidence: 0.84,
    tags: ['porto', 'vinho', 'gastronomia', 'cultura', 'ritmo-leve'],
  },
  {
    expertName: 'Curadoria Voya',
    destination: 'Lisboa',
    category: 'síntese',
    insight: 'Para família em Lisboa, prefira voo com menos conexão, hotel central e passeios de até três horas.',
    reason: 'Essa combinação protege sono, deslocamento e previsibilidade sem empobrecer a experiência.',
    applicableTo: ['família', 'crianças', 'premium consciente', 'ritmo equilibrado'],
    confidence: 0.94,
    tags: ['lisboa', 'familia', 'criancas', 'voo-direto', 'hotel-central'],
  },
  {
    expertName: 'Curadoria Voya',
    destination: 'Qualquer destino',
    category: 'orçamento',
    insight: 'Quando o orçamento estiver apertado, preserve o voo mais eficiente e ajuste hotel ou experiências antes de aceitar uma conexão ruim.',
    reason: 'O cansaço do deslocamento costuma contaminar vários dias da viagem.',
    applicableTo: ['orçamento controlado', 'família', 'ritmo leve', 'milhas'],
    confidence: 0.87,
    tags: ['orcamento', 'voos', 'conexao', 'milhas', 'estrategia'],
  },
  {
    expertName: 'Curadoria Voya',
    destination: 'Qualquer destino',
    category: 'milhas e Wallet',
    insight: 'Use milhas onde elas removem maior custo absoluto e use Wallet para capturar benefícios de hotel, lounge e proteção de viagem.',
    reason: 'A melhor estratégia raramente é usar pontos em tudo; é usar cada benefício onde ele tem mais impacto.',
    applicableTo: ['milhas', 'Wallet', 'premium consciente', 'orçamento controlado'],
    confidence: 0.91,
    tags: ['milhas', 'wallet', 'pontos', 'beneficios', 'estrategia'],
  },
];

function normalizeList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).toLowerCase());
  if (!value) return [];
  return String(value).toLowerCase().split(/[,\s]+/).filter(Boolean);
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getContextTokens(tripContext = {}) {
  return [
    tripContext.destination,
    tripContext.profile,
    tripContext.travelerType,
    tripContext.rhythm,
    tripContext.budget,
    tripContext.children ? 'crianças família' : '',
    ...normalizeList(tripContext.interests),
  ].map(normalizeText).filter(Boolean);
}

function scoreInsight(insight, tokens) {
  const searchable = [
    insight.destination,
    insight.category,
    insight.insight,
    insight.reason,
    ...(insight.applicableTo || []),
    ...(insight.tags || []),
  ].join(' ').toLowerCase();

  const tokenScore = tokens.reduce((score, token) => (
    searchable.includes(token) || token.includes(insight.destination.toLowerCase())
      ? score + 1
      : score
  ), 0);

  const globalScore = insight.destination === 'Qualquer destino' ? 0.5 : 0;
  return tokenScore + globalScore + insight.confidence;
}

export function getExpertRecommendations(tripContext = {}) {
  const tokens = getContextTokens(tripContext);
  const destination = normalizeText(tripContext.destination);

  return MOCK_EXPERT_INSIGHTS
    .map((insight) => ({
      ...insight,
      relevanceScore: scoreInsight(insight, tokens),
    }))
    .filter((insight) => {
      const isGlobal = insight.destination === 'Qualquer destino';
      const matchesDestination = destination && normalizeText(insight.destination).includes(destination);
      if (destination) return isGlobal || matchesDestination;
      return insight.relevanceScore >= 2;
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore || b.confidence - a.confidence)
    .slice(0, tripContext.limit || 5)
    .map(({ relevanceScore, ...insight }) => insight);
}

export { MOCK_EXPERT_INSIGHTS };
