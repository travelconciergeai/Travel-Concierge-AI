import { searchHotelsWithEngine } from '../services/hotelSearchEngine.js';

export async function searchHotels(options = {}) {
  return searchHotelsWithEngine(options);
}
