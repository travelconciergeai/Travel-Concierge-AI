import { detectPlanIntents } from '../agents/planIntentAgent.js';
import { clonePlanState, uniqueInsights } from '../lib/planState.js';

export const applyPlanAgentUpdate = ({ text, days, trip, insights }) => {
  const intents = detectPlanIntents(text);
  if (!intents.length) return null;

  let nextDays = clonePlanState(days);
  let nextTrip = { ...trip };
  let nextInsights = [...insights];
  const notes = [];

  if (intents.includes('lighter')) {
    nextDays = nextDays.map((day) => ({
      ...day,
      items: day.items.map((item, idx) => idx === day.items.length - 1
        ? { ...item, dur: item.dur === '3 h' ? '2 h' : item.dur, vibe: 'leve', conf: false }
        : item),
    }));
    nextTrip = { ...nextTrip, blurb: 'Versão mais leve: menos deslocamentos, pausas reais e ritmo premium sem pressa.' };
    nextInsights.unshift({ kind: 'tip', text: 'Ritmo ajustado em modo mockado: noites menos carregadas e mais respiro entre blocos.' });
    notes.push('deixei o ritmo mais leve');
  }

  if (intents.includes('shopping')) {
    nextDays = nextDays.map((day, idx) => idx === 3
      ? {
          ...day,
          items: [
            ...day.items,
            { t: 'tarde', title: 'Compras no Vila do Conde Fashion Outlet', place: 'Porto', dur: '2 h 30', tag: 'experiência', vibe: 'compras', conf: false },
          ],
        }
      : day);
    nextInsights.unshift({ kind: 'tip', text: 'Incluí um bloco mockado de compras no Porto, sem remover reservas confirmadas.' });
    notes.push('adicionei compras');
  }

  if (intents.includes('restaurant')) {
    nextDays = nextDays.map((day) => ({
      ...day,
      items: day.items.map((item) => item.tag === 'comida' && item.title.includes('Avillez')
        ? { ...item, title: 'Jantar na Tasca em Alfama', place: 'Alfama', dur: '1 h 30', vibe: 'local', conf: false }
        : item),
    }));
    nextInsights.unshift({ kind: 'tip', text: 'Troquei o restaurante em modo mockado para uma opção mais local e menos formal.' });
    notes.push('troquei o restaurante');
  }

  if (intents.includes('rest')) {
    nextDays = nextDays.map((day, idx) => idx === 1
      ? {
          ...day,
          items: [
            ...day.items,
            { t: 'tarde', title: 'Pausa no hotel · descanso sem agenda', place: 'Lisboa', dur: '1 h 30', tag: 'hotel', vibe: 'descanso', conf: false },
          ],
        }
      : day);
    nextInsights.unshift({ kind: 'tip', text: 'Adicionei uma pausa mockada para descanso, preservando os pontos principais do dia.' });
    notes.push('incluí descanso');
  }

  if (intents.includes('budget')) {
    nextTrip = { ...nextTrip, budget: 'R$ 21–24k', blurb: 'Versão econômica inteligente: conforto preservado, menos excessos e melhor uso de milhas.' };
    nextInsights.unshift({ kind: 'benefit', text: 'Orçamento mockado revisado para R$ 21–24k com troca de uma refeição autoral por opção local.' });
    notes.push('atualizei orçamento/estilo');
  }

  if (intents.includes('miles')) {
    nextInsights.unshift({ kind: 'miles', text: 'Estratégia mockada: emitir GRU→LIS com 78.000 milhas TAP + taxas e pagar trechos curtos em dinheiro.' });
    notes.push('destaquei estratégia de milhas');
  }

  if (intents.includes('blackCard')) {
    nextInsights.unshift({ kind: 'benefit', text: 'Wallet mockada: cartão Black priorizado para seguro viagem, sala VIP e proteção de bagagem.' });
    notes.push('mostrei benefícios da Wallet');
  }

  return {
    days: nextDays,
    trip: nextTrip,
    insights: uniqueInsights(nextInsights).slice(0, 3),
    notes,
  };
};
