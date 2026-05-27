import { buildPdfPayload } from './pdfPayloadAdapter.js';

export async function createPdfExport(input = {}) {
  const payload = buildPdfPayload(input);
  const exportId = `mock-pdf-${Date.now()}`;

  return {
    status: 'mocked',
    exportId,
    filename: `${payload.trip.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'roteiro-voya'}.pdf`,
    summary: 'PDF mockado preparado. A geração real poderá incluir roteiro, agenda, Wallet, milhas e insights dos experts.',
    sections: payload.sections,
    payload,
    share: {
      status: 'mocked',
      url: `/share/${exportId}`,
      expiresIn: '7d',
    },
  };
}
