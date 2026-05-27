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

  return {
    id: String(rawFlight.id || rawFlight.offerId || `${provider}-${flightNumber}`),
    provider,
    airline: rawFlight.airline || rawFlight.carrier || 'Companhia aérea',
    flightNumber,
    origin: rawFlight.origin || rawFlight.route?.split('-')?.[0] || origin,
    destination: rawFlight.destination || rawFlight.route?.split('-')?.at?.(-1) || destination,
    departureTime: rawFlight.departureTime || rawFlight.departure || null,
    arrivalTime: rawFlight.arrivalTime || rawFlight.arrival || null,
    durationMinutes,
    stops: Number(rawFlight.stops || rawFlight.connections || 0),
    stopoverInfo: rawFlight.stopoverInfo || rawFlight.connectionInfo || (Number(rawFlight.stops || 0) === 0 ? 'Direto' : 'Conexão a confirmar'),
    price: formatMoney(priceValue, currency),
    currency,
    milesPrice: rawFlight.milesPrice || rawFlight.miles || null,
    walletBenefits: normalizeList(rawFlight.walletBenefits || rawFlight.benefits),
    baggageIncluded: rawFlight.baggageIncluded || rawFlight.baggage || 'A confirmar',
    familyScore: Number(rawFlight.familyScore || 0),
    comfortScore: Number(rawFlight.comfortScore || 0),
    bookingUrl: rawFlight.bookingUrl || rawFlight.url || rawFlight.deepLink || null,
    recommendationReason: rawFlight.recommendationReason || rawFlight.bestFor || 'Curadoria Voya',
    confidence: Number(rawFlight.confidence || 0),
    cabin: rawFlight.cabin || rawFlight.class || 'economy',
    priceAmount: parseMoney(priceValue),
  };
}

export function normalizeFlights(rawFlights = [], context = {}) {
  return rawFlights.map((flight) => normalizeFlight(flight, context));
}
