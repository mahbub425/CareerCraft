# AI Suggestion Setup

The CV builder calls `/api/ai/suggest` from the browser. API keys are read only on the server side and must never be prefixed with `VITE_`.

## 1. Rotate Exposed Keys

If an API key was pasted into chat, revoke it first and create a new one.

## 2. Local Development

Add these values to `.env`:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_new_gemini_api_key
GEMINI_MODEL=gemini-flash-latest
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free
OPENROUTER_SITE_URL=http://localhost:5173
OPENROUTER_SITE_NAME=Smart CV Builder
```

Run the app with:

```bash
npm run dev
```

Vite adds a local `/api/ai/suggest` middleware during development.

## 3. Production

The repository includes `api/ai/suggest.js`, which works as a serverless API route on platforms that support Node-style API functions, such as Vercel.

Set the same server environment variables in your hosting dashboard. Do not add these keys to frontend code, Appwrite documents, or any `VITE_` variable.

## 4. Provider Order

`AI_PROVIDER=gemini` tries Gemini first and OpenRouter second.  
`AI_PROVIDER=openrouter` tries OpenRouter first and Gemini second.

If no provider key is configured or the API fails, the frontend uses local fallback suggestions so the builder remains usable.
