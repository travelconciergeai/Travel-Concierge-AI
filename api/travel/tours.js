import { searchTours } from '../../server/integrations/tours.js';
import { readJson, sendJson } from '../_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const body = await readJson(req);
    const result = await searchTours(body);
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 200, {
      status: 'error',
      provider: 'mock-tours',
      errorMessage: error.message || 'Não foi possível consultar passeios agora',
      options: [],
    });
  }
}
