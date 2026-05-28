import { createCalendarEvent } from '../src/integrations/calendar/calendarService.js';
import { createPdfExport } from '../src/services/pdf/pdfExportService.js';
import { postTravelEndpoint } from './travel.js';
import { rankHotelOptions } from './services/hotelRecommendationService.js';
import { rankFlightOptions } from './services/flightRecommendationService.js';
import { rankTourOptions } from './services/tourRecommendationService.js';
import { orchestrateTripRecommendation } from './services/tripRecommendationOrchestrator.js';

const wait = (value) => Promise.resolve(value);

const destinationAliases = {
  lisboa: { flight: 'LIS', city: 'Lisboa' },
  lisbon: { flight: 'LIS', city: 'Lisboa' },
  paris: { flight: 'CDG', city: 'Paris' },
  orlando: { flight: 'MCO', city: 'Orlando' },
  porto: { flight: 'OPO', city: 'Porto' },
};

function inferDestination(message = '') {
  const text = message.toLowerCase();
  const key = Object.keys(destinationAliases).find((name) => text.includes(name));
  return destinationAliases[key] || destinationAliases.lisboa;
}

export function createAgentTools(env = process.env) {
  return {
  criarRoteiro: async ({ destino = 'Lisboa & Porto', dias = 10 } = {}) => wait({
    status: 'mocked',
    action: 'criarRoteiro',
    title: `${destino} em ${dias} dias`,
    summary: 'Roteiro base criado com hotéis boutique, deslocamentos e experiências editoriais.',
  }),

  editarRoteiro: async ({ ajuste = 'otimizar agenda' } = {}) => wait({
    status: 'mocked',
    action: 'editarRoteiro',
    summary: `Ajuste simulado aplicado: ${ajuste}.`,
  }),

  consultarWallet: async () => wait({
    status: 'mocked',
    action: 'consultarWallet',
    cards: ['Voya Signature', 'TAP Miles & Go Infinite', 'Latam Pass Black'],
    recommendation: 'Use Voya Signature para hotéis e TAP Miles & Go para voos Star Alliance.',
  }),

  sugerirMilhas: async ({ programa = 'TAP Miles&Go' } = {}) => wait({
    status: 'mocked',
    action: 'sugerirMilhas',
    programa,
    summary: 'Melhor cenário simulado: emitir GRU-LIS com milhas e pagar taxas em dinheiro.',
    estimatedSavings: 'R$ 4.580',
  }),

  adicionarAgenda: async ({ item = 'Reserva sugerida pela Voya' } = {}) => {
    const event = await createCalendarEvent({
      provider: 'google',
      event: {
        title: item,
        location: 'Lisboa',
        notes: 'Evento mockado criado pela tool adicionarAgenda.',
      },
    });

    return {
      status: 'mocked',
      action: 'adicionarAgenda',
      item,
      summary: 'Item preparado para adicionar à agenda.',
      event,
    };
  },

  buscarVoos: async ({ message = '' } = {}) => {
    const family = /fam[ií]lia|crian[cç]a|filho|filha/i.test(message);
    const result = await postTravelEndpoint('/api/travel/flights', {
      destination: inferDestination(message).flight,
      family,
      children: family,
      cabin: /econ[oô]mica|barato|econom/i.test(message) ? 'economy' : 'executiva',
    }, env);
    return {
      action: 'buscarVoos',
      ...result,
      ranking: result.ranking || rankFlightOptions(result.options, {
        family: /fam[ií]lia|crian[cç]a|filho/i.test(message),
      }),
    };
  },

  buscarHoteis: async ({ message = '' } = {}) => {
    const family = /fam[ií]lia|crian[cç]a|filho|filha/i.test(message);
    const budget = /econom|barato|or[cç]amento/i.test(message) ? 'orçamento controlado' : 'premium consciente';
    const result = await postTravelEndpoint('/api/travel/hotels', {
      destination: inferDestination(message).city,
      children: family,
      family,
      budget,
      interests: ['hospedagem', 'logística', 'wallet', 'milhas'],
    }, env);
    return {
      action: 'buscarHoteis',
      ...result,
      ranking: result.ranking || (result.options?.length ? rankHotelOptions(result.options, {
        style: 'boutique premium',
        budgetCap: budget === 'orçamento controlado' ? 1300 : 1800,
      }) : null),
    };
  },

  buscarPasseios: async ({ message = '' } = {}) => {
    const result = await postTravelEndpoint('/api/travel/tours', { destination: inferDestination(message).city }, env);
    return {
      action: 'buscarPasseios',
      ...result,
      ranking: rankTourOptions(result.options, {
        family: /fam[ií]lia|crian[cç]a|filho/i.test(message),
        style: 'cultura e gastronomia',
      }),
    };
  },

  recomendarViagem: async ({ message = '' } = {}) => {
    const destination = inferDestination(message);
    const family = /fam[ií]lia|crian[cç]a|filho|filha/i.test(message);
    const rhythm = /leve|tranquilo|descanso|calmo/i.test(message) ? 'leve' : 'equilibrado';
    const budget = /econom|barato|or[cç]amento/i.test(message) ? 'econômico controlado' : 'premium consciente';

    const [flightResult, hotelResult, tourResult] = await Promise.all([
      postTravelEndpoint('/api/travel/flights', { destination: destination.flight }, env),
      postTravelEndpoint('/api/travel/hotels', { destination: destination.city }, env),
      postTravelEndpoint('/api/travel/tours', { destination: destination.city }, env),
    ]);

    const flights = {
      action: 'buscarVoos',
      ...flightResult,
      ranking: rankFlightOptions(flightResult.options, { family }),
    };
    const hotels = {
      action: 'buscarHoteis',
      ...hotelResult,
      ranking: rankHotelOptions(hotelResult.options, {
        style: 'boutique premium',
        budgetCap: budget === 'econômico controlado' ? 1400 : 1800,
      }),
    };
    const tours = {
      action: 'buscarPasseios',
      ...tourResult,
      ranking: rankTourOptions(tourResult.options, {
        family,
        style: 'cultura e gastronomia',
      }),
    };
    const wallet = {
      status: 'mocked',
      cards: ['Voya Signature', 'TAP Miles & Go Infinite', 'Latam Pass Black'],
      recommendation: 'Use Voya Signature para benefícios de hotel e TAP Miles & Go para comparar emissão no trecho internacional.',
    };
    const miles = {
      status: 'mocked',
      summary: 'Melhor cenário simulado: testar emissão do voo principal com milhas e pagar experiências em dinheiro.',
    };

    return orchestrateTripRecommendation({
      flights,
      hotels,
      tours,
      wallet,
      miles,
      budget,
      rhythm,
      profile: { family, style: 'curadoria premium com baixa fricção' },
      message,
      env,
    });
  },

  gerarPDF: async () => {
    const exportResult = await createPdfExport({
      trip: {
        title: 'Portugal — Lisboa & Porto',
        dates: '12–22 outubro',
        travelers: 2,
        budget: 'R$ 24–28k',
        blurb: 'Capitais, vinho do Douro, jantar com vista no Tejo.',
      },
      days: [],
      agenda: [],
      wallet: { cards: ['Voya Signature', 'TAP Miles & Go Infinite'] },
      miles: { strategy: 'Comparar emissão TAP com pagamento em dinheiro nos trechos curtos.' },
      expertInsights: ['Reserva no Mesa de Frades sai 30 dias antes.'],
    });

    return {
      status: 'mocked',
      action: 'gerarPDF',
      summary: 'PDF mockado preparado para exportação futura.',
      url: exportResult.share.url,
      export: exportResult,
    };
  },
  };
}

export const agentTools = createAgentTools();

export function selectMockTools(message = '') {
  const text = message.toLowerCase();
  const tools = [];

  if (text.includes('criar') || text.includes('novo roteiro') || text.includes('montar')) tools.push('criarRoteiro');
  if (text.includes('editar') || text.includes('trocar') || text.includes('ajust') || text.includes('barato') || text.includes('econom')) tools.push('editarRoteiro');
  if (text.includes('decidir') || text.includes('recomenda') || text.includes('recomendação') || text.includes('recomendacao') || text.includes('melhor combinação') || text.includes('melhor combinacao') || text.includes('combinar') || text.includes('pacote')) tools.push('recomendarViagem');
  if (text.includes('wallet') || text.includes('cartão') || text.includes('cartao')) tools.push('consultarWallet');
  if (text.includes('milha') || text.includes('pontos')) tools.push('sugerirMilhas');
  if (text.includes('agenda') || text.includes('calendário') || text.includes('calendario')) tools.push('adicionarAgenda');
  if (text.includes('voo') || text.includes('voos') || text.includes('passagem')) tools.push('buscarVoos');
  if (text.includes('hotel') || text.includes('hoteis') || text.includes('hotéis')) tools.push('buscarHoteis');
  if (text.includes('passeio') || text.includes('tour') || text.includes('experiência') || text.includes('experiencia')) tools.push('buscarPasseios');
  if (text.includes('pdf') || text.includes('exportar')) tools.push('gerarPDF');

  return [...new Set(tools)];
}

export async function runMockTools(message, env = process.env) {
  const names = selectMockTools(message);
  const tools = createAgentTools(env);
  const entries = await Promise.all(names.map(async (name) => [name, await tools[name]({ message })]));
  return Object.fromEntries(entries);
}
