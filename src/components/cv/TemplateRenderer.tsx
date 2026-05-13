import type { CVData, TemplateDoc } from '../../services/cvService';
import { isHtmlTemplate, parseTemplateConfig, type TemplateFieldSectionConfig, type TemplateLayoutConfig } from '../../lib/templateConfig';

const linesToBullets = (value?: string) => (value || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const commaList = (value?: string) => (value || '').split(/[\n,]+/).map((item) => item.trim()).filter(Boolean).join(', ');
const topicsToText = (value?: string) => commaList(value);
const getPhotoBorderRadius = (shape?: CVData['photoShape']) => {
  if (shape === 'circle') return '9999px';
  if (shape === 'square') return '0';
  return '12px';
};
const getPhotoShapeClass = (shape?: CVData['photoShape']) => {
  if (shape === 'circle') return 'rounded-full';
  if (shape === 'square') return 'rounded-none';
  return 'rounded-xl';
};
const getPhotoStyle = (data: CVData) => ({
  objectPosition: `${data.photoPositionX ?? 50}% ${data.photoPositionY ?? 50}%`,
  transform: `scale(${(data.photoZoom ?? 100) / 100})`,
});

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const sanitizeHtml = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;

  template.content.querySelectorAll('script, iframe, object, embed, link, meta').forEach((node) => node.remove());
  template.content.querySelectorAll<HTMLElement>('*').forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith('on') || value.startsWith('javascript:') || (name === 'style' && /javascript:|expression\s*\(/i.test(value))) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  return template.innerHTML;
};

const sanitizeCss = (css: string) => css
  .replace(/@import[^;]+;/gi, '')
  .replace(/url\(\s*['"]?javascript:[^)]+\)/gi, 'none')
  .replace(/expression\s*\([^)]*\)/gi, '');

const renderList = (items: string[]) => items.map((item) => `<span class="cv-skill-pill"><span class="cv-skill-pill-text">${escapeHtml(item)}</span></span>`).join('');

const renderBullets = (items: string[]) => items.map((item) => `<li><span>${escapeHtml(item)}</span></li>`).join('');
const renderBulletList = (items: string[]) => items.length ? `<ul class="cv-bullet-list">${renderBullets(items)}</ul>` : '';

const replaceAllText = (source: string, search: string, replacement: string) => {
  if (!search) return source;
  return source.split(search).join(replacement).split(escapeHtml(search)).join(replacement);
};

const normalizeText = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const sectionHasText = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  return Boolean((template.content.textContent || '').replace(/\s+/g, '').trim() || template.content.querySelector('img, .cv-skill-pill'));
};

const stripBlockTags = (html: string) => html.replace(/\{\{\s*[#/][^}]+\}\}/g, '');

const labelize = (value: string) => value
  .replace(/[_-]+/g, ' ')
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const renderCustomItems = (section: TemplateFieldSectionConfig | undefined, items: Array<Record<string, string>>) => items
  .map((item) => {
    const schemaFields = section?.fields?.length ? section.fields : Object.keys(item).map((key) => ({ name: key, label: labelize(key) }));
    const values = schemaFields
      .map((field) => ({ label: field.label || labelize(field.name), value: String(item[field.name] || '').trim() }))
      .filter((field) => field.value);
    if (!values.length) return '';
    const [first, ...rest] = values;
    return `
      <section class="cv-entry">
        <strong>${escapeHtml(first.value)}</strong>
        ${rest.map((field) => `<div><span>${escapeHtml(field.label)}:</span> ${escapeHtml(field.value)}</div>`).join('')}
      </section>
    `;
  })
  .join('');

const hasEducationData = (item?: CVData['education'][number]) => Boolean(
  item && [item.degree, item.institute, item.subject, item.result].some((value) => value?.trim()),
);

const hasInternshipData = (item?: CVData['internships'][number]) => Boolean(
  item && [item.internshipTitle, item.organizationName, item.duration, item.department, item.responsibilities, item.learningOutcome].some((value) => value?.trim()),
);

const hasRecordData = (item?: Record<string, string>) => Boolean(
  item && Object.values(item).some((value) => String(value || '').trim()),
);

const getFirstRecordValue = (item?: Record<string, string>) => (
  item ? Object.values(item).map((value) => String(value || '').trim()).find(Boolean) : undefined
);

const renderExperienceEntries = (items: CVData['experience']) => items.map((item) => `
  <div class="cv-entry cv-generated-entry">
    <div class="cv-entry-head"><strong>${escapeHtml(item.jobTitle || 'Job Title')}</strong><span>${escapeHtml([item.startDate, item.currentlyWorking ? 'Present' : item.endDate].filter(Boolean).join(' - '))}</span></div>
    <div>${escapeHtml([item.company, item.location].filter(Boolean).join(' | '))}</div>
    ${renderBulletList(linesToBullets(item.responsibilities))}
  </div>
`).join('');

const renderInternshipEntries = (items: CVData['internships']) => items.map((item) => `
  <div class="cv-entry cv-generated-entry">
    <div class="cv-entry-head"><strong>${escapeHtml(item.internshipTitle || 'Internship Title')}</strong><span>${escapeHtml(item.duration || '')}</span></div>
    <div>${escapeHtml([item.organizationName, item.department].filter(Boolean).join(' | '))}</div>
    ${renderBulletList(linesToBullets(item.responsibilities))}
    ${item.learningOutcome ? `<div><strong>Learning/Outcome:</strong> ${escapeHtml(item.learningOutcome)}</div>` : ''}
  </div>
`).join('');

const renderEducationEntries = (items: CVData['education']) => items.map((item) => `
  <div class="cv-entry cv-generated-entry">
    <div class="cv-entry-head"><strong>${escapeHtml(item.degree || 'Degree')}${item.subject ? ` in ${escapeHtml(item.subject)}` : ''}</strong><span>${escapeHtml([item.startYear, item.currentlyStudying ? 'Present' : item.passingYear].filter(Boolean).join(' - '))}</span></div>
    <div>${escapeHtml(item.institute || '')}</div>
    ${item.result ? `<div>CGPA: ${escapeHtml(item.result)}</div>` : ''}
  </div>
`).join('');

const renderProjectEntries = (items: CVData['projects']) => items.map((item) => `
  <div class="cv-entry cv-generated-entry">
    <strong>${escapeHtml(item.title || 'Project Name')}</strong>
    ${[item.projectType, item.role].filter(Boolean).length ? `<div>${escapeHtml([item.projectType, item.role].filter(Boolean).join(' | '))}</div>` : ''}
    ${item.technologies ? `<div>Tools/Technologies Used: ${escapeHtml(commaList(item.technologies))}</div>` : ''}
    ${item.url ? `<div>Project Link: ${escapeHtml(item.url)}</div>` : ''}
    ${item.description ? renderBulletList(linesToBullets(item.description)) : ''}
  </div>
`).join('');

const renderTrainingEntries = (items: CVData['training']) => items.map((item) => `
  <div class="cv-entry cv-generated-entry">
    <div class="cv-entry-head"><strong>${escapeHtml(item.trainingName || 'Training Name')}</strong><span>${escapeHtml(item.completionDate || '')}</span></div>
    <div>${[item.institute ? `Institute: ${escapeHtml(item.institute)}` : '', item.duration ? escapeHtml(item.duration) : ''].filter(Boolean).join(' | ')}</div>
    ${(item.topicsCovered || item.description) ? `<div><strong>Topics Covered:</strong> ${escapeHtml(topicsToText(item.topicsCovered || item.description))}</div>` : ''}
  </div>
`).join('');

const renderCertificationEntries = (items: CVData['certifications']) => items.map((item) => `
  <div class="cv-entry cv-generated-entry">
    <div class="cv-entry-head"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.year || '')}</span></div>
    ${item.organization ? `<div>${escapeHtml(item.organization)}</div>` : ''}
    ${item.credentialLink ? `<div>Credential URL: ${escapeHtml(item.credentialLink)}</div>` : ''}
  </div>
`).join('');

const renderActivityEntries = (items: CVData['extracurricularActivities']) => items.map((item) => `
  <div class="cv-entry cv-generated-entry">
    <div class="cv-entry-head"><strong>${escapeHtml(item.activityTitle || 'Activity Title')}</strong><span>${escapeHtml([item.startDate, item.currentlyWorking ? 'Present' : item.endDate].filter(Boolean).join(' - '))}</span></div>
    ${(item.organization || item.role) ? `<div class="cv-entry-meta"><span>${escapeHtml(item.organization || '')}</span><span>${item.role ? `<strong>Role:</strong> ${escapeHtml(item.role)}` : ''}</span></div>` : ''}
    ${renderBulletList(linesToBullets(item.contribution))}
  </div>
`).join('');

const renderAchievementEntries = (items: CVData['achievements']) => items.map((item) => `
  <div class="cv-entry cv-generated-entry">
    <div class="cv-entry-head"><strong>${escapeHtml(item.achievementTitle || 'Achievement Title')}</strong><span>${escapeHtml(item.dateYear || '')}</span></div>
    ${item.awardingOrganization ? `<div><strong>Awarding Organization:</strong> ${escapeHtml(item.awardingOrganization)}</div>` : ''}
    ${item.description ? `<div>${escapeHtml(item.description)}</div>` : ''}
  </div>
`).join('');

export const sampleCVData: CVData = {
  title: 'Sample CV',
  fullName: 'Alex Carter',
  professionalTitle: 'Senior Product Designer',
  email: 'alex.carter@example.com',
  phone: '+1 (555) 000-0000',
  address: 'New York, NY',
  linkedIn: 'https://linkedin.com/in/alexcarter',
  portfolio: 'https://alexcarter.design',
  photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
  objective: '',
  summary: 'Dynamic product designer with experience crafting elegant, accessible interfaces and practical design systems.',
  education: [{ degree: 'BFA Design', institute: 'State University', subject: 'Interaction Design', result: '3.8', startYear: 'January 2018', passingYear: 'May 2022', currentlyStudying: false }],
  internships: [{ internshipTitle: 'Product Design Intern', organizationName: 'Bright Labs', duration: 'January 2022 - April 2022', department: 'Design', responsibilities: 'Supported user research\nPrepared interface mockups', learningOutcome: 'Learned practical product design workflows and cross-functional collaboration.' }],
  experience: [{ jobTitle: 'Principal Designer', company: 'Visionary Labs', location: 'Remote', startDate: 'June 2022', endDate: 'May 2026', currentlyWorking: true, responsibilities: 'Designed responsive web apps\nMentored junior designers' }],
  skills: [{ name: 'AI Expert' }, { name: 'Product Development' }, { name: 'SQL' }],
  projects: [{ title: 'Portfolio Builder', projectType: 'Personal', role: 'Full Stack Developer', description: 'A polished portfolio system.', technologies: 'React, TypeScript, Appwrite', url: 'https://example.com' }],
  training: [{ trainingName: 'Advanced Product Design Training', institute: 'Design Academy', duration: '6 weeks', completionDate: 'March 2025', topicsCovered: 'Product research\nPrototyping\nUsability testing', description: '' }],
  certifications: [{ name: 'UX Certification', organization: 'Design Guild', year: 'January 2024', credentialLink: 'https://example.com/cert' }],
  extracurricularActivities: [{ activityTitle: 'Design Club Workshop', organization: 'State University Design Club', role: 'Coordinator', startDate: 'January 2021', endDate: 'March 2021', currentlyWorking: false, contribution: 'Organized peer learning sessions\nCoordinated guest speakers' }],
  achievements: [{ achievementTitle: 'Best Portfolio Award', awardingOrganization: 'Design Guild', dateYear: 'May 2024', description: 'Recognized for a polished portfolio and strong case study presentation.' }],
  languages: [{ language: 'English', proficiency: 'Fluent' }],
  referencesMode: 'available',
  references: [],
  customData: {
    skillGroups: [{ category: 'Design Tools', items: 'Figma, FigJam, Adobe XD' }],
  },
};

export const normalizeSampleTemplateCode = (html: string) => {
  const sampleEducation = sampleCVData.education[0];
  const sampleInternship = sampleCVData.internships[0];
  const sampleExperience = sampleCVData.experience[0];
  const sampleProject = sampleCVData.projects[0];
  const sampleTraining = sampleCVData.training[0];
  const sampleCertification = sampleCVData.certifications[0];
  const sampleActivity = sampleCVData.extracurricularActivities[0];
  const sampleAchievement = sampleCVData.achievements[0];
  const sampleLanguage = sampleCVData.languages[0];
  const samplePairs: Array<[string, string]> = [
    [sampleCVData.fullName, '{{fullName}}'],
    [sampleCVData.professionalTitle, '{{professionalTitle}}'],
    [sampleCVData.email, '{{email}}'],
    [sampleCVData.phone, '{{phone}}'],
    [sampleCVData.address, '{{address}}'],
    [sampleCVData.linkedIn, '{{linkedIn}}'],
    [sampleCVData.portfolio, '{{portfolio}}'],
    [sampleCVData.summary, '{{summary}}'],
    [sampleCVData.photoUrl || '', '{{photoUrl}}'],
    [sampleEducation.degree, '{{education}}'],
    [sampleEducation.institute, '{{education}}'],
    [sampleEducation.subject, '{{education}}'],
    [sampleInternship.internshipTitle, '{{internships}}'],
    [sampleInternship.organizationName, '{{internships}}'],
    [sampleInternship.duration, '{{internships}}'],
    [sampleInternship.department, '{{internships}}'],
    [sampleInternship.responsibilities, '{{internships}}'],
    [sampleInternship.learningOutcome, '{{internships}}'],
    [sampleExperience.jobTitle, '{{experience}}'],
    [sampleExperience.company, '{{experience}}'],
    [sampleExperience.location, '{{experience}}'],
    [sampleProject.title, '{{projects}}'],
    [sampleProject.projectType || '', '{{projects}}'],
    [sampleProject.role || '', '{{projects}}'],
    [sampleProject.description, '{{projects}}'],
    [sampleProject.technologies, '{{projects}}'],
    [sampleTraining.trainingName, '{{training}}'],
    [sampleTraining.institute, '{{training}}'],
    [sampleTraining.duration, '{{training}}'],
    [sampleTraining.completionDate, '{{training}}'],
    [sampleTraining.topicsCovered || '', '{{training}}'],
    [sampleCertification.name, '{{certifications}}'],
    [sampleCertification.organization, '{{certifications}}'],
    [sampleActivity.activityTitle, '{{extracurricularActivities}}'],
    [sampleActivity.organization, '{{extracurricularActivities}}'],
    [sampleActivity.role, '{{extracurricularActivities}}'],
    [sampleActivity.contribution, '{{extracurricularActivities}}'],
    [sampleAchievement.achievementTitle, '{{achievements}}'],
    [sampleAchievement.awardingOrganization, '{{achievements}}'],
    [sampleAchievement.description, '{{achievements}}'],
    [sampleLanguage.language, '{{languages}}'],
    ['Your Name', '{{fullName}}'],
    ['Professional Title', '{{professionalTitle}}'],
  ];

  return samplePairs.reduce((nextHtml, [sampleValue, placeholder]) => replaceAllText(nextHtml, sampleValue, placeholder), html);
};

const setText = (root: DocumentFragment, selectors: string[], value?: string) => {
  if (!value?.trim()) return;
  const element = selectors.map((selector) => root.querySelector<HTMLElement>(selector)).find(Boolean);
  if (element) element.textContent = value;
};

const replaceSectionByHeading = (root: DocumentFragment, headingWords: string[], html: string) => {
  const headings = Array.from(root.querySelectorAll<HTMLElement>('h2, h3, .section-title, [data-section-title]'));
  const heading = headings.find((item) => headingWords.some((word) => normalizeText(item.textContent || '').includes(word)));
  const section = heading?.closest('section') || heading?.parentElement;
  if (!section || !heading) return;
  if (!sectionHasText(html)) {
    section.remove();
    return;
  }
  Array.from(section.children).forEach((child) => {
    if (child !== heading) child.remove();
  });
  heading.insertAdjacentHTML('afterend', html);
};

const removeEmptySections = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;

  template.content.querySelectorAll<HTMLElement>('section').forEach((section) => {
    const clone = section.cloneNode(true) as HTMLElement;
    clone.querySelector('h1, h2, h3, h4, .section-title, [data-section-title]')?.remove();
    const hasContent = Boolean((clone.textContent || '').replace(/\s+/g, '').trim() || clone.querySelector('img, .cv-skill-pill'));
    if (!hasContent) section.remove();
  });

  return template.innerHTML;
};

const cleanupEmptySeparators = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;

  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

  textNodes.forEach((node) => {
    const text = node.nodeValue || '';
    if (!text.includes('|')) return;
    const nextText = text
      .replace(/(?:\s*\|\s*){2,}/g, ' | ')
      .replace(/^\s*\|\s*/g, '')
      .replace(/\s*\|\s*$/g, '');
    node.nodeValue = nextText.trim() === '|' ? '' : nextText;
  });

  Array.from(template.content.querySelectorAll<HTMLElement>('p, span, li')).forEach((element) => {
    const hasMedia = Boolean(element.querySelector('img, svg, canvas'));
    const text = (element.textContent || '').replace(/[\s|]+/g, '');
    if (!hasMedia && !text) element.remove();
  });

  return template.innerHTML;
};

const bindKnownFields = (html: string, data: CVData, config: TemplateLayoutConfig) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const root = template.content;
  const generated = createPlaceholderMap(data, config);

  setText(root, ['[data-field="fullName"]', '.full-name', '.cv-name', 'h1'], data.fullName);
  setText(root, ['[data-field="professionalTitle"]', '.professional-title', '.cv-title', '.job-title', 'h1 + p'], data.professionalTitle);
  setText(root, ['[data-field="email"]', '.email'], data.email);
  setText(root, ['[data-field="phone"]', '.phone'], data.phone);
  setText(root, ['[data-field="address"]', '.address', '.location'], data.address);
  setText(root, ['[data-field="linkedIn"]', '.linkedin'], data.linkedIn);
  setText(root, ['[data-field="portfolio"]', '.portfolio'], data.portfolio);
  setText(root, ['[data-field="summary"]', '.summary-text', '.cv-summary p'], data.summary || data.objective);

  const image = root.querySelector<HTMLImageElement>('[data-field="photo"] img, img[data-field="photo"], .profile-photo img, .photo img, img');
  if (image && data.photoUrl) {
    const photoRadius = getPhotoBorderRadius(data.photoShape);
    image.src = data.photoUrl;
    image.alt = data.fullName || 'Profile';
    image.crossOrigin = 'anonymous';
    image.referrerPolicy = 'no-referrer';
    image.style.width = '100%';
    image.style.height = '100%';
    image.style.maxWidth = 'none';
    image.style.display = 'block';
    image.style.objectFit = 'cover';
    image.style.objectPosition = `${data.photoPositionX ?? 50}% ${data.photoPositionY ?? 50}%`;
    image.style.transform = `scale(${(data.photoZoom ?? 100) / 100})`;
    const parent = image.parentElement;
    if (parent) {
      parent.style.overflow = 'hidden';
      parent.style.borderRadius = photoRadius;
    } else {
      image.style.borderRadius = photoRadius;
    }
  }

  replaceSectionByHeading(root, ['experience', 'employment', 'work history'], generated.experience);
  replaceSectionByHeading(root, ['internship', 'intern'], generated.internships);
  replaceSectionByHeading(root, ['education', 'academic'], generated.education);
  replaceSectionByHeading(root, ['skill'], generated.skills);
  replaceSectionByHeading(root, ['project'], generated.projects);
  replaceSectionByHeading(root, ['training'], generated.training);
  replaceSectionByHeading(root, ['certification', 'certificate'], generated.certifications);
  replaceSectionByHeading(root, ['extra curricular', 'extracurricular', 'activity'], generated.extracurricularActivities);
  replaceSectionByHeading(root, ['achievement', 'award'], generated.achievements);
  replaceSectionByHeading(root, ['language'], generated.languages);
  replaceSectionByHeading(root, ['reference'], generated.references);

  Object.entries(data.customData || {}).forEach(([key, value]) => {
    const rendered = Array.isArray(value) ? renderCustomItems(undefined, value) : escapeHtml(String(value || ''));
    replaceSectionByHeading(root, [normalizeText(key)], rendered);
  });

  return template.innerHTML;
};

const createPlaceholderMap = (data: CVData, config: TemplateLayoutConfig) => {
  const cleanSkills = (data.skills || []).filter((skill) => skill.name.trim()).map((skill) => skill.name.trim());
  const cleanEducation = (data.education || []).filter(hasEducationData).toReversed();
  const cleanInternships = (data.internships || []).filter(hasInternshipData).toReversed();
  const cleanExperience = (data.experience || []).filter((item) => item.jobTitle || item.company).toReversed();
  const cleanProjects = (data.projects || []).filter((item) => item.title || item.projectType || item.role || item.description).toReversed();
  const cleanTraining = (data.training || []).filter((item) => item.trainingName || item.institute || item.topicsCovered || item.description).toReversed();
  const cleanCertifications = (data.certifications || []).filter((item) => item.name || item.organization).toReversed();
  const cleanActivities = (data.extracurricularActivities || []).filter((item) => item.activityTitle || item.organization || item.contribution).toReversed();
  const cleanAchievements = (data.achievements || []).filter((item) => item.achievementTitle || item.awardingOrganization || item.description).toReversed();
  const cleanLanguages = (data.languages || []).filter((item) => item.language).toReversed();
  const cleanReferences = (data.references || []).filter((item) => item.name || item.organization).toReversed();
  const firstEducation = cleanEducation[0] || data.education?.[0];
  const firstInternship = cleanInternships[0] || data.internships?.[0];
  const firstExperience = cleanExperience[0] || data.experience?.[0];
  const firstProject = cleanProjects[0] || data.projects?.[0];
  const firstTraining = cleanTraining[0] || data.training?.[0];
  const firstCertification = cleanCertifications[0] || data.certifications?.[0];
  const firstActivity = cleanActivities[0] || data.extracurricularActivities?.[0];
  const firstAchievement = cleanAchievements[0] || data.achievements?.[0];
  const firstLanguage = cleanLanguages[0] || data.languages?.[0];
  const firstReference = cleanReferences[0] || data.references?.[0];

  const placeholders: Record<string, string> = {
    title: escapeHtml(data.title || ''),
    fullName: escapeHtml(data.fullName || 'Your Name'),
    professionalTitle: escapeHtml(data.professionalTitle || 'Professional Title'),
    email: escapeHtml(data.email || ''),
    phone: escapeHtml(data.phone || ''),
    address: escapeHtml(data.address || ''),
    linkedIn: escapeHtml(data.linkedIn || ''),
    portfolio: escapeHtml(data.portfolio || ''),
    summary: escapeHtml(data.summary || data.objective || ''),
    objective: escapeHtml(data.objective || data.summary || ''),
    photoUrl: escapeHtml(data.photoUrl || ''),
    photo: data.photoUrl ? `<img src="${escapeHtml(data.photoUrl)}" alt="${escapeHtml(data.fullName || 'Profile')}" crossorigin="anonymous" referrerpolicy="no-referrer" />` : '',
    degree: escapeHtml(firstEducation?.degree || ''),
    educationDegree: escapeHtml(firstEducation?.degree || ''),
    institute: escapeHtml(firstEducation?.institute || ''),
    subject: escapeHtml(firstEducation?.subject || ''),
    result: escapeHtml(firstEducation?.result || ''),
    startYear: escapeHtml(firstEducation?.startYear || ''),
    passingYear: escapeHtml(firstEducation?.currentlyStudying ? 'Present' : firstEducation?.passingYear || ''),
    internshipTitle: escapeHtml(firstInternship?.internshipTitle || ''),
    internshipOrganization: escapeHtml(firstInternship?.organizationName || ''),
    organizationName: escapeHtml(firstInternship?.organizationName || ''),
    internshipDuration: escapeHtml(firstInternship?.duration || ''),
    duration: escapeHtml(firstInternship?.duration || ''),
    internshipDepartment: escapeHtml(firstInternship?.department || ''),
    department: escapeHtml(firstInternship?.department || ''),
    internshipResponsibilities: renderBulletList(linesToBullets(firstInternship?.responsibilities)),
    internshipResponsibilitiesText: escapeHtml(linesToBullets(firstInternship?.responsibilities).join('\n')),
    learningOutcome: escapeHtml(firstInternship?.learningOutcome || ''),
    learningOutcomeText: escapeHtml(firstInternship?.learningOutcome || ''),
    jobTitle: escapeHtml(firstExperience?.jobTitle || ''),
    company: escapeHtml(firstExperience?.company || ''),
    location: escapeHtml(firstExperience?.location || ''),
    startDate: escapeHtml(firstExperience?.startDate || ''),
    endDate: escapeHtml(firstExperience?.currentlyWorking ? 'Present' : firstExperience?.endDate || ''),
    responsibilities: renderBulletList(linesToBullets(firstExperience?.responsibilities)),
    responsibilitiesText: escapeHtml(linesToBullets(firstExperience?.responsibilities).join('\n')),
    projectTitle: escapeHtml(firstProject?.title || ''),
    projectName: escapeHtml(firstProject?.title || ''),
    projectType: escapeHtml(firstProject?.projectType || ''),
    projectRole: escapeHtml(firstProject?.role || ''),
    role: escapeHtml(firstProject?.role || ''),
    projectDescription: renderBulletList(linesToBullets(firstProject?.description)),
    projectDescriptionText: escapeHtml(linesToBullets(firstProject?.description).join('\n')),
    technologies: escapeHtml(commaList(firstProject?.technologies || '')),
    projectUrl: escapeHtml(firstProject?.url || ''),
    trainingName: escapeHtml(firstTraining?.trainingName || ''),
    trainingInstitute: escapeHtml(firstTraining?.institute || ''),
    trainingOrganization: escapeHtml(firstTraining?.institute || ''),
    trainingDuration: escapeHtml(firstTraining?.duration || ''),
    trainingCompletionDate: escapeHtml(firstTraining?.completionDate || ''),
    trainingTopics: escapeHtml(topicsToText(firstTraining?.topicsCovered || firstTraining?.description)),
    topicsCovered: escapeHtml(topicsToText(firstTraining?.topicsCovered || firstTraining?.description)),
    certificationName: escapeHtml(firstCertification?.name || ''),
    certificationOrganization: escapeHtml(firstCertification?.organization || ''),
    organization: escapeHtml(firstCertification?.organization || ''),
    certificationYear: escapeHtml(firstCertification?.year || ''),
    credentialLink: escapeHtml(firstCertification?.credentialLink || ''),
    activityTitle: escapeHtml(firstActivity?.activityTitle || ''),
    activityOrganization: escapeHtml(firstActivity?.organization || ''),
    activityRole: escapeHtml(firstActivity?.role || ''),
    activityStartDate: escapeHtml(firstActivity?.startDate || ''),
    activityEndDate: escapeHtml(firstActivity?.currentlyWorking ? 'Present' : firstActivity?.endDate || ''),
    contribution: escapeHtml(firstActivity?.contribution || ''),
    achievementTitle: escapeHtml(firstAchievement?.achievementTitle || ''),
    awardingOrganization: escapeHtml(firstAchievement?.awardingOrganization || ''),
    achievementDateYear: escapeHtml(firstAchievement?.dateYear || ''),
    achievementDescription: escapeHtml(firstAchievement?.description || ''),
    language: escapeHtml(firstLanguage?.language || ''),
    proficiency: escapeHtml(firstLanguage?.proficiency || ''),
    referenceName: escapeHtml(firstReference?.name || ''),
    referenceDesignation: escapeHtml(firstReference?.designation || ''),
    referenceOrganization: escapeHtml(firstReference?.organization || ''),
    referenceEmail: escapeHtml(firstReference?.email || ''),
    referencePhone: escapeHtml(firstReference?.phone || ''),
    skillsText: escapeHtml(cleanSkills.join(', ')),
    skills: renderList(cleanSkills),
    internships: renderInternshipEntries(cleanInternships),
    experience: renderExperienceEntries(cleanExperience),
    education: renderEducationEntries(cleanEducation),
    projects: renderProjectEntries(cleanProjects),
    training: renderTrainingEntries(cleanTraining),
    certifications: renderCertificationEntries(cleanCertifications),
    extracurricularActivities: renderActivityEntries(cleanActivities),
    achievements: renderAchievementEntries(cleanAchievements),
    languages: cleanLanguages.map((item) => `<p>${escapeHtml(item.language)} - ${escapeHtml(item.proficiency)}</p>`).join(''),
    references: data.referencesMode === 'details' && cleanReferences.length > 0
      ? cleanReferences.map((item) => `<p><strong>${escapeHtml(item.name)}</strong><br />${escapeHtml([item.designation, item.organization].filter(Boolean).join(' | '))}<br />${escapeHtml([item.email, item.phone].filter(Boolean).join(' | '))}</p>`).join('')
      : '',
  };

  const schemaSections = new Map((config.fieldSchema?.sections || []).map((section) => [section.id, section]));
  Object.entries(data.customData || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      const rendered = renderCustomItems(schemaSections.get(key), value);
      if (!placeholders[key]) placeholders[key] = rendered;
      const firstItem = value[0] || {};
      Object.entries(firstItem).forEach(([fieldName, fieldValue]) => {
        placeholders[`${key}_${fieldName}`] = escapeHtml(String(fieldValue || ''));
        if (!placeholders[fieldName]) placeholders[fieldName] = escapeHtml(String(fieldValue || ''));
      });
    } else {
      placeholders[key] = escapeHtml(String(value || ''));
    }
  });

  return placeholders;
};

const htmlTextIncludes = (html: string, value?: string) => {
  if (!value || value.trim().length < 2) return true;
  const template = document.createElement('template');
  template.innerHTML = html;
  return (template.content.textContent || '').toLowerCase().includes(value.toLowerCase());
};

const insertLiveSections = (html: string, sections: string[]) => {
  if (!sections.length) return html;
  const template = document.createElement('template');
  template.innerHTML = html;
  const wrapper = document.createElement('div');
  wrapper.className = 'cv-live-placeholder-sections';
  wrapper.innerHTML = sections.join('');
  const headings = Array.from(template.content.querySelectorAll<HTMLElement>('h2, h3, .section-title, [data-section-title]'));
  const anchorHeading = headings.find((heading) => {
    const text = normalizeText(heading.textContent || '');
    return ['profile', 'summary', 'objective'].some((word) => text.includes(word));
  });
  const anchorSection = anchorHeading?.closest('section') || anchorHeading?.parentElement;
  const anchorParent = anchorSection?.parentElement;

  if (anchorSection && anchorParent) {
    anchorSection.insertAdjacentElement('afterend', wrapper);
    return template.innerHTML;
  }

  const contentTarget = template.content.querySelector<HTMLElement>('[data-main], main, .main, .content, .right, .right-column, .resume-main, .cv-main');
  if (contentTarget) {
    contentTarget.appendChild(wrapper);
    return template.innerHTML;
  }

  template.content.appendChild(wrapper);
  return template.innerHTML;
};

const appendMissingLivePlaceholders = (html: string, data: CVData, placeholders: Record<string, string>, config: TemplateLayoutConfig) => {
  const sections: string[] = [];
  const firstEducation = data.education.find(hasEducationData);
  const firstInternship = (data.internships || []).find(hasInternshipData);
  const firstExperience = data.experience.find((item) => item.jobTitle || item.company || item.responsibilities);
  const firstProject = data.projects.find((item) => item.title || item.projectType || item.role || item.description);
  const firstTraining = (data.training || []).find((item) => item.trainingName || item.institute || item.topicsCovered || item.description);
  const firstCertification = data.certifications.find((item) => item.name || item.organization);
  const firstActivity = (data.extracurricularActivities || []).find((item) => item.activityTitle || item.organization || item.contribution);
  const firstAchievement = (data.achievements || []).find((item) => item.achievementTitle || item.awardingOrganization || item.description);
  const firstLanguage = data.languages.find((item) => item.language);
  const firstReference = data.references.find((item) => item.name || item.organization);

  if ((data.summary || data.objective) && !htmlTextIncludes(html, data.summary || data.objective)) {
    sections.push(`<section><h2>Summary</h2><p>${placeholders.summary}</p></section>`);
  }
  if (firstEducation && !htmlTextIncludes(html, firstEducation.degree || firstEducation.institute || firstEducation.subject || firstEducation.result)) {
    const educationItems = (data.education || []).filter(hasEducationData).toReversed();
    sections.push(`<section><h2>Education</h2>${renderEducationEntries(educationItems)}</section>`);
  }
  if (firstInternship && !htmlTextIncludes(html, firstInternship.internshipTitle || firstInternship.organizationName || firstInternship.responsibilities || firstInternship.learningOutcome)) {
    const internshipItems = (data.internships || []).filter(hasInternshipData).toReversed();
    sections.push(`<section><h2>Internship</h2>${renderInternshipEntries(internshipItems)}</section>`);
  }
  if (firstExperience && !htmlTextIncludes(html, firstExperience.jobTitle || firstExperience.company || firstExperience.responsibilities)) {
    const experienceItems = (data.experience || []).filter((item) => item.jobTitle || item.company || item.responsibilities).toReversed();
    sections.push(`<section><h2>Experience</h2>${renderExperienceEntries(experienceItems)}</section>`);
  }
  if (data.skills.some((item) => item.name) && !htmlTextIncludes(html, data.skills.find((item) => item.name)?.name)) {
    sections.push(`<section><h2>Skills</h2>${placeholders.skills}</section>`);
  }
  if (firstProject && !htmlTextIncludes(html, firstProject.title || firstProject.projectType || firstProject.role || firstProject.description)) {
    const projectItems = (data.projects || []).filter((item) => item.title || item.projectType || item.role || item.description).toReversed();
    sections.push(`<section><h2>Projects</h2>${renderProjectEntries(projectItems)}</section>`);
  }
  if (firstTraining && !htmlTextIncludes(html, firstTraining.trainingName || firstTraining.institute || firstTraining.topicsCovered || firstTraining.description)) {
    const trainingItems = (data.training || []).filter((item) => item.trainingName || item.institute || item.topicsCovered || item.description).toReversed();
    sections.push(`<section><h2>Professional Training</h2>${renderTrainingEntries(trainingItems)}</section>`);
  }
  if (firstCertification && !htmlTextIncludes(html, firstCertification.name || firstCertification.organization)) {
    const certificationItems = (data.certifications || []).filter((item) => item.name || item.organization).toReversed();
    sections.push(`<section><h2>Certifications</h2>${renderCertificationEntries(certificationItems)}</section>`);
  }
  if (firstActivity && !htmlTextIncludes(html, firstActivity.activityTitle || firstActivity.organization || firstActivity.contribution)) {
    const activityItems = (data.extracurricularActivities || []).filter((item) => item.activityTitle || item.organization || item.contribution).toReversed();
    sections.push(`<section><h2>Extra-Curricular Activities</h2>${renderActivityEntries(activityItems)}</section>`);
  }
  if (firstAchievement && !htmlTextIncludes(html, firstAchievement.achievementTitle || firstAchievement.awardingOrganization || firstAchievement.description)) {
    const achievementItems = (data.achievements || []).filter((item) => item.achievementTitle || item.awardingOrganization || item.description).toReversed();
    sections.push(`<section><h2>Achievements</h2>${renderAchievementEntries(achievementItems)}</section>`);
  }
  if (firstLanguage && !htmlTextIncludes(html, firstLanguage.language)) {
    sections.push(`<section><h2>Languages</h2>${placeholders.languages}</section>`);
  }
  if (data.referencesMode === 'details' && firstReference && !htmlTextIncludes(html, firstReference.name || firstReference.organization)) {
    sections.push(`<section><h2>References</h2>${placeholders.references}</section>`);
  }
  (config.fieldSchema?.sections || []).forEach((section) => {
    const value = data.customData?.[section.id];
    const firstItem = Array.isArray(value) ? value.find(hasRecordData) : undefined;
    const firstValue = getFirstRecordValue(firstItem);
    const rendered = placeholders[section.id];
    if (firstValue && rendered && !htmlTextIncludes(html, firstValue)) {
      sections.push(`<section><h2>${escapeHtml(section.label || labelize(section.id))}</h2>${rendered}</section>`);
    }
  });

  return insertLiveSections(html, sections);
};

const renderHtmlTemplate = (data: CVData, template: TemplateDoc) => {
  const config = parseTemplateConfig(template);
  const placeholders = createPlaceholderMap(data, config);
  const normalizedTemplateHtml = normalizeSampleTemplateCode(config.html || '');
  const attributeSafeHtml = normalizedTemplateHtml.replace(/(src|href)=("|')\s*\{\{\s*photo\s*\}\}\s*\2/gi, '$1=$2{{photoUrl}}$2');
  const rawHtml = config.photo?.show === false ? attributeSafeHtml.replace(/\{\{\s*photo\s*\}\}/gi, '').replace(/\{\{\s*photoUrl\s*\}\}/gi, '') : attributeSafeHtml;
  let html = rawHtml.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => placeholders[key] ?? '');
  html = stripBlockTags(html);
  const sampleFallbacks: Array<[string, string]> = [
    [sampleCVData.fullName, data.fullName],
    [sampleCVData.professionalTitle, data.professionalTitle],
    [sampleCVData.email, data.email],
    [sampleCVData.phone, data.phone],
    [sampleCVData.address, data.address],
    [sampleCVData.linkedIn, data.linkedIn],
    [sampleCVData.portfolio, data.portfolio],
    [sampleCVData.summary, data.summary || data.objective || ''],
    [sampleCVData.education[0].degree, data.education[0]?.degree || ''],
    [sampleCVData.education[0].institute, data.education[0]?.institute || ''],
    [sampleCVData.education[0].subject, data.education[0]?.subject || ''],
    [sampleCVData.education[0].result, data.education[0]?.result || ''],
    [sampleCVData.internships[0].internshipTitle, data.internships?.[0]?.internshipTitle || ''],
    [sampleCVData.internships[0].organizationName, data.internships?.[0]?.organizationName || ''],
    [sampleCVData.internships[0].duration, data.internships?.[0]?.duration || ''],
    [sampleCVData.internships[0].department, data.internships?.[0]?.department || ''],
    [sampleCVData.internships[0].responsibilities, data.internships?.[0]?.responsibilities || ''],
    [sampleCVData.internships[0].learningOutcome, data.internships?.[0]?.learningOutcome || ''],
    [sampleCVData.experience[0].jobTitle, data.experience[0]?.jobTitle || ''],
    [sampleCVData.experience[0].company, data.experience[0]?.company || ''],
    [sampleCVData.experience[0].location, data.experience[0]?.location || ''],
    [sampleCVData.projects[0].title, data.projects[0]?.title || ''],
    [sampleCVData.projects[0].projectType || '', data.projects[0]?.projectType || ''],
    [sampleCVData.projects[0].role || '', data.projects[0]?.role || ''],
    [sampleCVData.projects[0].description, data.projects[0]?.description || ''],
    [sampleCVData.projects[0].technologies, data.projects[0]?.technologies || ''],
    [sampleCVData.projects[0].url, data.projects[0]?.url || ''],
    [sampleCVData.training[0].trainingName, data.training?.[0]?.trainingName || ''],
    [sampleCVData.training[0].institute, data.training?.[0]?.institute || ''],
    [sampleCVData.training[0].duration, data.training?.[0]?.duration || ''],
    [sampleCVData.training[0].completionDate, data.training?.[0]?.completionDate || ''],
    [sampleCVData.training[0].topicsCovered || '', data.training?.[0]?.topicsCovered || data.training?.[0]?.description || ''],
    [sampleCVData.certifications[0].name, data.certifications[0]?.name || ''],
    [sampleCVData.certifications[0].organization, data.certifications[0]?.organization || ''],
    [sampleCVData.certifications[0].year, data.certifications[0]?.year || ''],
    [sampleCVData.certifications[0].credentialLink, data.certifications[0]?.credentialLink || ''],
    [sampleCVData.extracurricularActivities[0].activityTitle, data.extracurricularActivities?.[0]?.activityTitle || ''],
    [sampleCVData.extracurricularActivities[0].organization, data.extracurricularActivities?.[0]?.organization || ''],
    [sampleCVData.extracurricularActivities[0].role, data.extracurricularActivities?.[0]?.role || ''],
    [sampleCVData.extracurricularActivities[0].contribution, data.extracurricularActivities?.[0]?.contribution || ''],
    [sampleCVData.achievements[0].achievementTitle, data.achievements?.[0]?.achievementTitle || ''],
    [sampleCVData.achievements[0].awardingOrganization, data.achievements?.[0]?.awardingOrganization || ''],
    [sampleCVData.achievements[0].description, data.achievements?.[0]?.description || ''],
    [sampleCVData.languages[0].language, data.languages[0]?.language || ''],
    [sampleCVData.languages[0].proficiency, data.languages[0]?.proficiency || ''],
  ];
  sampleFallbacks.forEach(([sampleValue, realValue]) => {
    if (sampleValue && realValue) html = replaceAllText(html, sampleValue, escapeHtml(realValue));
  });
  html = cleanupEmptySeparators(removeEmptySections(bindKnownFields(html, data, config)));
  html = appendMissingLivePlaceholders(html, data, placeholders, config);
  const css = sanitizeCss(config.css || '');
  const primaryColor = config.theme?.primaryColor || '#2563eb';
  const textColor = config.theme?.textColor || '#111827';
  const headingColor = config.theme?.headingColor || '#1d4ed8';
  const personalColor = config.personalInfo?.color || textColor;
  const personalAlign = config.personalInfo?.alignment || 'left';
  const photoFloat = config.photo?.placement || 'right';
  const photoRadius = getPhotoBorderRadius(data.photoShape);
  const photoPosition = `${data.photoPositionX ?? 50}% ${data.photoPositionY ?? 50}%`;
  const photoScale = (data.photoZoom ?? 100) / 100;

  return sanitizeHtml(`
    <style>
      .html-template-root{--cv-primary:${primaryColor};--cv-text:${textColor};--cv-heading:${headingColor};--cv-personal-color:${personalColor};--cv-personal-align:${personalAlign};display:block;width:100%;min-height:1123px;margin:0;padding:0;position:relative;font-family:Arial,sans-serif;color:var(--cv-text);background:#fff;}
      .html-template-root *{box-sizing:border-box;}
      .html-template-root > :first-child{margin-top:0!important;}
      .html-template-root img{max-width:100%;object-fit:cover;object-position:${photoPosition};float:${photoFloat};}
      .html-template-root img[src*="appwrite"],.html-template-root img[src^="blob:"],.html-template-root img[src^="data:"],.html-template-root img[src*="unsplash"]{width:100%;height:100%;max-width:none;display:block;object-fit:cover;object-position:${photoPosition};transform:scale(${photoScale});}
      .html-template-root [data-field="photo"],.html-template-root .photo,.html-template-root .profile-photo,.html-template-root .cv-photo{overflow:hidden;border-radius:${photoRadius};}
      .html-template-root [data-field="photo"] img,.html-template-root img[data-field="photo"],.html-template-root .photo img,.html-template-root .profile-photo img,.html-template-root .cv-photo img{display:block;width:100%;height:100%;max-width:none;object-fit:cover;object-position:${photoPosition};transform:scale(${photoScale});}
      .html-template-root h1{color:var(--cv-personal-color);}
      .html-template-root h2{color:var(--cv-heading);}
      .html-template-root section{margin-bottom:23px;}
      .html-template-root .cv-entry{break-inside:avoid;}
      .html-template-root .cv-entry-head{display:flex;justify-content:space-between;gap:16px;}
      .html-template-root .cv-entry-meta{display:flex;justify-content:space-between;gap:16px;}
      .html-template-root .cv-skill-pill{display:inline-flex;align-items:center;min-height:22px;margin:0 8px 8px 0;border-radius:999px;background:#eff6ff;padding:4px 12px;color:#1d4ed8;font-size:12px;font-weight:700;line-height:1;}
      ${css}
      .html-template-root .cv-live-placeholder-sections,.html-template-root .cv-live-placeholder-sections *{display:revert!important;visibility:visible!important;opacity:1!important;}
      .html-template-root .cv-live-placeholder-sections{display:block!important;clear:both!important;}
      .html-template-root .cv-live-placeholder-sections section{display:block!important;margin-bottom:23px!important;}
      .html-template-root .cv-live-placeholder-sections .cv-generated-entry{display:block!important;margin:0 0 12px 0!important;}
      .html-template-root .cv-live-placeholder-sections .cv-entry-head{display:flex!important;justify-content:space-between!important;gap:16px!important;}
      .html-template-root .cv-live-placeholder-sections .cv-entry-meta{display:flex!important;justify-content:space-between!important;gap:16px!important;}
      .html-template-root .cv-bullet-list{margin:8px 0 0 0!important;padding:0!important;list-style:none!important;}
      .html-template-root .cv-bullet-list li{display:flex!important;gap:7px!important;align-items:flex-start!important;margin:3px 0!important;padding:0!important;list-style:none!important;}
      .html-template-root .cv-bullet-list li::before{content:"•"!important;display:inline-block!important;flex:0 0 auto!important;color:currentColor!important;font-weight:700!important;line-height:inherit!important;}
      .html-template-root .cv-bullet-list li span{display:inline!important;flex:1 1 auto!important;}
    </style>
    <div class="html-template-root">${html}</div>
  `);
};

const DefaultTemplate = ({ data, previewId }: { data: CVData; previewId?: string }) => {
  const cleanSkills = (data.skills || []).filter((skill) => skill.name.trim());
  const cleanEducation = (data.education || []).filter((item) => item.degree || item.institute).toReversed();
  const cleanInternships = (data.internships || []).filter(hasInternshipData).toReversed();
  const cleanExperience = (data.experience || []).filter((item) => item.jobTitle || item.company).toReversed();
  const cleanProjects = (data.projects || []).filter((item) => item.title || item.projectType || item.role || item.description).toReversed();
  const cleanTraining = (data.training || []).filter((item) => item.trainingName || item.institute || item.topicsCovered || item.description).toReversed();
  const cleanCertifications = (data.certifications || []).filter((item) => item.name || item.organization).toReversed();
  const cleanActivities = (data.extracurricularActivities || []).filter((item) => item.activityTitle || item.organization || item.contribution).toReversed();
  const cleanAchievements = (data.achievements || []).filter((item) => item.achievementTitle || item.awardingOrganization || item.description).toReversed();
  const cleanLanguages = (data.languages || []).filter((item) => item.language).toReversed();
  const cleanReferences = (data.references || []).filter((item) => item.name || item.organization).toReversed();

  return (
    <article id={previewId} className="cv-a4-page cv-export-safe mx-auto bg-white p-10 text-gray-950 shadow-2xl shadow-blue-900/10 print:shadow-none">
      <header className="flex gap-6 border-b-4 border-blue-600 pb-6">
        {data.photoUrl && (
          <div className={`h-28 w-28 shrink-0 overflow-hidden ${getPhotoShapeClass(data.photoShape)} ring-2 ring-blue-100`}>
            <img src={data.photoUrl} alt={data.fullName || 'Profile'} crossOrigin="anonymous" referrerPolicy="no-referrer" className="h-full w-full object-cover" style={getPhotoStyle(data)} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-4xl font-black leading-tight">{data.fullName || 'Your Name'}</h1>
          <p className="text-xl font-bold text-blue-700">{data.professionalTitle || 'Professional Title'}</p>
          <p className="mt-3 text-sm font-medium text-gray-600">{[data.email, data.phone, data.address].filter(Boolean).join(' | ')}</p>
          <p className="mt-1 text-sm font-medium text-gray-500">{[data.linkedIn, data.portfolio].filter(Boolean).join(' | ')}</p>
        </div>
      </header>
      <div className="space-y-7 py-10">
        <main className="space-y-7">
          {(data.summary || data.objective) && <section><h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Professional Summary</h2>{data.summary && <p className="text-sm leading-relaxed text-gray-700">{data.summary}</p>}</section>}
          {cleanEducation.length > 0 && <section><h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Education</h2>{cleanEducation.map((item, index) => <div key={index} className="mb-4 break-inside-avoid"><div className="flex items-start justify-between gap-4"><p className="font-bold">{item.degree || 'Degree'}{item.subject ? ` in ${item.subject}` : ''}</p><p className="shrink-0 text-right text-xs font-bold text-gray-500">{[item.startYear, item.currentlyStudying ? 'Present' : item.passingYear].filter(Boolean).join(' - ')}</p></div>{item.institute && <p className="mt-1 text-sm text-gray-700">{item.institute}</p>}{item.result && <p className="mt-1 text-sm text-gray-700">CGPA: {item.result}</p>}</div>)}</section>}
          {cleanInternships.length > 0 && <section><h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Internship</h2>{cleanInternships.map((item, index) => <div key={index} className="mb-4 break-inside-avoid"><div className="flex items-start justify-between gap-4"><p className="font-bold">{item.internshipTitle || 'Internship Title'}</p>{item.duration && <p className="shrink-0 text-right text-sm font-bold text-gray-500">{item.duration}</p>}</div><div className="mt-1 flex items-start justify-between gap-4">{item.organizationName && <p className="text-sm italic text-gray-700">{item.organizationName}</p>}{item.department && <p className="shrink-0 text-right text-sm italic text-gray-600">{item.department}</p>}</div>{item.responsibilities && <ul className="mt-2 space-y-1 text-sm leading-relaxed text-gray-700">{linesToBullets(item.responsibilities).map((line, bulletIndex) => <li key={bulletIndex} className="flex gap-2"><span className="shrink-0 text-gray-700">•</span><span>{line}</span></li>)}</ul>}{item.learningOutcome && <p className="mt-2 text-sm leading-relaxed text-gray-700"><strong>Learning/Outcome:</strong> {item.learningOutcome}</p>}</div>)}</section>}
          {cleanExperience.length > 0 && <section><h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Experience</h2>{cleanExperience.map((item, index) => <div key={index} className="mb-4 break-inside-avoid"><div className="flex items-start justify-between gap-4"><p className="font-bold">{item.jobTitle || 'Job Title'}</p><p className="shrink-0 text-right text-sm font-bold text-gray-500">{[item.startDate, item.currentlyWorking ? 'Present' : item.endDate].filter(Boolean).join(' - ')}</p></div><div className="mt-1 flex items-start justify-between gap-4">{item.company && <p className="text-sm italic text-gray-700">{item.company}</p>}{item.location && <p className="shrink-0 text-right text-sm italic text-gray-600">{item.location}</p>}</div>{item.responsibilities && <ul className="mt-2 space-y-1 text-sm leading-relaxed text-gray-700">{linesToBullets(item.responsibilities).map((line, bulletIndex) => <li key={bulletIndex} className="flex gap-2"><span className="shrink-0 text-gray-700">•</span><span>{line}</span></li>)}</ul>}</div>)}</section>}
          {cleanSkills.length > 0 && <section><h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Skills</h2><div className="flex flex-wrap gap-2">{cleanSkills.map((skill, index) => <span key={`${skill.name}-${index}`} className="cv-skill-pill inline-flex min-h-[22px] items-center rounded-full bg-blue-50 px-3 py-1 align-middle text-xs font-bold leading-none text-blue-700"><span className="cv-skill-pill-text">{skill.name}</span></span>)}</div></section>}
          {cleanProjects.length > 0 && <section><h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Projects</h2>{cleanProjects.map((item, index) => <div key={index} className="mb-4 break-inside-avoid"><p className="font-bold">{item.title || 'Project Name'}</p>{[item.projectType, item.role].filter(Boolean).length > 0 && <p className="mt-1 text-sm italic text-gray-700">{[item.projectType, item.role].filter(Boolean).join(' | ')}</p>}{item.technologies && <p className="mt-1 text-sm text-gray-700">Tools/Technologies Used: {commaList(item.technologies)}</p>}{item.url && <p className="mt-1 text-xs font-bold text-gray-500">Project Link: {item.url}</p>}{item.description && <ul className="mt-2 space-y-1 text-sm leading-relaxed text-gray-700">{linesToBullets(item.description).map((line, bulletIndex) => <li key={bulletIndex} className="flex gap-2"><span className="shrink-0 text-gray-700">•</span><span>{line}</span></li>)}</ul>}</div>)}</section>}
          {cleanTraining.length > 0 && <section><h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Professional Training</h2>{cleanTraining.map((item, index) => <div key={index} className="mb-4 break-inside-avoid"><div className="flex items-start justify-between gap-4"><p className="font-bold">{item.trainingName || 'Training Name'}</p>{item.completionDate && <p className="shrink-0 text-right text-sm font-bold text-gray-500">{item.completionDate}</p>}</div><div className="mt-1 flex items-start justify-between gap-4">{item.institute && <p className="text-sm italic text-gray-700"><strong>Institute:</strong> {item.institute}</p>}{item.duration && <p className="shrink-0 text-right text-sm italic text-gray-600">{item.duration}</p>}</div>{(item.topicsCovered || item.description) && <p className="mt-2 text-sm leading-relaxed text-gray-700"><strong>Topics Covered:</strong> {topicsToText(item.topicsCovered || item.description)}</p>}</div>)}</section>}
          {cleanCertifications.length > 0 && <section><h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Certifications</h2>{cleanCertifications.map((item, index) => <div key={index} className="mb-4 break-inside-avoid text-sm"><div className="flex items-start justify-between gap-4"><p className="font-bold">{item.name}</p>{item.year && <p className="shrink-0 text-right text-xs font-bold text-gray-500">{item.year}</p>}</div>{item.organization && <p className="mt-1 text-gray-700">{item.organization}</p>}{item.credentialLink && <p className="mt-1 text-xs font-semibold text-gray-500">Credential URL: {item.credentialLink}</p>}</div>)}</section>}
          {cleanActivities.length > 0 && <section><h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Extra-Curricular Activities</h2>{cleanActivities.map((item, index) => <div key={index} className="mb-4 break-inside-avoid text-sm"><div className="flex items-start justify-between gap-4"><p className="font-bold">{item.activityTitle || 'Activity Title'}</p><p className="shrink-0 text-right text-xs font-bold text-gray-500">{[item.startDate, item.currentlyWorking ? 'Present' : item.endDate].filter(Boolean).join(' - ')}</p></div>{(item.organization || item.role) && <div className="mt-1 flex items-start justify-between gap-4 text-gray-700">{item.organization && <p>{item.organization}</p>}{item.role && <p className="shrink-0 text-right"><strong>Role:</strong> {item.role}</p>}</div>}{item.contribution && <ul className="mt-2 space-y-1 leading-relaxed text-gray-700">{linesToBullets(item.contribution).map((line, bulletIndex) => <li key={bulletIndex} className="flex gap-2"><span className="shrink-0 text-gray-700">•</span><span>{line}</span></li>)}</ul>}</div>)}</section>}
          {cleanAchievements.length > 0 && <section><h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Achievements</h2>{cleanAchievements.map((item, index) => <div key={index} className="mb-4 break-inside-avoid text-sm"><div className="flex items-start justify-between gap-4"><p className="font-bold">{item.achievementTitle || 'Achievement Title'}</p>{item.dateYear && <p className="shrink-0 text-right text-xs font-bold text-gray-500">{item.dateYear}</p>}</div>{item.awardingOrganization && <p className="mt-1 text-gray-700"><strong>Awarding Organization:</strong> {item.awardingOrganization}</p>}{item.description && <p className="mt-2 leading-relaxed text-gray-700">{item.description}</p>}</div>)}</section>}
          {cleanLanguages.length > 0 && <section><h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Languages</h2>{cleanLanguages.map((item, index) => <p key={index} className="text-sm text-gray-700">{item.language} - {item.proficiency}</p>)}</section>}
          {data.referencesMode === 'details' && cleanReferences.length > 0 && <section><h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">References</h2>{cleanReferences.map((item, index) => <div key={index} className="mb-3 text-sm"><p className="font-bold">{item.name}</p><p className="text-gray-600">{[item.designation, item.organization].filter(Boolean).join(' | ')}</p><p className="text-gray-500">{[item.email, item.phone].filter(Boolean).join(' | ')}</p></div>)}</section>}
        </main>
      </div>
    </article>
  );
};

const TemplateRenderer = ({ data, template, previewId }: { data: CVData; template?: TemplateDoc | null; previewId?: string }) => {
  const renderKey = `${template?.$id || 'default'}-${JSON.stringify(data)}`;
  if (template && isHtmlTemplate(template)) {
    return (
      <article
        key={renderKey}
        id={previewId}
        className="cv-a4-page cv-export-safe mx-auto overflow-x-hidden bg-white text-gray-950 shadow-2xl shadow-blue-900/10 print:shadow-none"
        dangerouslySetInnerHTML={{ __html: renderHtmlTemplate(data, template) }}
      />
    );
  }

  return <DefaultTemplate data={data} previewId={previewId} />;
};

export default TemplateRenderer;
