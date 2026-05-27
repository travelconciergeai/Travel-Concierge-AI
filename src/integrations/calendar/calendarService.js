import { CALENDAR_PROVIDERS } from './types.js';
import { createGoogleCalendarEvent } from './googleCalendarAdapter.js';
import { createAppleCalendarEvent } from './appleCalendarAdapter.js';
import { createOutlookCalendarEvent } from './outlookCalendarAdapter.js';

const adapters = {
  [CALENDAR_PROVIDERS.google]: createGoogleCalendarEvent,
  [CALENDAR_PROVIDERS.apple]: createAppleCalendarEvent,
  [CALENDAR_PROVIDERS.outlook]: createOutlookCalendarEvent,
};

export async function createCalendarEvent({
  provider = CALENDAR_PROVIDERS.google,
  event = {},
} = {}) {
  const adapter = adapters[provider] || adapters[CALENDAR_PROVIDERS.google];
  return adapter(event);
}

export { CALENDAR_PROVIDERS };
