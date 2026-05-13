import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createAiSuggestion } from './server/aiSuggest.js'
import { sendPaymentStatusEmail } from './server/emailService.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'local-ai-suggest-api',
        configureServer(server) {
          server.middlewares.use('/api/ai/suggest', async (request, response) => {
            if (request.method !== 'POST') {
              response.statusCode = 405;
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify({ error: 'Method not allowed.' }));
              return;
            }

            try {
              const chunks: Buffer[] = [];
              for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
              const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
              const result = await createAiSuggestion(body, env);
              response.statusCode = 200;
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify(result));
            } catch (error) {
              response.statusCode = 500;
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'AI suggestion failed.' }));
            }
          });
          server.middlewares.use('/api/email/payment-status', async (request, response) => {
            if (request.method !== 'POST') {
              response.statusCode = 405;
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify({ error: 'Method not allowed.' }));
              return;
            }

            try {
              const chunks: Buffer[] = [];
              for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
              const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
              const result = await sendPaymentStatusEmail(body, env);
              response.statusCode = 200;
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify(result));
            } catch (error) {
              response.statusCode = 500;
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Email send failed.' }));
            }
          });
        },
      },
    ],
  };
})
