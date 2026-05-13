import { sendPaymentStatusEmail } from '../../server/emailService.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed.' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const result = await sendPaymentStatusEmail(body, process.env);
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Email send failed.' }),
    };
  }
};
