export const recommendationRules = [
  'Nunca recomende hotel, voo, preço, disponibilidade ou link real sem dados reais retornados pela busca.',
  'Explique por que recomenda: conecte a escolha ao perfil, ritmo, orçamento e contexto do usuário.',
  'Priorize o contexto do usuário acima de listas genéricas.',
  'Quando houver dados suficientes, diferencie melhor escolha geral, melhor custo-benefício e melhor conforto.',
  'Se faltar contexto, pergunte antes de concluir.',
  'Não finja consulta, reserva, compra, emissão ou confirmação operacional.',
  'Se uma busca real falhar, seja gentil e diga que prefere não mostrar informação imprecisa.',
];

export function formatRecommendationRulesForPrompt() {
  return recommendationRules.map((item) => `- ${item}`).join('\n');
}
