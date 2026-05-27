import { createCalendarEvent } from '../src/integrations/calendar/calendarService.js';

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks.map((chunk) => Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))).toString('utf8'));
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export function createCalendarHandler() {
  return async function calendarHandler(req, res) {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    try {
      const body = await readJson(req);
      const result = await createCalendarEvent({
        provider: body.provider,
        event: body.event,
      });

      sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, 200, {
        status: 'mock-error',
        provider: 'google',
        title: 'Reserva sugerida pela Voya',
        error: error.message,
      });
    }
  };
}
