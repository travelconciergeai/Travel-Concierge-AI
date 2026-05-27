import { createCalendarEvent } from '../src/integrations/calendar/calendarService.js';
import { createPdfExport } from '../src/services/pdf/pdfExportService.js';

const wait = (value) => Promise.resolve(value);

export const agentTools = {
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

  buscarVoos: async () => wait({
    status: 'mocked',
    action: 'buscarVoos',
    options: [
      { airline: 'TAP', route: 'GRU-LIS', cabin: 'Executiva', miles: '78.000 + R$ 240' },
      { airline: 'LATAM', route: 'GRU-MAD-LIS', cabin: 'Executiva', price: 'R$ 8.920' },
    ],
  }),

  buscarHoteis: async () => wait({
    status: 'mocked',
    action: 'buscarHoteis',
    options: [
      { name: 'Memmo Alfama', city: 'Lisboa', note: 'melhor localização para primeira vez' },
      { name: 'Torel Avantgarde', city: 'Porto', note: 'vista e design editorial' },
    ],
  }),

  buscarPasseios: async () => wait({
    status: 'mocked',
    action: 'buscarPasseios',
    options: [
      { title: 'Walking tour em Alfama', duration: '3h' },
      { title: 'Degustação privada no Douro', duration: 'meio dia' },
    ],
  }),

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

export function selectMockTools(message = '') {
  const text = message.toLowerCase();
  const tools = [];

  if (text.includes('criar') || text.includes('novo roteiro') || text.includes('montar')) tools.push('criarRoteiro');
  if (text.includes('editar') || text.includes('trocar') || text.includes('ajust') || text.includes('barato') || text.includes('econom')) tools.push('editarRoteiro');
  if (text.includes('wallet') || text.includes('cartão') || text.includes('cartao')) tools.push('consultarWallet');
  if (text.includes('milha') || text.includes('pontos')) tools.push('sugerirMilhas');
  if (text.includes('agenda') || text.includes('calendário') || text.includes('calendario')) tools.push('adicionarAgenda');
  if (text.includes('voo') || text.includes('voos') || text.includes('passagem')) tools.push('buscarVoos');
  if (text.includes('hotel') || text.includes('hoteis') || text.includes('hotéis')) tools.push('buscarHoteis');
  if (text.includes('passeio') || text.includes('tour') || text.includes('experiência') || text.includes('experiencia')) tools.push('buscarPasseios');
  if (text.includes('pdf') || text.includes('exportar')) tools.push('gerarPDF');

  return [...new Set(tools)];
}

export async function runMockTools(message) {
  const names = selectMockTools(message);
  const entries = await Promise.all(names.map(async (name) => [name, await agentTools[name]({})]));
  return Object.fromEntries(entries);
}
