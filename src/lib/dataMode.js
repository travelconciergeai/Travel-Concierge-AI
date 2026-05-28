export const DATA_MODE = String(import.meta.env.DATA_MODE || 'mock').toLowerCase() === 'real' ? 'real' : 'mock';

export const isRealDataMode = () => DATA_MODE === 'real';
export const isMockDataMode = () => DATA_MODE === 'mock';
