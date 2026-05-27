export async function searchDuffelFlights({ env = process.env } = {}) {
  if (!env.DUFFEL_API_KEY) {
    return {
      status: 'not-configured',
      provider: 'duffel',
      flights: [],
      reason: 'DUFFEL_API_KEY ausente.',
    };
  }

  return {
    status: 'not-implemented',
    provider: 'duffel',
    flights: [],
    reason: 'Adapter preparado. TODO: conectar Duffel Offers API e mapear resposta para flightNormalizer.',
  };
}
