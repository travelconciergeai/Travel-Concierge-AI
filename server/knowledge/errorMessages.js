export const userFacingErrorMessages = {
  hotelSearchFailed: 'Não consegui acessar hotéis reais agora. Prefiro não te mostrar opções imprecisas. Tenta novamente daqui a pouquinho.',
  flightSearchFailed: 'Não consegui acessar voos reais agora. Prefiro não te mostrar opções imprecisas. Tenta novamente daqui a pouquinho.',
  realDataUnavailable: 'Não consegui acessar dados reais agora. Prefiro não te mostrar informações imprecisas. Tenta novamente daqui a pouquinho.',
  providerUnavailable: 'A consulta real não está disponível neste momento. Prefiro pausar aqui a te mostrar algo pouco confiável.',
  insufficientInformation: 'Para te orientar bem, preciso de alguns detalhes antes: destino, datas, viajantes, orçamento e estilo da viagem.',
};

export function formatErrorMessagesForPrompt() {
  return Object.entries(userFacingErrorMessages)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');
}
