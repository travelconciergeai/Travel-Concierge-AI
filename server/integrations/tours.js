export async function searchTours({
  destination = 'Lisboa',
  date = '2026-10-13',
  travelers = 2,
  interest = 'cultura e gastronomia',
} = {}) {
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
