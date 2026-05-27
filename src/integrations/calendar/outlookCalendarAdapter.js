import { CALENDAR_PROVIDERS, createMockCalendarEvent } from './types.js';

export async function createOutlookCalendarEvent(payload = {}) {
  return createMockCalendarEvent({
    ...payload,
    provider: CALENDAR_PROVIDERS.outlook,
    notes: payload.notes || 'Outlook Calendar mockado. Pronto para Microsoft Graph no futuro.',
  });
}
