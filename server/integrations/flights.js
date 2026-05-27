import { searchFlightsWithEngine } from '../services/flightSearchEngine.js';

export async function searchFlights(options = {}) {
  return searchFlightsWithEngine(options);
}
