const hasAny = (text, words) => words.some((word) => text.includes(word));

const intentRules = [
  {
    id: 'lighter',
    match: (text) => hasAny(text, ['mais leve', 'leve', 'menos corrido', 'menos intenso', 'devagar', 'calmo', 'tranquilo']),
  },
  {
    id: 'shopping',
    match: (text) => hasAny(text, ['compras', 'shopping', 'outlet', 'loja', 'lojas']),
  },
  {
    id: 'restaurant',
    match: (text) => hasAny(text, ['troque restaurante', 'trocar restaurante', 'troque o restaurante', 'mudar restaurante', 'jantar', 'almoço']),
  },
  {
    id: 'rest',
    match: (text) => hasAny(text, ['descanso', 'pausa', 'spa', 'relaxar', 'livre']),
  },
  {
    id: 'budget',
    match: (text) => hasAny(text, ['economizar', 'barato', 'econômico', 'economico', 'reduzir custo', 'orçamento menor']),
  },
  {
    id: 'miles',
    match: (text) => hasAny(text, ['milhas', 'miles', 'pontos', 'usar milhas']),
  },
  {
    id: 'blackCard',
    match: (text) => hasAny(text, ['cartão black', 'cartao black', 'black', 'visa infinite', 'mastercard black']),
  },
];

export const detectPlanIntents = (text = '') => {
  const normalized = text.toLowerCase();
  return intentRules.filter((rule) => rule.match(normalized)).map((rule) => rule.id);
};
