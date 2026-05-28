export const travelPrinciples = {
  familia: [
    'Reduzir deslocamentos e evitar trocas de base desnecessárias.',
    'Proteger horários bons de sono, refeições e chegada.',
    'Inserir pausas reais entre dias intensos.',
    'Priorizar conforto, previsibilidade e logística simples.',
  ],
  casal: [
    'Valorizar hotéis boutique, localização caminhável e atmosfera.',
    'Equilibrar privacidade, gastronomia e experiências memoráveis.',
    'Evitar agenda excessivamente preenchida.',
  ],
  disney: [
    'Priorizar proximidade, descanso e dias de respiro.',
    'Com criança pequena, evitar dois dias muito intensos seguidos.',
    'A logística vale tanto quanto o ingresso: transporte, horários e pausas mudam a viagem.',
  ],
  europa: [
    'Escolher bairros com boa base para caminhar e acessar transporte.',
    'Organizar cultura, gastronomia e deslocamentos por região do dia.',
    'Preservar ritmo: menos checklists, mais tempo bem usado.',
  ],
  orcamento: [
    'Buscar custo-benefício sem sacrificar segurança, conforto básico ou logística.',
    'Economia que cria cansaço pode piorar a viagem.',
    'Ajustar hotel ou experiências antes de aceitar voos muito ruins para família.',
  ],
};

export function formatTravelPrinciplesForPrompt() {
  return Object.entries(travelPrinciples)
    .map(([category, items]) => `${category}:\n${items.map((item) => `- ${item}`).join('\n')}`)
    .join('\n\n');
}
