export const planChatFallbackReply = (text) => {
  const normalized = text.toLowerCase();
  if (normalized.includes('barato') || normalized.includes('econom')) return 'Posso revisar pra Memmo Príncipe Real (-R$ 1.100) e trocar o jantar do Avillez por uma tasca em Alfama. Mantenho o Six Senses no Douro. Topa?';
  if (normalized.includes('criança') || normalized.includes('filho') || normalized.includes('família')) return 'Posso adicionar uma criança ao roteiro. Ajusto Sintra para meio período, troco fado por aquário de Lisboa e reservo quarto twin no Memmo. Aplicar?';
  if (normalized.includes('milhas') || normalized.includes('miles')) return 'Olha só: dá pra emitir GRU→LIS com 78.000 milhas TAP + R$ 240 de taxa. Economia de R$ 4.580 vs. pago. Aplicar essa estratégia?';
  return 'Anotado. Já refleti isso no roteiro à direita — qualquer ajuste fino, é só pedir.';
};
