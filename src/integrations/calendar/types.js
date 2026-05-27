export const CALENDAR_PROVIDERS = {
  google: 'google',
  apple: 'apple',
  outlook: 'outlook',
};

export const createMockCalendarEvent = ({
  title = 'Reserva sugerida pela Voya',
  location = 'Lisboa',
  startsAt = '2026-10-13T18:00:00-03:00',
  endsAt = '2026-10-13T19:30:00-03:00',
  notes = 'Evento mockado preparado pela Voya.',
  provider = CALENDAR_PROVIDERS.google,
} = {}) => ({
  id: `mock-calendar-${Date.now()}`,
  status: 'mocked',
  provider,
  title,
  location,
  startsAt,
  endsAt,
  notes,
});
