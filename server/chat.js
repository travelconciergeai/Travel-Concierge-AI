import OpenAI from 'openai';
import { runMockTools } from './tools.js';
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

function fallbackReply(message, tools) {
  const text = message.toLowerCase();
  const found = FALLBACK_REPLIES.find((item) => item.match.some((word) => text.includes(word)));
  const toolNames = Object.keys(tools || {});

  if (found) return found.text;
  if (toolNames.includes('gerarPDF')) return 'Preparei uma exportação mockada do roteiro. O próximo passo seria escolher o formato: resumo executivo, roteiro completo ou versão para compartilhar?';
  if (toolNames.includes('consultarWallet')) return 'Consultei a wallet mockada. Voya Signature parece melhor para hotéis; TAP Miles & Go faz mais sentido para voos Star Alliance. Você quer otimizar por milhas ou benefícios?';
  if (toolNames.includes('criarRoteiro')) return 'Posso montar uma primeira versão mockada do roteiro. Para acertar de primeira, me diga destino, datas aproximadas e ritmo: tranquilo, equilibrado ou intenso.';

  return 'Anotado. Para seguir bem, preciso de um detalhe: destino, datas, orçamento ou ritmo da viagem. Qual desses você já tem definido?';
}

function toOpenAIInput(messages, latestMessage, tools) {
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
        `Dados mockados de ferramentas acionadas nesta rodada: ${JSON.stringify(tools)}`,
      ].join('\n\n'),
    },
  ];
}

async function callOpenAI({ env, message, messages, tools }) {
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: env.OPENAI_MODEL || 'gpt-5.5',
    instructions,
    input: toOpenAIInput(messages, message, tools),
    max_output_tokens: 450,
  });

  return response.output_text || response.output?.flatMap((item) => item.content || []).map((part) => part.text).filter(Boolean).join('\n') || '';
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

export function createChatHandler(env = process.env) {
  return async function chatHandler(req, res) {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    try {
      const body = await readJson(req);
      const message = String(body.message || '').trim();
      const messages = Array.isArray(body.messages) ? body.messages : [];

      if (!message) {
        sendJson(res, 400, { error: 'Message is required' });
        return;
      }

      const tools = await runMockTools(message);
      let reply = '';
      let source = 'mock';

      if (env.OPENAI_API_KEY) {
        reply = await callOpenAI({ env, message, messages, tools });
        source = 'openai';
      }

      if (!reply) {
        reply = fallbackReply(message, tools);
      }

      sendJson(res, 200, { reply, source, tools });
    } catch (error) {
      sendJson(res, 200, {
        reply: 'Tive uma falha ao consultar a IA agora, então usei o modo mockado. Posso seguir com sugestões de roteiro, milhas, wallet, voos, hotéis, passeios, agenda ou PDF.',
        source: 'mock-error',
        error: error.message,
        tools: {},
      });
    }
  };
}
