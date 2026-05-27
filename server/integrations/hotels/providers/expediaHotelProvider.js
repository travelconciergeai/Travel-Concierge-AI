export async function searchExpediaHotels({ env = process.env } = {}) {
  if (!env.EXPEDIA_API_KEY) {
    return {
      status: 'not-configured',
      provider: 'expedia',
      hotels: [],
      errorMessage: 'Hotel provider não configurado',
      reason: 'EXPEDIA_API_KEY ausente.',
    };
  }

  return {
    status: 'error',
    provider: 'expedia',
    hotels: [],
    errorMessage: 'Não foi possível consultar hotéis reais agora',
    reason: 'Adapter preparado. TODO: conectar Expedia Rapid API e mapear resposta para hotelNormalizer.',
  };
}
