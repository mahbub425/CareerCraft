const FIELD_LABELS = {
  career_summary: 'professional summary',
  career_objective: 'career objective',
  skills: 'skills',
  internship_responsibilities: 'internship responsibilities',
  internship_learning: 'internship learning outcome',
  experience_responsibilities: 'work experience responsibilities',
  project_technologies: 'project tools and technologies',
  project_description: 'project description',
  training_topics: 'training topics covered',
  activity_contribution: 'extra-curricular activity contribution',
  achievement_description: 'achievement description',
  custom_text: 'CV text',
};

const trimText = (value, max = 4000) => String(value || '').slice(0, max);

const getRole = (data) => data?.professionalTitle || data?.experience?.[0]?.jobTitle || data?.projects?.[0]?.role || 'Entry Level Professional';

const formatList = (items, mapItem, max = 900) => trimText((items || []).map(mapItem).filter(Boolean).join('; '), max);

const buildPrompt = (body) => {
  const data = body.cvData || {};
  const fieldLabel = FIELD_LABELS[body.field] || 'CV text';
  const action = body.action || 'suggest';
  const currentValue = trimText(body.currentValue, 1200);

  return [
    'You are a professional CV writing assistant.',
    'Write truthful, concise, ATS-friendly CV content. Do not invent company names, degrees, awards, metrics, or credentials.',
    'Use the user context only. If details are missing, keep the wording generic but useful.',
    'When current text exists, analyze it and improve or continue naturally instead of replacing the user voice completely.',
    'For repeated sections, focus on the exact item described in Extra instruction, not only the overall target job title.',
    'Return only the final text. No markdown fences, no explanations.',
    body.field === 'skills' ? 'For skills, return one skill per line, maximum 14 skills.' : '',
    ['internship_responsibilities', 'experience_responsibilities', 'project_description', 'activity_contribution'].includes(body.field)
      ? 'For responsibility or description fields, return 2 to 4 short bullet-style lines without bullet symbols.'
      : '',
    body.field === 'internship_learning'
      ? 'For internship learning outcome, return 1 to 2 concise outcome-focused lines.'
      : '',
    body.field === 'achievement_description'
      ? 'For achievement descriptions, return 1 to 2 concise lines grounded in the title and awarding organization.'
      : '',
    body.field === 'project_technologies' || body.field === 'training_topics'
      ? 'Return comma-separated or newline-separated short items only.'
      : '',
    '',
    `Task: ${action} ${fieldLabel}.`,
    `Current text: ${currentValue || '(empty)'}`,
    `Extra instruction: ${trimText(body.instruction, 800) || '(none)'}`,
    '',
    'CV context:',
    `Name: ${trimText(data.fullName, 120)}`,
    `Target/Job title: ${trimText(getRole(data), 160)}`,
    `Summary: ${trimText(data.summary || data.objective, 500)}`,
    `Education: ${formatList(data.education, (item) => [item.degree, item.subject, item.institute, item.result].filter(Boolean).join(' - '), 700)}`,
    `Internships: ${formatList(data.internships, (item) => [item.internshipTitle, item.department, item.organizationName, item.responsibilities, item.learningOutcome].filter(Boolean).join(' - '), 800)}`,
    `Experience: ${formatList(data.experience, (item) => [item.jobTitle, item.company, item.department, item.location, item.responsibilities].filter(Boolean).join(' - '), 900)}`,
    `Skills: ${formatList(data.skills, (item) => item.name, 500)}`,
    `Projects: ${formatList(data.projects, (item) => [item.title, item.projectType, item.role, item.technologies, item.description].filter(Boolean).join(' - '), 900)}`,
    `Training: ${formatList(data.training, (item) => [item.trainingName, item.institute, item.topicsCovered, item.description].filter(Boolean).join(' - '), 700)}`,
    `Activities: ${formatList(data.extracurricularActivities, (item) => [item.activityTitle, item.organization, item.role, item.contribution].filter(Boolean).join(' - '), 700)}`,
    `Achievements: ${formatList(data.achievements, (item) => [item.achievementTitle, item.awardingOrganization, item.description].filter(Boolean).join(' - '), 700)}`,
  ].filter(Boolean).join('\n');
};

const callGemini = async (prompt, env) => {
  const apiKey = env.GEMINI_API_KEY || env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return null;
  const model = env.GEMINI_MODEL || 'gemini-flash-latest';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.45,
        maxOutputTokens: 500,
      },
    }),
  });

  if (!response.ok) throw new Error(`Gemini request failed: ${response.status}`);
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
  return text ? { suggestions: [text], provider: 'gemini' } : null;
};

const callOpenRouter = async (prompt, env) => {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': env.OPENROUTER_SITE_URL || 'http://localhost:5173',
      'X-OpenRouter-Title': env.OPENROUTER_SITE_NAME || 'CV Builder',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free',
      messages: [
        { role: 'system', content: 'You generate concise, truthful, professional CV suggestions.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.45,
      max_tokens: 500,
    }),
  });

  if (!response.ok) throw new Error(`OpenRouter request failed: ${response.status}`);
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  return text ? { suggestions: [text], provider: 'openrouter' } : null;
};

export const createAiSuggestion = async (body, env = process.env) => {
  if (!body || typeof body !== 'object') throw new Error('Invalid request body.');
  const prompt = buildPrompt(body);
  const providers = env.AI_PROVIDER === 'openrouter' ? [callOpenRouter, callGemini] : [callGemini, callOpenRouter];

  for (const provider of providers) {
    try {
      const result = await provider(prompt, env);
      if (result?.suggestions?.length) return result;
    } catch (error) {
      console.warn(error instanceof Error ? error.message : error);
    }
  }

  throw new Error('No AI provider is configured or available.');
};
