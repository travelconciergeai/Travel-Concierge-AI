export async function searchFlights(params = {}) {
  const response = await fetch('/api/travel/flights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) throw new Error(`Flights request failed: ${response.status}`);
  return response.json();
}

export async function searchHotels(params = {}) {
  const response = await fetch('/api/travel/hotels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) throw new Error(`Hotels request failed: ${response.status}`);
  return response.json();
}

export async function searchTours(params = {}) {
  const response = await fetch('/api/travel/tours', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) throw new Error(`Tours request failed: ${response.status}`);
  return response.json();
}
