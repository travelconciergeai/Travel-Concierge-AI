import { CALENDAR_PROVIDERS, createMockCalendarEvent } from './types.js';

export async function createAppleCalendarEvent(payload = {}) {
  return createMockCalendarEvent({
    ...payload,
    provider: CALENDAR_PROVIDERS.apple,
    notes: payload.notes || 'Apple Calendar mockado. Pronto para gerar ICS ou integração real no futuro.',
  });
}
