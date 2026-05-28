export async function searchTours({
  destination = 'Lisboa',
  date = '2026-10-13',
  travelers = 2,
  interest = 'cultura e gastronomia',
  env = process.env,
} = {}) {
  const realMode = String(env.DATA_MODE || 'mock').toLowerCase() === 'real';

  if (realMode) {
    return {
      status: 'not-configured',
      provider: 'not-configured',
      query: { destination, date, travelers, interest },
      options: [],
      errorMessage: 'Tour provider real não configurado',
      dataMode: 'real',
    };
  }

  return {
    status: 'mocked',
    provider: 'mock-tours',
    query: { destination, date, travelers, interest },
    options: [
      {
        id: 'mock-tour-alfama',
        title: 'Walking tour autoral em Alfama',
        city: destination,
        duration: '3 h',
        host: 'Inês Marçal',
        price: 'R$ 180 por pessoa',
        bestFor: 'primeira vez',
      },
      {
        id: 'mock-tour-fado',
        title: 'Fado íntimo na Mesa de Frades',
        city: destination,
        duration: '2 h',
        host: 'Voya Expert',
        price: 'R$ 280 por pessoa',
        bestFor: 'noite especial',
      },
    ],
  };
}
