export function createAiSuggestion(body: unknown, env?: Record<string, string | undefined>): Promise<{
  suggestions: string[];
  provider: 'gemini' | 'openrouter';
}>;
