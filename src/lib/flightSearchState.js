const FLIGHT_SEARCH_STORAGE_KEY = 'voya:lastFlightSearch';
const FLIGHT_SEARCH_EVENT = 'voya:flight-search-updated';

const tones = ['coral', 'cool', 'sage', 'gold'];
const bestLabels = ['milhas', 'preço', 'horário', 'conforto'];

function formatTime(value) {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const match = String(value).match(/\b(\d{1,2}:\d{2})\b/);
    return match?.[1] || String(value);
  }
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(minutes, fallback) {
  if (!minutes) return fallback || 'A confirmar';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins ? ` ${mins}min` : ''}`;
}

function formatStops(stops, fallback) {
  if (fallback) return fallback;
  const count = Number(stops || 0);
  if (!count) return 'Direto';
  return `${count} conexão${count > 1 ? 'ões' : ''}`;
}

export function mapFlightSearchResult(flight, index = 0) {
  return {
    id: flight.id || `flight-${index}`,
    from: flight.origin || 'Origem',
    to: flight.destination || 'Destino',
    dep: formatTime(flight.departureTime || flight.departure),
    arr: formatTime(flight.arrivalTime || flight.arrival),
    airline: flight.airline || 'Companhia aérea',
    flight: flight.flightNumber || flight.flight || 'Voo sugerido',
    stops: formatStops(flight.stops, flight.stopoverInfo),
    dur: formatDuration(flight.durationMinutes, flight.duration),
    price: flight.price || 'Sob consulta',
    miles: flight.milesPrice || 'milhas a consultar',
    best: bestLabels[index % bestLabels.length],
    tone: tones[index % tones.length],
    bookingUrl: flight.bookingUrl || null,
    cabin: flight.cabinClass || flight.cabin || 'A confirmar',
    baggage: flight.baggageIncluded || flight.baggage || 'A confirmar',
    provider: flight.provider || null,
    raw: flight,
  };
}

export function getStoredFlightSearchResults() {
  try {
    const payload = JSON.parse(window.localStorage.getItem(FLIGHT_SEARCH_STORAGE_KEY) || 'null');
    if (!Array.isArray(payload?.options)) return [];
    return payload.options.map(mapFlightSearchResult);
  } catch {
    return [];
  }
}

export function saveFlightSearchResults(options = []) {
  if (!Array.isArray(options) || !options.length) return;
  window.localStorage.setItem(FLIGHT_SEARCH_STORAGE_KEY, JSON.stringify({
    savedAt: Date.now(),
    options,
  }));
  window.dispatchEvent(new CustomEvent(FLIGHT_SEARCH_EVENT, { detail: { options } }));
}

export function subscribeFlightSearchResults(callback) {
  const handler = (event) => callback((event.detail?.options || []).map(mapFlightSearchResult));
  window.addEventListener(FLIGHT_SEARCH_EVENT, handler);
  return () => window.removeEventListener(FLIGHT_SEARCH_EVENT, handler);
}
