export async function searchLatamFlights({ env = process.env } = {}) {
  if (!env.LATAM_API_KEY) {
    return {
      status: 'not-configured',
      provider: 'latam',
      flights: [],
      reason: 'LATAM_API_KEY ausente.',
    };
  }

  return {
    status: 'not-implemented',
    provider: 'latam',
    flights: [],
    reason: 'Adapter preparado. TODO: conectar API/parceiro LATAM e mapear resposta para flightNormalizer.',
  };
}
