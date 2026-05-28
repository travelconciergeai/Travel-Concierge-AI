import { searchHotels } from '../../server/integrations/hotels.js';
import { readJson, sendJson } from '../_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const body = await readJson(req);
    const result = await searchHotels({ ...body, env: process.env });
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 200, {
      status: 'error',
      provider: process.env.HOTEL_PROVIDER || 'unknown',
      errorMessage: error.message || 'Não foi possível consultar hotéis agora',
      options: [],
    });
  }
}
