import { DEFAULT_PDF_SECTIONS } from './pdfTypes.js';

export function buildPdfPayload({
  trip = {},
  days = [],
  agenda = [],
  wallet = {},
  miles = {},
  expertInsights = [],
  sections = DEFAULT_PDF_SECTIONS,
} = {}) {
  return {
    trip: {
      title: trip.title || 'Roteiro Voya',
      dates: trip.dates || null,
      travelers: trip.travelers || null,
      budget: trip.budget || null,
      blurb: trip.blurb || null,
    },
    sections,
    itinerary: days.map((day) => ({
      day: day.d,
      date: day.date,
      city: day.city,
      items: (day.items || []).map((item) => ({
        timeOfDay: item.t,
        title: item.title,
        place: item.place,
        duration: item.dur,
        tag: item.tag,
        vibe: item.vibe,
        confirmed: !!item.conf,
      })),
    })),
    agenda,
    wallet,
    miles,
    expertInsights,
  };
}
