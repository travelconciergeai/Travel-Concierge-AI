function formatMoney(value, currency = 'BRL') {
  if (value === null || value === undefined || value === '') return 'Sob consulta';
  if (typeof value === 'string' && value.match(/[A-Z$R€£]/i)) return value;

  const amount = Number.parseFloat(String(value).replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.'));
  if (!Number.isFinite(amount)) return String(value);

  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function parseMoney(value) {
  const amount = Number.parseFloat(String(value || '').replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.'));
  return Number.isFinite(amount) ? amount : null;
}

function parseDurationToMinutes(value) {
  if (typeof value === 'number') return value;
  const text = String(value || '').toLowerCase();
  const iso = text.match(/pt(?:(\d+)h)?(?:(\d+)m)?/i);
  if (iso) return (Number(iso[1] || 0) * 60) + Number(iso[2] || 0);
  const hours = Number.parseFloat(text.match(/(\d+(?:[,.]\d+)?)\s*h/)?.[1]?.replace(',', '.') || '0');
  const minutes = Number.parseFloat(text.match(/(\d+)\s*min/)?.[1] || '0');
  return Math.round(hours * 60 + minutes);
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return [String(value)];
}

export function normalizeFlight(rawFlight = {}, { provider = 'mock', origin = 'GRU', destination = 'LIS' } = {}) {
  const currency = rawFlight.currency || rawFlight.priceCurrency || 'BRL';
  const priceValue = rawFlight.price ?? rawFlight.amount ?? rawFlight.totalPrice;
  const flightNumber = rawFlight.flightNumber || rawFlight.flight || rawFlight.number || 'Voo sugerido';
  const durationMinutes = Number(rawFlight.durationMinutes) || parseDurationToMinutes(rawFlight.duration);
  const cabinClass = rawFlight.cabinClass || rawFlight.cabin || rawFlight.class || 'economy';

  return {
    id: String(rawFlight.id || rawFlight.offerId || `${provider}-${flightNumber}`),
    provider,
    airline: rawFlight.airline || rawFlight.carrier || 'Companhia aérea',
    flightNumber,
    origin: rawFlight.origin || rawFlight.route?.split('-')?.[0] || origin,
    destination: rawFlight.destination || rawFlight.route?.split('-')?.at?.(-1) || destination,
    departureTime: rawFlight.departureTime || rawFlight.departure || null,
    arrivalTime: rawFlight.arrivalTime || rawFlight.arrival || null,
    departure: rawFlight.departure || rawFlight.departureTime || null,
    arrival: rawFlight.arrival || rawFlight.arrivalTime || null,
    duration: rawFlight.duration || (durationMinutes ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}min` : null),
    durationMinutes,
    stops: Number(rawFlight.stops || rawFlight.connections || 0),
    stopoverInfo: rawFlight.stopoverInfo || rawFlight.connectionInfo || (Number(rawFlight.stops || 0) === 0 ? 'Direto' : 'Conexão a confirmar'),
    price: formatMoney(priceValue, currency),
    currency,
    milesPrice: rawFlight.milesPrice || rawFlight.miles || null,
    walletBenefits: normalizeList(rawFlight.walletBenefits || rawFlight.benefits),
    baggageIncluded: rawFlight.baggageIncluded || rawFlight.baggage || 'A confirmar',
    baggage: rawFlight.baggage || rawFlight.baggageIncluded || 'A confirmar',
    familyScore: Number(rawFlight.familyScore || 0),
    comfortScore: Number(rawFlight.comfortScore || 0),
    bookingUrl: rawFlight.bookingUrl || rawFlight.url || rawFlight.deepLink || null,
    recommendationReason: rawFlight.recommendationReason || rawFlight.bestFor || 'Curadoria Voya',
    confidence: Number(rawFlight.confidence || 0),
    cabin: cabinClass,
    cabinClass,
    priceAmount: parseMoney(priceValue),
  };
}

export function normalizeFlights(rawFlights = [], context = {}) {
  return rawFlights.map((flight) => normalizeFlight(flight, context));
}
