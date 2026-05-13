import express from 'express';
import { createAiSuggestion } from './server/aiSuggest.js';
import { sendPaymentStatusEmail } from './server/emailService.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

app.post('/api/ai/suggest', async (req, res) => {
  try {
    const result = await createAiSuggestion(req.body, process.env);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.post('/api/email/payment-status', async (req, res) => {
  try {
    const result = await sendPaymentStatusEmail(req.body, process.env);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
