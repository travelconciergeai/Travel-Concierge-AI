import { isRealDataMode } from './dataMode.js';
import { activeTripContextToText, getActiveTripContext } from './activeTripContext.js';

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function extractDatePhrase(text = '') {
  const original = String(text);
  const normalized = normalizeText(original);
  const rangeWithMonth = original.match(/\b(?:de\s*)?(\d{1,2})\s*(?:a|até|-)\s*(\d{1,2})\s*de\s*(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/i);
  if (rangeWithMonth) return `${rangeWithMonth[1]} a ${rangeWithMonth[2]} de ${rangeWithMonth[3].toLowerCase()}`;
  const monthOnly = normalized.match(/\bem\s+(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/);
  if (monthOnly) return `em ${monthOnly[1]}`;
  if (/semana que vem/.test(normalized)) return 'semana que vem';
  if (/datas flexiveis|datas abertas|flexivel|flexiveis/.test(normalized)) return 'datas flexíveis';
  const slashRange = original.match(/\b(\d{1,2}\/\d{1,2})(?:\s*(?:a|até|-)\s*(\d{1,2}\/\d{1,2}))?\b/i);
  if (slashRange) return slashRange[2] ? `${slashRange[1]} a ${slashRange[2]}` : slashRange[1];
  return '';
}

function extractDestinationPhrase(text = '') {
  const original = String(text);
  const normalized = normalizeText(original);
  const known = [
    ['buenos aires', 'Buenos Aires'],
    ['lisboa', 'Lisboa'],
    ['lisbon', 'Lisboa'],
    ['orlando', 'Orlando Disney'],
    ['disney', 'Orlando Disney'],
    ['paris', 'Paris'],
    ['porto', 'Porto'],
    ['roma', 'Roma'],
    ['japao', 'Japão'],
    ['japão', 'Japão'],
    ['portugal', 'Portugal'],
    ['londres', 'Londres'],
    ['madrid', 'Madrid'],
    ['miami', 'Miami'],
  ];
  const found = known.find(([key]) => normalized.includes(key));
  if (found) return found[1];

  const destinationMatch = original.match(/\b(?:em|para|pra|no|na|nos|nas)\s+([A-Za-zÀ-ÿ]+(?:\s+(?!para\b|com\b|vamos\b|vou\b|ficar\b|de\b|do\b|da\b|dos\b|das\b|em\b)[A-Za-zÀ-ÿ]+){0,3})/i);
  if (!destinationMatch) return '';
  const value = destinationMatch[1].trim().replace(/[,.!?]+$/, '');
  if (!value || /^(hotel|hoteis|hotéis|casal|familia|família|setembro|janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|outubro|novembro|dezembro)$/i.test(value)) return '';
  return value.split(/\s+/).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

function hasDestination(text) {
  return Boolean(extractDestinationPhrase(text)) || /destino:/i.test(text);
}

function hasDates(text) {
  return Boolean(extractDatePhrase(text)) || /(\d+\s*(dias|noites))/i.test(text);
}

function hasTravelers(text) {
  return /(casal|familia|crianca|filho|filha|marido|esposa|\d+\s*(adultos|pessoas|viajantes|passageiros))/i.test(text);
}

function hasStyle(text) {
  return /(boutique|romantico|luxo|premium|conforto|economico|central|resort|custo-beneficio|perfil:|estilo:|orcamento\/estilo:)/i.test(text);
}

function hasOrigin(text) {
  return /(origem:|gru|sao paulo|rio de janeiro|galeao|brasilia|campinas|saindo de|partindo de)/i.test(text);
}

function detectGuidedIntent(message) {
  if (/hotel|hoteis|hospedagem|pousada|resort/.test(message)) return 'hotel';
  if (/voo|voos|passagem|passagens|aereo|aerea/.test(message)) return 'voo';
  if (/mesmo destino|essa viagem|este roteiro|continuar viagem|continuar roteiro/.test(message)) return 'roteiro';
  if (/roteiro|planejar|viagem|viajar|marido|esposa|casal|disney|ferias/.test(message)) return 'roteiro';
  return null;
}

function getMissingForIntent(intent, text) {
  if (intent === 'hotel') {
    return [
      !hasDestination(text) && 'destino',
      !hasDates(text) && 'datas',
      !hasTravelers(text) && 'viajantes',
      !hasStyle(text) && 'estilo',
    ].filter(Boolean);
  }
  if (intent === 'voo') {
    return [
      !hasOrigin(text) && 'origem',
      !hasDestination(text) && 'destino',
      !hasDates(text) && 'datas',
      !hasTravelers(text) && 'passageiros',
    ].filter(Boolean);
  }
  if (intent === 'roteiro') {
    return [
      !hasDestination(text) && 'destino',
      !hasDates(text) && 'duração',
      !hasTravelers(text) && 'perfil',
      !hasStyle(text) && 'orçamento',
    ].filter(Boolean);
  }
  return [];
}

function extractGuidedContext(text = '', intent = 'geral') {
  const destination = extractDestinationPhrase(text);
  const dates = extractDatePhrase(text);
  const family = /(familia|crianca|filho|filha)/i.test(text);
  const couple = /(casal|marido|esposa|romantico|lua de mel|para casal)/i.test(text);
  const boutique = /boutique/i.test(text);
  const romantic = /(romantico|lua de mel)/i.test(text);
  const romanticProfile = romantic || /(casal|marido|esposa)/i.test(text);
  const disney = /(disney|orlando|parque)/i.test(text);
  const budget = /(econom|barato|custo-beneficio)/i.test(text)
    ? 'custo-benefício'
    : /(luxo|premium|conforto)/i.test(text)
      ? 'premium consciente'
      : '';

  return {
    intent,
    destination,
    travelers: family ? 'família com crianças' : couple ? 'casal' : '',
    profile: family ? 'família' : couple ? 'casal' : disney ? 'Disney' : '',
    dates,
    flexibility: dates === 'datas flexíveis' ? 'flexível' : false,
    style: [
      boutique && 'boutique',
      romantic && 'romântico',
      family && 'conforto para família',
      disney && 'Disney com descanso',
    ].filter(Boolean).join(' ') || '',
    accommodationStyle: boutique ? 'hotel boutique' : family ? 'hotel prático para família' : '',
    tripPurpose: romanticProfile ? 'viagem a dois' : family ? 'viagem em família' : disney ? 'Disney' : '',
    budget,
    priorities: [
      romanticProfile && 'localização charmosa',
      family && 'menos deslocamento',
      disney && 'proximidade dos parques',
      boutique && 'atmosfera boutique',
    ].filter(Boolean),
    originalMessage: text,
  };
}

function hasContextValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(String(value || '').trim());
}

function getMissingForExtractedContext(intent, text, context = extractGuidedContext(text, intent)) {
  if (intent === 'hotel') {
    return [
      !hasContextValue(context.destination) && !hasDestination(text) && 'destino',
      !hasContextValue(context.dates) && !hasDates(text) && 'datas',
      !hasContextValue(context.travelers || context.profile) && !hasTravelers(text) && 'viajantes',
      !hasContextValue(context.style || context.accommodationStyle || context.budget) && !hasStyle(text) && 'estilo',
    ].filter(Boolean);
  }
  if (intent === 'voo') {
    return [
      !hasOrigin(text) && 'origem',
      !hasContextValue(context.destination) && !hasDestination(text) && 'destino',
      !hasContextValue(context.dates) && !hasDates(text) && 'datas',
      !hasContextValue(context.travelers || context.profile) && !hasTravelers(text) && 'passageiros',
    ].filter(Boolean);
  }
  if (intent === 'roteiro') {
    return [
      !hasContextValue(context.destination) && !hasDestination(text) && 'destino',
      !hasContextValue(context.dates) && !hasDates(text) && 'duração',
      !hasContextValue(context.travelers || context.profile || context.tripPurpose) && !hasTravelers(text) && 'perfil',
      !hasContextValue(context.budget || context.style) && !hasStyle(text) && 'orçamento',
    ].filter(Boolean);
  }
  return [];
}

function guidedReplyForMissing(field, context = {}) {
  const destination = context.destination ? ` para ${context.destination}` : '';
  const replies = {
    destino: 'Claro. Antes de buscar, preciso entender o destino para não te trazer opções soltas.',
    datas: `Perfeito. Para buscar com precisão${destination}, quais datas ou janela você imagina?`,
    viajantes: 'Perfeito. Quem vai viajar?',
    passageiros: 'Perfeito. Quem vai voar?',
    estilo: 'Perfeito. Qual estilo de hospedagem devo priorizar?',
    origem: 'Perfeito. De qual cidade você sairá?',
    duração: `Perfeito. Quantos dias você imagina${destination}?`,
    perfil: 'Perfeito. Quem vai viajar e qual é o perfil da viagem?',
    orçamento: 'Perfeito. Qual prioridade devo respeitar: custo-benefício, conforto ou premium consciente?',
  };
  return replies[field] || 'Perfeito. Só preciso de mais um detalhe para seguir.';
}

function buildLocalGuidedResponse(message, messages = []) {
  const activeContext = getActiveTripContext();
  const text = normalizeText([
    activeTripContextToText(activeContext),
    ...messages.map((item) => item.content || item.text || ''),
    message,
  ].filter(Boolean).join('\n'));
  const intent = detectGuidedIntent(text);
  if (!intent) return null;

  const context = { ...activeContext, ...extractGuidedContext(text, intent) };
  const missing = getMissingForExtractedContext(intent, text, context);
  if (!missing.length) return null;

  return {
    reply: guidedReplyForMissing(missing[0], context),
    source: 'guided',
    tools: {},
    toolCalls: [],
    guidedPaths: {
      kind: intent,
      missing,
      context,
      title: 'Vamos calibrar antes de buscar',
      subtitle: 'Escolha uma opção ou escreva com suas palavras.',
      options: [],
    },
  };
}

const clientFallback = (message) => {
  if (isRealDataMode()) {
    return 'Não consegui acessar dados reais agora. Prefiro não te mostrar informações imprecisas. Tenta novamente daqui a pouquinho.';
  }

  const text = message.toLowerCase();
  if (text.includes('milha')) return 'Sem chave de IA configurada, usei o modo demonstração: vale comparar pontos no trecho internacional e dinheiro nos trechos curtos.';
  if (text.includes('hotel')) return 'Sem chave de IA configurada, usei o modo demonstração: manteria hotéis bem localizados para reduzir deslocamentos e preservar conforto.';
  if (text.includes('voo')) return 'Sem chave de IA configurada, usei o modo demonstração: compararia voo direto com pontos contra uma opção paga com conexão curta.';
  return 'Sem chave de IA configurada, respondi no modo demonstração. Posso ajudar com roteiro, wallet, milhas, voos, hotéis, passeios, agenda ou PDF.';
};

export async function sendChatMessage({ message, messages = [] }) {
  const activeTripContext = getActiveTripContext();
  const localGuided = buildLocalGuidedResponse(message, messages);
  if (localGuided) return localGuided;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, messages, activeTripContext }),
    });

    if (!response.ok) throw new Error(`Chat request failed: ${response.status}`);
    const data = await response.json();
    return {
      reply: data.reply || clientFallback(message),
      source: data.source || 'unknown',
      tools: data.tools || {},
      hotelSearch: data.tools?.buscarHoteis || data.hotelSearch || null,
      toolCalls: data.toolCalls || [],
      guidedPaths: data.guidedPaths || null,
    };
  } catch (error) {
    return {
      reply: clientFallback(message),
      source: 'client-fallback',
      tools: {},
      error: error.message,
    };
  }
}
