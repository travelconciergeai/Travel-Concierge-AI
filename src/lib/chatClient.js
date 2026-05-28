import { isRealDataMode } from './dataMode.js';

const clientFallback = (message) => {
  if (isRealDataMode()) {
    return 'Não consegui consultar dados reais agora. Em modo real, a Voya não usa respostas mockadas.';
  }

  const text = message.toLowerCase();
  if (text.includes('milha')) return 'Sem chave de IA configurada, usei o modo mockado: vale comparar TAP Miles&Go para o trecho internacional e dinheiro nos trechos curtos.';
  if (text.includes('hotel')) return 'Sem chave de IA configurada, usei o modo mockado: manteria hotéis bem localizados para reduzir deslocamentos e preservar conforto.';
  if (text.includes('voo')) return 'Sem chave de IA configurada, usei o modo mockado: compararia voo direto com milhas contra uma opção paga com conexão curta.';
  return 'Sem chave de IA configurada, respondi no modo mockado. Posso ajudar com roteiro, wallet, milhas, voos, hotéis, passeios, agenda ou PDF.';
};

export async function sendChatMessage({ message, messages = [] }) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, messages }),
    });

    if (!response.ok) throw new Error(`Chat request failed: ${response.status}`);
    const data = await response.json();
    return {
      reply: data.reply || clientFallback(message),
      source: data.source || 'unknown',
      tools: data.tools || {},
      toolCalls: data.toolCalls || [],
    };
  } catch (error) {
    return {
      reply: clientFallback(message),
      source: 'client-fallback',
      tools: {},
      error: error.message,
    };
  }
}
