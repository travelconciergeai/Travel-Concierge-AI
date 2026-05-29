import { isRealDataMode } from './dataMode.js';
import { activeTripContextToText, getActiveTripContext } from './activeTripContext.js';

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function hasDestination(text) {
  return /(lisboa|lisbon|paris|orlando|disney|porto|roma|londres|madrid|tokyo|toquio|nova york|miami|destino:)/i.test(text);
}

function hasDates(text) {
  return /(flexivel|flexiveis|datas|janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|\d{1,2}\/\d{1,2}|\d+\s*(dias|noites))/i.test(text);
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
  const destinationMap = [
    ['lisboa', 'Lisboa'],
    ['lisbon', 'Lisboa'],
    ['orlando', 'Orlando Disney'],
    ['disney', 'Orlando Disney'],
    ['paris', 'Paris'],
    ['porto', 'Porto'],
    ['roma', 'Roma'],
    ['londres', 'Londres'],
    ['madrid', 'Madrid'],
    ['miami', 'Miami'],
  ];
  const destination = destinationMap.find(([key]) => text.includes(key))?.[1] || '';
  const family = /(familia|crianca|filho|filha)/i.test(text);
  const couple = /(casal|marido|esposa|romantico|lua de mel)/i.test(text);
  const boutique = /boutique/i.test(text);
  const romantic = /(romantico|lua de mel|casal|marido|esposa)/i.test(text);
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
    dates: hasDates(text) ? 'datas flexíveis' : '',
    style: [
      boutique && 'boutique',
      romantic && 'romântico',
      family && 'conforto para família',
      disney && 'Disney com descanso',
    ].filter(Boolean).join(' ') || '',
    accommodationStyle: boutique ? 'hotel boutique' : family ? 'hotel prático para família' : '',
    tripPurpose: romantic ? 'viagem a dois' : family ? 'viagem em família' : disney ? 'Disney' : '',
    budget,
    priorities: [
      romantic && 'localização charmosa',
      family && 'menos deslocamento',
      disney && 'proximidade dos parques',
      boutique && 'atmosfera boutique',
    ].filter(Boolean),
    originalMessage: text,
  };
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

  const missing = getMissingForIntent(intent, text);
  if (!missing.length) return null;

  return {
    reply: missing[0] === 'destino'
      ? 'Claro. Antes de buscar, preciso entender o destino para não te trazer opções soltas.'
      : 'Perfeito. Só preciso fechar mais um detalhe para buscar com precisão.',
    source: 'guided',
    tools: {},
    toolCalls: [],
    guidedPaths: {
      kind: intent,
      missing,
      context: { ...activeContext, ...extractGuidedContext(text, intent) },
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
