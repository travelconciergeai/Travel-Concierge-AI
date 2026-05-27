export async function searchAmadeusFlights({ env = process.env } = {}) {
  if (!env.AMADEUS_FLIGHT_API_KEY) {
    return {
      status: 'not-configured',
      provider: 'amadeus',
      flights: [],
      reason: 'AMADEUS_FLIGHT_API_KEY ausente.',
    };
  }

  return {
    status: 'not-implemented',
    provider: 'amadeus',
    flights: [],
    reason: 'Adapter preparado. TODO: conectar Amadeus Flight Offers API e mapear resposta para flightNormalizer.',
  };
}
