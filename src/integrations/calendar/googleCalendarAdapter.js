import { CALENDAR_PROVIDERS, createMockCalendarEvent } from './types.js';

export async function createGoogleCalendarEvent(payload = {}) {
  return createMockCalendarEvent({
    ...payload,
    provider: CALENDAR_PROVIDERS.google,
    notes: payload.notes || 'Google Calendar mockado. Pronto para trocar por OAuth/API real no futuro.',
  });
}
