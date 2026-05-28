import { searchFlights } from './integrations/flights.js';
import { searchHotels } from './integrations/hotels.js';
import { searchTours } from './integrations/tours.js';
import { isRealDataMode } from './dataMode.js';

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

function createHandlers(env = process.env) {
  return {
    '/api/travel/flights': (body) => searchFlights({ ...body, env }),
    '/api/travel/hotels': (body) => searchHotels({ ...body, env }),
    '/api/travel/tours': (body) => searchTours(body),
  };
}

export async function postTravelEndpoint(pathname, body = {}, env = process.env) {
  const handlers = createHandlers(env);
  const handler = handlers[pathname];
  if (!handler) {
    throw new Error(`Unknown travel endpoint: ${pathname}`);
  }

  return handler(body);
}

export function createTravelHandler(env = process.env) {
  const handlers = createHandlers(env);

  return async function travelHandler(req, res, next) {
    const pathname = req.url?.split('?')[0];
    const handler = handlers[pathname];

    if (!handler) {
      next();
      return;
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    try {
      const body = await readJson(req);
      sendJson(res, 200, await handler(body));
    } catch (error) {
      sendJson(res, 200, {
        status: 'error',
        provider: isRealDataMode(env) ? 'real-mode' : 'mock-travel',
        errorMessage: error.message,
        dataMode: isRealDataMode(env) ? 'real' : 'mock',
        options: [],
      });
    }
  };
}
