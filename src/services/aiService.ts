import type { CVData } from './cvService';
import { authService } from './authService';
import { revenueService } from './revenueService';

export type AiSuggestionField =
  | 'career_summary'
  | 'career_objective'
  | 'skills'
  | 'internship_responsibilities'
  | 'internship_learning'
  | 'experience_responsibilities'
  | 'project_technologies'
  | 'project_description'
  | 'training_topics'
  | 'activity_contribution'
  | 'achievement_description'
  | 'custom_text';

export type AiSuggestionRequest = {
  field: AiSuggestionField;
  action?: 'suggest' | 'continue' | 'rewrite';
  currentValue?: string;
  instruction?: string;
  cvData: CVData;
};

export type AiSuggestionResponse = {
  suggestions: string[];
  provider?: 'gemini' | 'openrouter' | 'local';
  usedFallback?: boolean;
};

const splitList = (value: string) => value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);

const roleText = (data: CVData) => data.professionalTitle || data.experience?.find((item) => item.jobTitle)?.jobTitle || data.projects?.find((item) => item.role)?.role || 'Entry Level Professional';

const contextText = (data: CVData) => [
  roleText(data),
  ...data.education.map((item) => `${item.degree} ${item.subject}`),
  ...data.internships.map((item) => `${item.internshipTitle} ${item.department}`),
  ...data.experience.map((item) => `${item.jobTitle} ${item.company}`),
  ...data.projects.map((item) => `${item.title} ${item.projectType} ${item.role} ${item.technologies}`),
  ...data.training.map((item) => item.trainingName),
  ...data.skills.map((item) => item.name),
].join(' ').toLowerCase();

const localSkillSuggestions = (data: CVData) => {
  const role = contextText(data);
  if (role.includes('frontend') || role.includes('react')) return ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Tailwind CSS', 'Responsive Design', 'Git'];
  if (role.includes('backend') || role.includes('node')) return ['Node.js', 'Express.js', 'REST API', 'Database Design', 'Authentication', 'Git', 'Debugging', 'API Integration'];
  if (role.includes('full stack') || role.includes('mern')) return ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Express.js', 'MongoDB', 'REST API', 'Git'];
  if (role.includes('data') || role.includes('analytics')) return ['Excel', 'SQL', 'Python', 'Data Cleaning', 'Dashboard Reporting', 'Data Visualization', 'Problem Solving'];
  if (role.includes('ui') || role.includes('designer')) return ['User Research', 'Wireframing', 'Prototyping', 'Figma', 'Design Systems', 'Responsive Layouts', 'Usability Testing'];
  if (role.includes('marketing')) return ['Digital Marketing', 'Content Strategy', 'SEO', 'Social Media Management', 'Campaign Analysis', 'Copywriting'];
  if (role.includes('account') || role.includes('finance')) return ['Financial Reporting', 'Bookkeeping', 'Excel', 'Data Entry', 'Reconciliation', 'Attention to Detail'];
  return ['Communication', 'Problem Solving', 'Teamwork', 'Microsoft Office', 'Research', 'Time Management', 'Presentation', 'Adaptability'];
};

const instructionValue = (instruction: string | undefined, label: string) => {
  const match = (instruction || '').match(new RegExp(`${label}:\\s*([^.]*)`, 'i'));
  return match?.[1]?.trim() || '';
};

const roleAwarePhrase = (request: AiSuggestionRequest) => {
  const text = `${request.instruction || ''} ${contextText(request.cvData)}`.toLowerCase();
  if (text.includes('frontend') || text.includes('react')) return 'responsive UI development and reusable component implementation';
  if (text.includes('backend') || text.includes('node')) return 'API development, data handling, and secure backend workflow support';
  if (text.includes('data')) return 'data collection, analysis, reporting, and insight preparation';
  if (text.includes('marketing')) return 'campaign execution, content coordination, and performance tracking';
  if (text.includes('account') || text.includes('finance')) return 'financial documentation, reconciliation, and accurate record maintenance';
  return 'task execution, documentation, communication, and practical problem solving';
};

const localSuggestion = (request: AiSuggestionRequest): AiSuggestionResponse => {
  const role = roleText(request.cvData);
  const existing = splitList(request.currentValue || '');

  if (request.field === 'skills') {
    const merged = [...existing, ...localSkillSuggestions(request.cvData)].filter((item, index, items) => items.findIndex((next) => next.toLowerCase() === item.toLowerCase()) === index);
    return { suggestions: [merged.slice(0, 14).join('\n')], provider: 'local', usedFallback: true };
  }

  if (request.field === 'career_summary' || request.field === 'career_objective') {
    return {
      suggestions: [`Motivated ${role} with a strong interest in building practical solutions, learning quickly, and contributing to team goals. Skilled at organizing tasks, communicating clearly, and applying relevant tools to deliver reliable outcomes.`],
      provider: 'local',
      usedFallback: true,
    };
  }

  const bulletMap: Partial<Record<AiSuggestionField, string[]>> = {
    internship_responsibilities: [
      `Assisted with ${roleAwarePhrase(request)} in the ${instructionValue(request.instruction, 'Department') || 'assigned'} department`,
      'Prepared notes, reports, and supporting documentation for supervisor review',
      'Coordinated with team members to complete assigned tasks within deadlines',
    ],
    internship_learning: [
      `Gained hands-on exposure to ${roleAwarePhrase(request)} in a professional environment`,
      'Improved workplace communication, documentation, and practical problem-solving skills',
    ],
    experience_responsibilities: [
      `Handled ${roleAwarePhrase(request)} for ${instructionValue(request.instruction, 'Company') || 'the organization'}`,
      'Collaborated with team members and stakeholders to complete assigned deliverables',
      'Maintained documentation, updates, and quality checks to support smooth operations',
    ],
    project_technologies: localSkillSuggestions(request.cvData).slice(0, 6),
    project_description: [
      `Planned and built the ${instructionValue(request.instruction, 'Project name') || 'project'} workflow based on user and project requirements`,
      'Implemented core features, organized project structure, and tested important use cases',
      'Presented the final solution with clear documentation and practical outcomes',
    ],
    training_topics: [
      `${instructionValue(request.instruction, 'Training name') || 'Core'} fundamentals and practical applications`,
      'Tools, workflow, and hands-on exercises',
      'Practice tasks, review, and real-world use cases',
    ],
    activity_contribution: [
      `Supported planning and execution of ${instructionValue(request.instruction, 'Activity title') || 'the activity'}`,
      'Coordinated with organizers, participants, and team members during key tasks',
      'Contributed to communication, documentation, and successful completion',
    ],
    achievement_description: [
      `Recognized by ${instructionValue(request.instruction, 'Awarding organization') || 'the awarding organization'} for ${instructionValue(request.instruction, 'Achievement title') || 'strong performance and contribution'}`,
      'Demonstrated discipline, teamwork, and commitment to achieving the result',
    ],
  };

  const bullets = bulletMap[request.field] || ['Improved planning, communication, and practical execution through this work'];
  return { suggestions: [bullets.join('\n')], provider: 'local', usedFallback: true };
};

const aiCache = new Map<string, AiSuggestionResponse>();

const getCacheKey = (request: AiSuggestionRequest) => {
  return `${request.field}-${request.action || 'suggest'}-${request.currentValue || ''}-${request.instruction || ''}`;
};

export const suggestCVContent = async (request: AiSuggestionRequest): Promise<AiSuggestionResponse> => {
  const cacheKey = getCacheKey(request);
  if (aiCache.has(cacheKey)) {
    return aiCache.get(cacheKey)!;
  }

  const user = await authService.getCurrentUser();
  if (user) await revenueService.assertCanUseAi(user.$id);

  try {
    const response = await fetch('/api/ai/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) throw new Error('AI endpoint is not available.');
    const result = await response.json() as AiSuggestionResponse;
    if (!result.suggestions?.length) throw new Error('AI returned no suggestion.');
    
    // Cache the result
    aiCache.set(cacheKey, result);
    if (user) await revenueService.incrementAiUsage(user.$id);
    return result;
  } catch {
    const fallback = localSuggestion(request);
    aiCache.set(cacheKey, fallback);
    if (user) await revenueService.incrementAiUsage(user.$id);
    return fallback;
  }
};
