import { createAiSuggestion } from '../../server/aiSuggest.js';

const readJsonBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.statusCode = 405;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ error: 'Method not allowed.' }));
    return;
  }

  try {
    const body = await readJsonBody(request);
    const result = await createAiSuggestion(body, process.env);
    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(result));
  } catch (error) {
    response.statusCode = 500;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'AI suggestion failed.' }));
  }
}
