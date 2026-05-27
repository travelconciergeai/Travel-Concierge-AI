function formatMoney(value, currency = 'BRL') {
  if (value === null || value === undefined || value === '') return 'Sob consulta';
  if (typeof value === 'string' && value.match(/[A-Z$R€£]/i)) return value;

  const amount = parseMoney(value);
  if (!Number.isFinite(amount)) return String(value);

  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function parseMoney(value) {
  if (typeof value === 'number') return value;
  const cleaned = String(value || '').replace(/[^\d,.-]/g, '');
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned;
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? amount : null;
}

function normalizePerks(perks) {
  if (Array.isArray(perks)) return perks.filter(Boolean).slice(0, 5);
  if (!perks) return [];
  return [String(perks)];
}

export function normalizeHotel(rawHotel = {}, { provider = 'mock', destination = 'Lisboa' } = {}) {
  const currency = rawHotel.currency || rawHotel.priceCurrency || 'BRL';
  const nightlyAmount = rawHotel.nightlyRate ?? rawHotel.rate ?? rawHotel.price ?? rawHotel.amount;
  const totalAmount = rawHotel.totalRate ?? rawHotel.totalPrice ?? rawHotel.total ?? nightlyAmount;

  return {
    id: String(rawHotel.id || rawHotel.hotelId || rawHotel.slug || `${provider}-${rawHotel.name || 'hotel'}`),
    name: rawHotel.name || rawHotel.hotelName || rawHotel.title || 'Hotel sugerido',
    city: rawHotel.city || rawHotel.destination || rawHotel.location?.city || destination,
    provider,
    nightlyRate: formatMoney(nightlyAmount, currency),
    totalRate: formatMoney(totalAmount, currency),
    currency,
    image: rawHotel.image || rawHotel.imageUrl || rawHotel.photos?.[0]?.url || null,
    rating: Number(rawHotel.rating || rawHotel.stars || rawHotel.guestRating || 0),
    reviewCount: Number(rawHotel.reviewCount || rawHotel.reviewsCount || 0),
    latitude: rawHotel.latitude || rawHotel.location?.latitude || null,
    longitude: rawHotel.longitude || rawHotel.location?.longitude || null,
    locationScore: Number(rawHotel.locationScore || rawHotel.location?.score || 0),
    perks: normalizePerks(rawHotel.perks || rawHotel.amenities || rawHotel.benefits),
    bestFor: rawHotel.bestFor || rawHotel.recommendation || rawHotel.highlight || 'curadoria Voya',
    bookingUrl: rawHotel.bookingUrl || rawHotel.url || rawHotel.deepLink || null,
    cancellationPolicy: rawHotel.cancellationPolicy || rawHotel.refundPolicy || 'Política a confirmar.',
    matchedExpertRecommendation: rawHotel.matchedExpertRecommendation || null,
    matchReason: rawHotel.matchReason || null,
    confidence: Number(rawHotel.confidence || 0),
    style: rawHotel.style || rawHotel.category || rawHotel.type || 'hotel',
    neighborhood: rawHotel.neighborhood || rawHotel.location?.neighborhood || null,
    nightlyRateAmount: parseMoney(nightlyAmount),
    totalRateAmount: parseMoney(totalAmount),
  };
}

export function normalizeHotels(rawHotels = [], context = {}) {
  return rawHotels.map((hotel) => normalizeHotel(hotel, context));
}
