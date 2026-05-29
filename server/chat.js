import OpenAI from 'openai';
import { createAgentTools, runMockTools } from './tools.js';
import { VOYA_AGENT_SYSTEM_PROMPT } from './agentPrompt.js';
import { isRealDataMode } from './dataMode.js';
import { userFacingErrorMessages } from './knowledge/errorMessages.js';

const FALLBACK_REPLIES = [
  {
    match: ['barato', 'econom', 'preço', 'preco'],
    text: 'Para uma revisão de custo, eu reduziria uma diária premium, manteria o ponto alto da viagem e compararia voos com milhas antes de mexer nas experiências. Qual é o teto de orçamento que você quer respeitar?',
  },
  {
    match: ['criança', 'filho', 'família', 'familia'],
    text: 'Perfeito. Eu ajustaria o ritmo para família: menos deslocamentos, pausas reais e experiências mais curtas no fim do dia. Qual a idade das crianças?',
  },
  {
    match: ['milha', 'pontos'],
    text: 'Eu começaria comparando milhas no trecho internacional e dinheiro nos trechos curtos. A economia tende a aparecer melhor no voo principal. Você quer priorizar menor custo ou menor tempo de voo?',
  },
  {
    match: ['voo', 'passagem'],
    text: 'Para uma viagem premium, eu priorizaria menor tempo total, boa chegada e conexão segura. Suas datas são flexíveis?',
  },
  {
    match: ['hotel', 'hoteis', 'hotéis'],
    text: 'Eu manteria uma base muito bem localizada e evitaria economias que aumentem deslocamento. Você prefere boutique discreto ou luxo mais completo?',
  },
];

const instructions = VOYA_AGENT_SYSTEM_PROMPT;
const REAL_DATA_UNAVAILABLE_MESSAGE = userFacingErrorMessages.realDataUnavailable;

function isHotelSearchIntent(message = '') {
  return /hotel|hot[eé]is|hoteis|hospedagem|pousada|resort|di[aá]ria|booking/i.test(message);
}

function isFlightSearchIntent(message = '') {
  return /voo|voos|passagem|passagens|a[eé]reo|a[eé]rea/i.test(message);
}

function detectIntent(message = '') {
  const text = message.toLowerCase();
  if (isHotelSearchIntent(message)) return 'hotel';
  if (isFlightSearchIntent(message)) return 'voo';
  if (/passeio|passeios|tour|tours|experi[eê]ncia|experiencias|experiências/i.test(message)) return 'passeio';
  if (/wallet|cart[aã]o|cartao|milha|milhas|pontos/i.test(message)) return 'wallet-milhas';
  if (/agenda|calend[aá]rio|calendario/i.test(message)) return 'agenda';
  if (/pdf|exportar|compartilh[aá]vel|compartilhavel/i.test(message)) return 'pdf';
  if (/mesmo destino|essa viagem|este roteiro|continuar viagem|continuar roteiro/i.test(message)) return 'roteiro';
  if (/decidir|recomenda|recomenda[cç][aã]o|melhor combina[cç][aã]o|pacote|combinar/i.test(message)) return 'recomendacao';
  if (/roteiro|montar|criar|planejar|plano|itiner[aá]rio|itinerario|alterar|editar|trocar|descanso|leve|ritmo/i.test(text)) return 'roteiro';
  if (/viajar|viagem|marido|esposa|casal|disney|fam[ií]lia|f[eé]rias/i.test(message)) return 'roteiro';
  return 'geral';
}

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function activeTripContextToText(context = {}) {
  return [
    context.destination && `Destino: ${context.destination}.`,
    context.city && `Cidade: ${context.city}.`,
    context.country && `País: ${context.country}.`,
    context.travelers && `Viajantes: ${context.travelers}.`,
    context.dates && `Datas: ${context.dates}.`,
    context.flexibility && `Flexibilidade: ${context.flexibility}.`,
    context.tripStyle && `Estilo: ${context.tripStyle}.`,
    context.accommodationStyle && `Hospedagem: ${context.accommodationStyle}.`,
    context.budget && `Orçamento: ${context.budget}.`,
    context.priority && `Prioridade: ${context.priority}.`,
    context.purpose && `Propósito: ${context.purpose}.`,
    context.hotel?.name && `Hotel aplicado: ${context.hotel.name}.`,
  ].filter(Boolean).join(' ');
}

function buildConversationText(messages = [], message = '', activeTripContext = {}) {
  return [
    activeTripContextToText(activeTripContext),
    ...(messages || []).map((item) => item.content || item.text || ''),
    message,
  ].filter(Boolean).join('\n');
}

function extractDatePhrase(text = '') {
  const normalized = normalizeText(text);
  const original = String(text);
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
  const stopWords = /^(hotel|hoteis|hotéis|casal|familia|família|setembro|janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|outubro|novembro|dezembro)$/i;
  const value = destinationMatch[1].trim().replace(/[,.!?]+$/, '');
  if (!value || stopWords.test(value)) return '';
  return value.split(/\s+/).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

function hasDestination(text) {
  return Boolean(extractDestinationPhrase(text))
    || /\b(destino|cidade)\s*:\s*\S+/i.test(text);
}

function hasDatesOrFlex(text) {
  return Boolean(extractDatePhrase(text))
    || /(\d{4}-\d{2}-\d{2}|\b\d+\s*(dias|noites)\b)/i.test(normalizeText(text));
}

function hasTravelers(text) {
  const normalized = normalizeText(text);
  return /(familia|crianca|filho|filha|marido|esposa|casal|\b\d+\s*(adultos|pessoas|viajantes|passageiros|criancas)\b)/i.test(normalized);
}

function hasHotelStyle(text) {
  const normalized = normalizeText(text);
  return /(boutique|romantico|luxo|premium|conforto|economico|central|resort|familia|crianca|pratico|perto|localizacao|charme)/i.test(normalized);
}

function hasOrigin(text) {
  const normalized = normalizeText(text);
  return /(gru|sao paulo|rio de janeiro|galeao|brasilia|campinas|\borigem\s*:|\bsaindo de\b|\bpartindo de\b|\bde\s+[a-z]{3,})/i.test(normalized);
}

function hasDuration(text) {
  const normalized = normalizeText(text);
  return /(\b\d+\s*(dias|noites|semanas)\b|fim de semana|uma semana|duas semanas|duracao\s*:)/i.test(normalized);
}

function hasTripProfile(text) {
  const normalized = normalizeText(text);
  return /(casal|marido|esposa|familia|crianca|filho|filha|lua de mel|amigos|solo|disney|cultura|gastronomia|descanso|aventura)/i.test(normalized);
}

function hasBudgetOrStyle(text) {
  const normalized = normalizeText(text);
  return /(orcamento|budget|barato|economico|custo-beneficio|premium|luxo|conforto|boutique|romantico|\br\$\s*\d+)/i.test(normalized);
}

function getMissingContext(intent, text) {
  if (intent === 'hotel') {
    return [
      !hasDestination(text) && 'destino',
      !hasDatesOrFlex(text) && 'datas',
      !hasTravelers(text) && 'viajantes',
      !hasHotelStyle(text) && 'estilo',
    ].filter(Boolean);
  }
  if (intent === 'voo') {
    return [
      !hasOrigin(text) && 'origem',
      !hasDestination(text) && 'destino',
      !hasDatesOrFlex(text) && 'datas',
      !hasTravelers(text) && 'passageiros',
    ].filter(Boolean);
  }
  if (intent === 'roteiro' || intent === 'recomendacao') {
    return [
      !hasDestination(text) && 'destino',
      !hasDuration(text) && 'duração',
      !hasTripProfile(text) && 'perfil',
      !hasBudgetOrStyle(text) && 'orçamento',
    ].filter(Boolean);
  }
  return [];
}

function option(id, label, hint, icon = 'Sparkles', value = label) {
  return { id, label, hint, icon, value };
}

function extractGuidedContext(text = '', intent = 'geral') {
  const normalized = normalizeText(text);
  const destination = extractDestinationPhrase(text);
  const dates = extractDatePhrase(text);
  const family = /(familia|crianca|filho|filha)/i.test(normalized);
  const couple = /(casal|marido|esposa|romantico|lua de mel|para casal)/i.test(normalized);
  const boutique = /boutique/i.test(normalized);
  const romantic = /(romantico|lua de mel)/i.test(normalized);
  const romanticProfile = romantic || /(casal|marido|esposa)/i.test(normalized);
  const disney = /(disney|orlando|parque)/i.test(normalized);
  const budget = /(econom|barato|custo-beneficio)/i.test(normalized)
    ? 'custo-benefício'
    : /(luxo|premium|conforto)/i.test(normalized)
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

function buildGuidedPaths(intent, missing = [], conversationText = '') {
  const first = missing[0];
  const context = extractGuidedContext(conversationText, intent);
  const common = {
    destino: [
      option('dest-lisboa', 'Lisboa', 'Cidade, bairros caminháveis e boa gastronomia', 'MapPin', 'Destino: Lisboa'),
      option('dest-disney', 'Disney / Orlando', 'Logística, parques e ritmo com descanso', 'MapPin', 'Destino: Orlando Disney'),
      option('dest-paris', 'Paris', 'Hotel bem localizado, cultura e gastronomia', 'MapPin', 'Destino: Paris'),
    ],
    datas: [
      option('dates-flex', 'Datas flexíveis', 'Posso comparar janelas melhores', 'Calendar', 'Datas: flexíveis'),
      option('dates-month', 'Tenho um mês em mente', 'Diga o mês e eu sigo por aproximação', 'Calendar', 'Datas: mês a definir'),
      option('dates-fixed', 'Tenho datas exatas', 'Escreva ida e volta no chat', 'Calendar', 'Datas: vou informar datas exatas'),
    ],
    viajantes: [
      option('trav-couple', 'Casal', 'Boa base, atmosfera e experiências memoráveis', 'Users', 'Viajantes: casal'),
      option('trav-family', 'Família com crianças', 'Menos deslocamento e mais pausas', 'Users', 'Viajantes: família com crianças'),
      option('trav-adults', 'Adultos', 'Conforto e praticidade no ritmo da viagem', 'Users', 'Viajantes: adultos'),
    ],
    passageiros: [
      option('pax-one', '1 passageiro', 'Busca individual', 'Users', 'Passageiros: 1 adulto'),
      option('pax-two', '2 passageiros', 'Casal ou dois adultos', 'Users', 'Passageiros: 2 adultos'),
      option('pax-family', 'Família', 'Adultos e crianças', 'Users', 'Passageiros: família com crianças'),
    ],
    estilo: [
      option('style-boutique', 'Boutique romântico', 'Charme, localização e atmosfera', 'Heart', 'Estilo: hotel boutique romântico'),
      option('style-family', 'Conforto para família', 'Quartos práticos e baixa fricção', 'Users', 'Estilo: conforto para família'),
      option('style-value', 'Custo-benefício', 'Boa localização sem excesso de tarifa', 'Coins', 'Estilo: custo-benefício'),
    ],
    origem: [
      option('origin-gru', 'São Paulo / GRU', 'Saída de Guarulhos', 'Plane', 'Origem: GRU São Paulo'),
      option('origin-rio', 'Rio de Janeiro', 'Saída do Rio', 'Plane', 'Origem: Rio de Janeiro'),
      option('origin-other', 'Outra origem', 'Escreva a cidade ou aeroporto', 'Plane', 'Origem: vou informar'),
    ],
    duração: [
      option('dur-week', '7 dias', 'Boa duração para uma primeira versão', 'Calendar', 'Duração: 7 dias'),
      option('dur-ten', '10 dias', 'Mais respiro e menos correria', 'Calendar', 'Duração: 10 dias'),
      option('dur-flex', 'Duração flexível', 'Ajustamos pelo destino e orçamento', 'Calendar', 'Duração: flexível'),
    ],
    perfil: [
      option('profile-couple', 'Casal', 'Boutique, atmosfera e boas reservas', 'Heart', 'Perfil: casal'),
      option('profile-family', 'Família', 'Pausas, horários bons e conforto', 'Users', 'Perfil: família'),
      option('profile-disney', 'Disney com criança', 'Parques, descanso e logística', 'Sparkles', 'Perfil: Disney com criança'),
    ],
    orçamento: [
      option('budget-value', 'Priorizar custo-benefício', 'Economizar sem perder conforto essencial', 'Coins', 'Orçamento/estilo: custo-benefício'),
      option('budget-comfort', 'Priorizar conforto', 'Menos atrito e melhor localização', 'Sparkles', 'Orçamento/estilo: conforto'),
      option('budget-premium', 'Premium consciente', 'Boa experiência sem exageros', 'Award', 'Orçamento/estilo: premium consciente'),
    ],
  };

  const actionOptions = {
    hotel: [option('see-hotels', 'Ver hotéis', 'Depois que fecharmos o contexto mínimo', 'Bed', 'Ver hotéis')],
    voo: [option('see-flights', 'Ver voos', 'Depois que fecharmos o contexto mínimo', 'Plane', 'Ver voos')],
    roteiro: [option('build-plan', 'Montar roteiro', 'Depois que fecharmos o contexto mínimo', 'Map', 'Montar roteiro')],
    recomendacao: [option('build-plan', 'Montar roteiro', 'Depois que fecharmos o contexto mínimo', 'Map', 'Montar roteiro')],
  };

  const options = common[first] || actionOptions[intent] || [
    option('choose-destination', 'Escolher destino', 'Começar pela cidade ou região', 'MapPin', 'Escolher destino'),
    option('choose-style', 'Escolher estilo da viagem', 'Conforto, orçamento ou atmosfera', 'Sparkles', 'Escolher estilo da viagem'),
  ];

  return {
    kind: intent,
    missing,
    context,
    title: first ? 'Vamos calibrar antes de buscar' : 'Pronto para consultar',
    subtitle: first ? 'Escolha uma opção ou escreva com suas palavras.' : 'Já tenho o mínimo para avançar.',
    options,
  };
}

function shouldGuideIntent(intent, conversationText) {
  const missing = getMissingContext(intent, conversationText);
  return ['hotel', 'voo', 'roteiro', 'recomendacao'].includes(intent) && missing.length > 0
    ? { missing, guidedPaths: buildGuidedPaths(intent, missing, conversationText) }
    : null;
}

async function runDeterministicTools({ intent, env, message }) {
  const agentTools = createAgentTools(env);
  const args = { message };

  if (intent === 'hotel') {
    return {
      tools: { buscarHoteis: await agentTools.buscarHoteis(args) },
      toolCalls: [{ name: 'hotelSearch', deterministic: true }],
    };
  }
  if (intent === 'voo') {
    return {
      tools: { buscarVoos: await agentTools.buscarVoos(args) },
      toolCalls: [{ name: 'flightSearch', deterministic: true }],
    };
  }
  if (intent === 'passeio') {
    return {
      tools: { buscarPasseios: await agentTools.buscarPasseios(args) },
      toolCalls: [{ name: 'tourSearch', deterministic: true }],
    };
  }
  if (intent === 'wallet-milhas') {
    const [wallet, miles] = await Promise.all([
      agentTools.consultarWallet(args),
      agentTools.sugerirMilhas(args),
    ]);
    return {
      tools: { consultarWallet: wallet, sugerirMilhas: miles },
      toolCalls: [
        { name: 'consultarWallet', deterministic: true },
        { name: 'sugerirMilhas', deterministic: true },
      ],
    };
  }
  if (intent === 'agenda') {
    return {
      tools: { adicionarAgenda: await agentTools.adicionarAgenda(args) },
      toolCalls: [{ name: 'adicionarAgenda', deterministic: true }],
    };
  }
  if (intent === 'pdf') {
    return {
      tools: { gerarPDF: await agentTools.gerarPDF(args) },
      toolCalls: [{ name: 'gerarPDF', deterministic: true }],
    };
  }
  if (intent === 'roteiro') {
    const toolName = /alterar|editar|trocar|descanso|leve|ritmo|econom/i.test(message) ? 'editarRoteiro' : 'criarRoteiro';
    return {
      tools: { [toolName]: await agentTools[toolName](args) },
      toolCalls: [{ name: toolName, deterministic: true }],
    };
  }
  if (intent === 'recomendacao') {
    return {
      tools: { recomendarViagem: await agentTools.recomendarViagem(args) },
      toolCalls: [{ name: 'recomendarViagem', deterministic: true }],
    };
  }

  return { tools: {}, toolCalls: [] };
}

function isHotelToolFailure(tool) {
  return !tool || tool.status === 'not-configured' || tool.status === 'error' || !tool.options?.length;
}

function isFlightToolFailure(tool) {
  return !tool || tool.status === 'not-configured' || tool.status === 'error' || !tool.options?.length;
}

function realModeToolError(intent, tool) {
  if (intent === 'hotel') {
    return REAL_DATA_UNAVAILABLE_MESSAGE;
  }
  if (intent === 'voo') {
    return REAL_DATA_UNAVAILABLE_MESSAGE;
  }
  if (intent === 'pdf' || intent === 'agenda') {
    return 'Essa ação exige confirmação/integração real. Não vou simular compra, reserva, agenda ou exportação em modo real.';
  }
  if (intent === 'passeio') {
    return userFacingErrorMessages.providerUnavailable;
  }
  if (intent === 'wallet-milhas') {
    return 'Ainda não consigo acessar seus saldos e benefícios reais. Prefiro não estimar economia sem esses dados.';
  }
  if (intent === 'roteiro') {
    return userFacingErrorMessages.insufficientInformation;
  }
  if (intent === 'recomendacao') {
    return userFacingErrorMessages.insufficientInformation;
  }
  return REAL_DATA_UNAVAILABLE_MESSAGE;
}

function fallbackReply(message, tools) {
  const text = message.toLowerCase();
  const found = FALLBACK_REPLIES.find((item) => item.match.some((word) => text.includes(word)));
  const toolNames = Object.keys(tools || {});

  if (toolNames.includes('recomendarViagem')) {
    const recommendation = tools.recomendarViagem?.recommendations;
    const overall = recommendation?.bestOverall;
    const economical = recommendation?.mostEconomical;
    const comfortable = recommendation?.mostComfortable;
    const family = recommendation?.bestFamily;
    const wallet = recommendation?.milesWalletStrategy;
    const alerts = recommendation?.alerts || [];
    const expert = tools.recomendarViagem?.expertInsights?.[0];

    return [
      'Montei uma recomendação estratégica da viagem.',
      `Melhor combinação geral: ${overall?.rationale || 'combinar voo, hotel e passeio com menor atrito.'}`,
      `Opção mais econômica: ${economical?.rationale || 'priorizar preço sem criar desgaste demais.'}`,
      `Mais confortável: ${comfortable?.rationale || 'priorizar conforto, localização e experiência memorável.'}`,
      `Melhor para família: ${family?.rationale || 'reduzir deslocamentos, conexão e excesso de agenda.'}`,
      `Milhas/Wallet: ${wallet?.recommendation || 'comparar emissão com milhas e aplicar benefícios de hotel.'}`,
      expert ? `Insight usado: ${expert.expertName} recomenda ${expert.insight}` : '',
      alerts.length ? `Atenção: ${alerts[0]}` : '',
    ].filter(Boolean).join(' ');
  }
  if (toolNames.includes('buscarVoos')) {
    const flightTool = tools.buscarVoos || {};
    const ranking = flightTool.ranking?.recommendations || {};
    const overall = ranking.bestOverall;
    const price = ranking.bestPrice;
    const family = ranking.bestFamily;
    const miles = ranking.bestMiles;
    const comfort = ranking.bestComfort;
    const shortest = ranking.shortestDuration;
    const safest = ranking.lowestConnectionRisk;
    const statusText = flightTool.status === 'mocked' ? 'Estes dados são demonstrativos.' : '';
    const bookingUrl = overall?.bookingUrl || miles?.bookingUrl || price?.bookingUrl;

    return [
      `${statusText} Eu escolheria ${overall?.label || 'a melhor opção geral'} como melhor voo geral porque equilibra duração, conforto, risco de conexão e uso da Wallet.`,
      price?.label ? `Se quiser economizar, ${price.label} é o melhor preço, mas eu validaria se a economia compensa o desgaste.` : '',
      family?.label ? `Para família/crianças, ${family.label} é a opção mais confortável porque reduz atrito e risco operacional.` : '',
      miles?.label ? `Com milhas, eu testaria ${miles.label}${miles.milesPrice ? ` (${miles.milesPrice})` : ''} antes de pagar em dinheiro.` : '',
      comfort?.label ? `Para conforto, ${comfort.label} fica melhor por cabine, benefícios e menor desgaste.` : '',
      shortest?.label ? `Menor duração: ${shortest.label}.` : '',
      safest?.label ? `Menor risco de conexão: ${safest.label}.` : '',
      'Wallet: eu priorizaria lounge, embarque prioritário, seguro e bagagem antes de otimizar só preço.',
      bookingUrl ? `Link de reserva: ${bookingUrl}` : '',
    ].filter(Boolean).join(' ');
  }
  if (toolNames.includes('buscarHoteis')) {
    const hotelTool = tools.buscarHoteis || {};
    if (hotelTool.status === 'not-configured') {
      return userFacingErrorMessages.providerUnavailable;
    }
    if (hotelTool.status === 'error') {
      return userFacingErrorMessages.hotelSearchFailed;
    }

    const ranking = hotelTool.ranking?.recommendations || {};
    const overall = ranking.bestOverall;
    const expertMatch = ranking.bestExpertMatch;
    const value = ranking.bestValue;
    const bestPrice = ranking.bestPrice;
    const family = ranking.bestFamily;
    const statusText = hotelTool.status === 'mocked' ? 'Estes dados são demonstrativos.' : '';
    const expert = expertMatch?.matchedExpertRecommendation;
    const bookingUrl = overall?.bookingUrl || expertMatch?.bookingUrl || value?.bookingUrl;

    return [
      `${statusText ? `${statusText} ` : ''}Eu escolheria ${overall?.name || 'a melhor opção geral'} como melhor opção geral porque combina localização, conforto e aderência ao perfil da viagem.`,
      expertMatch?.name ? `O melhor match com expert é ${expertMatch.name}${expert ? `: ${expert.expertName} reforça que ${expert.insight}` : '.'}` : '',
      value?.name ? `Se quiser equilibrar custo e experiência, ${value.name} é o melhor custo-benefício.` : '',
      bestPrice?.name ? `Para economizar, ${bestPrice.name} aparece como melhor preço sem transformar a escolha em uma decisão só de tarifa.` : '',
      family?.name ? `Para família/crianças, eu olharia com carinho para ${family.name}, priorizando menos deslocamento e mais previsibilidade.` : '',
      'Wallet/milhas: eu usaria a Wallet para capturar upgrade, café ou late checkout, e deixaria milhas para o trecho aéreo quando o valor por ponto compensar.',
      bookingUrl ? `Link de reserva: ${bookingUrl}` : '',
    ].filter(Boolean).join(' ');
  }
  if (toolNames.includes('buscarPasseios')) {
    const ranking = tools.buscarPasseios?.ranking?.recommendations;
    const overall = ranking?.bestOverall?.title || 'a opção mais equilibrada';
    const family = ranking?.bestFamily?.title || 'a melhor opção para família';
    const value = ranking?.bestValue?.title || 'o melhor custo-benefício';
    const memorable = ranking?.mostMemorable?.title || 'a experiência mais memorável';
    const light = ranking?.lightest?.title || 'o passeio mais leve';
    return `Ranqueei os passeios como consultoria. Melhor escolha geral: ${overall}. Melhor para família: ${family}. Melhor custo-benefício: ${value}. Mais memorável: ${memorable}. Mais leve: ${light}. Nem sempre o mais barato é o melhor: eu priorizaria baixa fricção, boa duração e memória real da viagem.`;
  }
  if (found) return found.text;
  if (toolNames.includes('gerarPDF')) return 'Preparei uma exportação de demonstração do roteiro. O próximo passo seria escolher o formato: resumo executivo, roteiro completo ou versão para compartilhar?';
  if (toolNames.includes('consultarWallet')) return 'Consultei uma carteira de demonstração. Para hotéis, eu priorizaria benefícios de estadia; para voos, milhas no trecho principal. Você quer otimizar por milhas ou benefícios?';
  if (toolNames.includes('criarRoteiro')) return 'Posso montar uma primeira versão do roteiro. Para acertar de primeira, me diga destino, datas aproximadas e ritmo: tranquilo, equilibrado ou intenso.';

  return 'Anotado. Para seguir bem, preciso de um detalhe: destino, datas, orçamento ou ritmo da viagem. Qual desses você já tem definido?';
}

function buildStructuredContext({ intent, latestMessage, tools }) {
  return {
    detectedIntent: intent,
    originalQuestion: latestMessage,
    toolResults: tools,
    responseRules: [
      'Responda apenas com os dados retornados em toolResults.',
      'Não responda com roteiro genérico quando detectedIntent for hotel.',
      'Para hotéis, cite hotéis presentes em toolResults.buscarHoteis.options.',
      'Para hotéis, explique melhor escolha geral e melhor custo-benefício usando toolResults.buscarHoteis.ranking.',
      'Inclua bookingUrl quando existir.',
      'Se não houver dados reais de hotéis, diga que não conseguiu consultar hotéis reais agora.',
      'Se toolResults tiver status mocked, diga apenas que os dados são demonstrativos.',
      'Para voos, cite opções presentes em toolResults.buscarVoos.options e explique custo-benefício, duração, escalas, família e milhas.',
      'Para roteiro em modo sem ferramenta, colete contexto antes de prometer um roteiro: destino, datas, viajantes, orçamento e estilo da viagem.',
      'Para mensagens genéricas, responda naturalmente e de forma curta.',
    ],
  };
}

function toOpenAIInput(messages, latestMessage, tools = {}, intent = 'geral') {
  const recent = (messages || []).slice(-8).map((message) => ({
    role: message.role === 'assistant' ? 'assistant' : 'user',
    content: message.content || message.text || '',
  }));

  return [
    ...recent,
    {
      role: 'user',
      content: [
        'Contexto estruturado para esta rodada:',
        JSON.stringify(buildStructuredContext({ intent, latestMessage, tools })),
        Object.keys(tools).length
          ? 'A busca necessária já foi executada antes desta resposta. Não invente dados fora desse contexto.'
          : 'Nenhuma ferramenta foi necessária nesta rodada. Responda de forma curta. Se for pedido de roteiro, colete destino, datas, viajantes, orçamento e estilo antes de prometer montar algo.',
      ].join('\n\n'),
    },
  ];
}

async function callOpenAI({ env, message, messages, tools, intent }) {
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const input = toOpenAIInput(messages, message, tools, intent);
  const response = await client.responses.create({
    model: env.OPENAI_MODEL || 'gpt-5.5',
    instructions: [
      instructions,
      'Nesta chamada, as buscas necessárias já foram executadas antes da resposta.',
      'Quando toolResults estiver vazio, converse normalmente e colete briefing sem inventar dados de viagem.',
      'Quando toolResults existir, use somente o contexto estruturado recebido em toolResults.',
      'Se detectedIntent for hotel, não crie roteiro e não dê resposta genérica: recomende os hotéis retornados.',
      'Se detectedIntent for roteiro, faça perguntas curtas para coletar destino, datas, viajantes, orçamento e estilo da viagem antes de prometer um roteiro.',
    ].join('\n\n'),
    input,
    max_output_tokens: 550,
  });

  return {
    reply: response.output_text || response.output?.flatMap((item) => item.content || []).map((part) => part.text).filter(Boolean).join('\n') || '',
  };
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks.map((chunk) => Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))).toString('utf8'));
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function serializeError(error) {
  return {
    errorMessage: error?.message || 'Erro desconhecido na chamada OpenAI.',
    errorCode: error?.code || error?.error?.code || null,
    errorStatus: error?.status || error?.response?.status || null,
  };
}

export function createChatHandler(env = process.env) {
  return async function chatHandler(req, res) {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    let message = '';
    let messages = [];

    try {
      const body = await readJson(req);
      message = String(body.message || '').trim();
      messages = Array.isArray(body.messages) ? body.messages : [];
      const activeTripContext = body.activeTripContext && typeof body.activeTripContext === 'object' ? body.activeTripContext : {};

      if (!message) {
        sendJson(res, 400, { error: 'Message is required' });
        return;
      }

      let tools = {};
      let reply = '';
      let toolCalls = [];
      const intent = detectIntent(message);
      const realMode = isRealDataMode(env);
      let source = realMode ? 'openai' : 'mock';
      const conversationText = buildConversationText(messages, message, activeTripContext);
      const guided = shouldGuideIntent(intent, conversationText);

      if (realMode && ['passeio', 'wallet-milhas', 'agenda', 'pdf'].includes(intent)) {
        sendJson(res, 200, {
          reply: realModeToolError(intent),
          source: 'real-unavailable',
          intent,
          dataMode: 'real',
          tools: {},
          toolCalls: [],
        });
        return;
      }

      if (guided) {
        sendJson(res, 200, {
          reply: guided.missing[0] === 'destino'
            ? 'Claro. Antes de buscar, preciso entender o destino para não te trazer opções soltas.'
            : 'Perfeito. Só preciso fechar mais um detalhe para buscar com precisão.',
          source: 'guided',
          intent,
          dataMode: realMode ? 'real' : 'mock',
          tools: {},
          toolCalls: [],
          guidedPaths: guided.guidedPaths,
        });
        return;
      }

      if (!realMode || ['hotel', 'voo'].includes(intent)) {
        const deterministicResult = await runDeterministicTools({ intent, env, message: conversationText });
        tools = deterministicResult.tools;
        toolCalls = deterministicResult.toolCalls;
      }

      if (intent === 'hotel' && isHotelToolFailure(tools.buscarHoteis)) {
        sendJson(res, 200, {
          reply: realMode ? realModeToolError(intent, tools.buscarHoteis) : fallbackReply(message, tools),
          source: 'tool-error',
          intent,
          dataMode: realMode ? 'real' : 'mock',
          tools,
          toolCalls,
        });
        return;
      }

      if (realMode && intent === 'voo' && isFlightToolFailure(tools.buscarVoos)) {
        sendJson(res, 200, {
          reply: realModeToolError(intent, tools.buscarVoos),
          source: 'tool-error',
          intent,
          dataMode: 'real',
          tools,
          toolCalls,
        });
        return;
      }

      if (realMode && ['agenda', 'pdf'].includes(intent)) {
        sendJson(res, 200, {
          reply: realModeToolError(intent),
          source: 'tool-error',
          intent,
          dataMode: 'real',
          tools,
          toolCalls,
        });
        return;
      }

      if (env.OPENAI_API_KEY) {
        const openAIResult = await callOpenAI({ env, message, messages, tools, intent });
        reply = openAIResult.reply;
        source = 'openai';
      }

      if (!reply) {
        tools = Object.keys(tools).length || realMode ? tools : await runMockTools(message, env);
        if (realMode) {
          reply = REAL_DATA_UNAVAILABLE_MESSAGE;
          source = 'real-unavailable';
        } else {
          reply = fallbackReply(message, tools);
        }
      }

      sendJson(res, 200, { reply, source, intent, dataMode: realMode ? 'real' : 'mock', tools, toolCalls, guidedPaths: null });
    } catch (error) {
      console.error('[/api/chat] OpenAI request failed', error);
      const debugError = serializeError(error);
      const realMode = isRealDataMode(env);
      const fallbackTools = message && !realMode ? await runMockTools(message, env).catch(() => ({})) : {};
      sendJson(res, 200, {
        reply: realMode ? REAL_DATA_UNAVAILABLE_MESSAGE : `Erro OpenAI: ${debugError.errorMessage}`,
        source: realMode ? 'real-error' : 'mock-error',
        dataMode: realMode ? 'real' : 'mock',
        ...debugError,
        tools: fallbackTools,
      });
    }
  };
}
