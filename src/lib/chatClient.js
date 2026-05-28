import { isRealDataMode } from './dataMode.js';

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

function buildLocalGuidedResponse(message, messages = []) {
  const text = normalizeText([
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
  const localGuided = buildLocalGuidedResponse(message, messages);
  if (localGuided) return localGuided;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, messages }),
    });

    if (!response.ok) throw new Error(`Chat request failed: ${response.status}`);
    const data = await response.json();
    return {
      reply: data.reply || clientFallback(message),
      source: data.source || 'unknown',
      tools: data.tools || {},
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
