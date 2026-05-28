import { searchFlights } from '../../server/integrations/flights.js';
import { isRealDataMode } from '../../server/dataMode.js';
import { readJson, sendJson } from '../_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const body = await readJson(req);
    const result = await searchFlights({ ...body, env: process.env });
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 200, {
      status: 'error',
      provider: process.env.FLIGHT_PROVIDER || 'unknown',
      errorMessage: error.message || 'Não foi possível consultar voos agora',
      dataMode: isRealDataMode(process.env) ? 'real' : 'mock',
      options: [],
    });
  }
}
