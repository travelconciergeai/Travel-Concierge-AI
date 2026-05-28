import { defineConfig, loadEnv } from 'vite';
import { createChatHandler } from './server/chat.js';
import { createCalendarHandler } from './server/calendar.js';
import { createPdfHandler } from './server/pdf.js';
import { createTravelHandler } from './server/travel.js';
import { createDebugHandler } from './server/debug.js';

export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  const chatHandler = createChatHandler(env);
  const calendarHandler = createCalendarHandler();
  const pdfHandler = createPdfHandler();
  const travelHandler = createTravelHandler(env);
  const debugHandler = createDebugHandler(env);

  return {
    define: {
      'import.meta.env.DATA_MODE': JSON.stringify(env.DATA_MODE || 'mock'),
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
    },
    plugins: [
      {
        name: 'voya-chat-api',
        configureServer(server) {
          server.middlewares.use('/api/chat', chatHandler);
          server.middlewares.use('/api/calendar', calendarHandler);
          server.middlewares.use('/api/pdf', pdfHandler);
          server.middlewares.use(debugHandler);
          server.middlewares.use(travelHandler);
        },
        configurePreviewServer(server) {
          server.middlewares.use('/api/chat', chatHandler);
          server.middlewares.use('/api/calendar', calendarHandler);
          server.middlewares.use('/api/pdf', pdfHandler);
          server.middlewares.use(debugHandler);
          server.middlewares.use(travelHandler);
        },
      },
    ],
  };
});
