import { isRealDataMode } from '../dataMode.js';
import { expertKnowledgeSeed } from '../knowledge/expertKnowledgeSeed.js';

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
  if (isRealDataMode(tripContext.env)) return [];

  const tokens = getContextTokens(tripContext);
  const destination = normalizeText(tripContext.destination);

  return expertKnowledgeSeed
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

export { expertKnowledgeSeed };
