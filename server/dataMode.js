export function getDataMode(env = process.env) {
  return String(env.DATA_MODE || 'mock').toLowerCase() === 'real' ? 'real' : 'mock';
}

export function isRealDataMode(env = process.env) {
  return getDataMode(env) === 'real';
}

export function realModeError(resource) {
  return {
    status: 'error',
    provider: 'real-mode',
    errorMessage: `${resource} reais indisponíveis no momento`,
    dataMode: 'real',
    options: [],
  };
}
