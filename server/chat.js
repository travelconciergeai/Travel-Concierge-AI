import OpenAI from 'openai';
import { createAgentTools, runMockTools } from './tools.js';
import { VOYA_AGENT_SYSTEM_PROMPT } from './agentPrompt.js';

const FALLBACK_REPLIES = [
  {
    match: ['barato', 'econom', 'preço', 'preco'],
    text: 'Usei dados mockados para simular uma revisão de custo. Eu reduziria uma diária premium, manteria o ponto alto do Douro e compararia voos com milhas antes de mexer nas experiências. Qual é o teto de orçamento que você quer respeitar?',
  },
  {
    match: ['criança', 'filho', 'família', 'familia'],
    text: 'Perfeito. Eu ajustaria o ritmo para família: menos deslocamentos, pausas reais e experiências mais curtas no fim do dia. Qual a idade das crianças?',
  },
  {
    match: ['milha', 'pontos'],
    text: 'Pelo cenário mockado, eu começaria comparando milhas no trecho internacional e dinheiro nos trechos curtos. A economia tende a aparecer melhor no GRU-LIS. Você quer priorizar menor custo ou menor tempo de voo?',
  },
  {
    match: ['voo', 'passagem'],
    text: 'Tenho uma comparação mockada: TAP direto com milhas ou LATAM com conexão. Para uma viagem premium, eu priorizaria menor tempo total e taxa baixa. Suas datas são flexíveis?',
  },
  {
    match: ['hotel', 'hoteis', 'hotéis'],
    text: 'Usei hotéis mockados como referência. Eu manteria uma base muito bem localizada em Lisboa e algo com vista no Porto, para reduzir deslocamento. Você prefere boutique discreto ou luxo mais completo?',
  },
];

const instructions = VOYA_AGENT_SYSTEM_PROMPT;

const OPENAI_AGENT_TOOLS = [
  {
    type: 'function',
    name: 'hotelSearch',
    description: 'Busca hotéis pelo hotelSearchEngine da Voya, usando provider real quando configurado, ranking consultivo e expert matching.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        message: {
          type: 'string',
          description: 'Mensagem original do usuário com destino, perfil, orçamento e preferências.',
        },
      },
      required: ['message'],
    },
  },
  {
    type: 'function',
    name: 'flightSearch',
    description: 'Busca e ranqueia voos com foco em preço, duração, família, milhas, Wallet e risco de conexão.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        message: {
          type: 'string',
          description: 'Mensagem original do usuário com origem, destino, datas e perfil.',
        },
      },
      required: ['message'],
    },
  },
  {
    type: 'function',
    name: 'criarRoteiro',
    description: 'Cria uma proposta inicial de roteiro quando o usuário pedir para montar uma viagem ou roteiro.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        message: {
          type: 'string',
          description: 'Mensagem original do usuário com destino, duração e perfil.',
        },
      },
      required: ['message'],
    },
  },
  {
    type: 'function',
    name: 'editarRoteiro',
    description: 'Ajusta um roteiro existente quando o usuário pedir alteração de ritmo, orçamento, descanso ou estilo.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        message: {
          type: 'string',
          description: 'Mensagem original do usuário com o ajuste desejado.',
        },
      },
      required: ['message'],
    },
  },
];

function isHotelSearchIntent(message = '') {
  return /hotel|hot[eé]is|hoteis|hospedagem|pousada|resort|di[aá]ria|booking/i.test(message);
}

function isFlightSearchIntent(message = '') {
  return /voo|voos|passagem|passagens|a[eé]reo|a[eé]rea/i.test(message);
}

function getOpenAIToolChoice(message = '') {
  if (isHotelSearchIntent(message)) return { type: 'function', name: 'hotelSearch' };
  if (isFlightSearchIntent(message)) return { type: 'function', name: 'flightSearch' };
  return 'auto';
}

function parseToolArguments(call, message) {
  try {
    return JSON.parse(call.arguments || '{}');
  } catch {
    return { message };
  }
}

async function executeOpenAIToolCall(call, env, message) {
  const agentTools = createAgentTools(env);
  const args = { message, ...parseToolArguments(call, message) };

  if (call.name === 'hotelSearch') {
    return ['buscarHoteis', await agentTools.buscarHoteis(args)];
  }
  if (call.name === 'flightSearch') {
    return ['buscarVoos', await agentTools.buscarVoos(args)];
  }
  if (call.name === 'criarRoteiro') {
    return ['criarRoteiro', await agentTools.criarRoteiro(args)];
  }
  if (call.name === 'editarRoteiro') {
    return ['editarRoteiro', await agentTools.editarRoteiro(args)];
  }

  return [call.name, { status: 'error', errorMessage: `Tool desconhecida: ${call.name}` }];
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
      'Usei dados mockados e montei uma recomendação estratégica da viagem.',
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
    const statusText = flightTool.status === 'mocked' ? 'Os dados ainda são mockados.' : '';
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
      return 'Hotel provider não configurado. Para buscar hotéis reais, preencha HOTEL_PROVIDER, HOTEL_API_KEY e HOTEL_API_BASE_URL.';
    }
    if (hotelTool.status === 'error') {
      return 'Não foi possível consultar hotéis reais agora. Não vou inventar hotéis: tente novamente em alguns minutos ou revise a configuração do provider.';
    }

    const ranking = hotelTool.ranking?.recommendations || {};
    const overall = ranking.bestOverall;
    const expertMatch = ranking.bestExpertMatch;
    const value = ranking.bestValue;
    const bestPrice = ranking.bestPrice;
    const family = ranking.bestFamily;
    const statusText = hotelTool.status === 'mocked' ? 'Os dados ainda são mockados.' : '';
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
    return `Usei passeios mockados e ranqueei como consultoria. Melhor escolha geral: ${overall}. Melhor para família: ${family}. Melhor custo-benefício: ${value}. Mais memorável: ${memorable}. Mais leve: ${light}. Nem sempre o mais barato é o melhor: eu priorizaria baixa fricção, boa duração e memória real da viagem.`;
  }
  if (found) return found.text;
  if (toolNames.includes('gerarPDF')) return 'Preparei uma exportação mockada do roteiro. O próximo passo seria escolher o formato: resumo executivo, roteiro completo ou versão para compartilhar?';
  if (toolNames.includes('consultarWallet')) return 'Consultei a wallet mockada. Voya Signature parece melhor para hotéis; TAP Miles & Go faz mais sentido para voos Star Alliance. Você quer otimizar por milhas ou benefícios?';
  if (toolNames.includes('criarRoteiro')) return 'Posso montar uma primeira versão mockada do roteiro. Para acertar de primeira, me diga destino, datas aproximadas e ritmo: tranquilo, equilibrado ou intenso.';

  return 'Anotado. Para seguir bem, preciso de um detalhe: destino, datas, orçamento ou ritmo da viagem. Qual desses você já tem definido?';
}

function toOpenAIInput(messages, latestMessage, tools = {}) {
  const recent = (messages || []).slice(-8).map((message) => ({
    role: message.role === 'assistant' ? 'assistant' : 'user',
    content: message.content || message.text || '',
  }));

  return [
    ...recent,
    {
      role: 'user',
      content: [
        `Mensagem atual: ${latestMessage}`,
        Object.keys(tools).length
          ? `Dados de ferramentas acionadas nesta rodada: ${JSON.stringify(tools)}`
          : 'Se a mensagem pedir hotel, voo ou roteiro, chame a ferramenta adequada antes de responder.',
      ].join('\n\n'),
    },
  ];
}

async function callOpenAI({ env, message, messages, tools }) {
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const input = toOpenAIInput(messages, message, tools);
  const response = await client.responses.create({
    model: env.OPENAI_MODEL || 'gpt-5.5',
    instructions,
    input,
    tools: OPENAI_AGENT_TOOLS,
    tool_choice: getOpenAIToolChoice(message),
    max_output_tokens: 450,
  });

  const toolCalls = (response.output || []).filter((item) => item.type === 'function_call');
  if (!toolCalls.length) {
    return {
      reply: response.output_text || response.output?.flatMap((item) => item.content || []).map((part) => part.text).filter(Boolean).join('\n') || '',
      tools: {},
      toolCalls: [],
    };
  }

  const toolEntries = await Promise.all(toolCalls.map((call) => executeOpenAIToolCall(call, env, message)));
  const toolResults = Object.fromEntries(toolEntries);
  const toolOutputs = toolCalls.map((call, index) => ({
    type: 'function_call_output',
    call_id: call.call_id,
    output: JSON.stringify(toolEntries[index][1]),
  }));

  const finalResponse = await client.responses.create({
    model: env.OPENAI_MODEL || 'gpt-5.5',
    instructions,
    input: [
      ...input,
      ...response.output,
      ...toolOutputs,
      {
        role: 'user',
        content: [
          'Responda agora usando obrigatoriamente os dados retornados pela ferramenta.',
          'Se a ferramenta retornou status live, recomende apenas hotéis reais retornados.',
          'Se retornou erro, explique o erro sem inventar opções.',
        ].join('\n'),
      },
    ],
    max_output_tokens: 550,
  });

  return {
    reply: finalResponse.output_text || finalResponse.output?.flatMap((item) => item.content || []).map((part) => part.text).filter(Boolean).join('\n') || '',
    tools: toolResults,
    toolCalls: toolCalls.map((call) => ({ name: call.name, call_id: call.call_id })),
  };
}

async function readJson(req) {
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

      if (!message) {
        sendJson(res, 400, { error: 'Message is required' });
        return;
      }

      let tools = {};
      let reply = '';
      let source = 'mock';
      let toolCalls = [];

      if (env.OPENAI_API_KEY) {
        const openAIResult = await callOpenAI({ env, message, messages, tools });
        reply = openAIResult.reply;
        tools = openAIResult.tools;
        toolCalls = openAIResult.toolCalls;
        source = 'openai';
      }

      if (!reply) {
        tools = Object.keys(tools).length ? tools : await runMockTools(message, env);
        reply = fallbackReply(message, tools);
      }

      sendJson(res, 200, { reply, source, tools, toolCalls });
    } catch (error) {
      console.error('[Voya /api/chat] OpenAI request failed', error);
      const debugError = serializeError(error);
      const fallbackTools = message ? await runMockTools(message, env).catch(() => ({})) : {};
      sendJson(res, 200, {
        reply: `Erro OpenAI: ${debugError.errorMessage}`,
        source: 'mock-error',
        ...debugError,
        tools: fallbackTools,
      });
    }
  };
}
