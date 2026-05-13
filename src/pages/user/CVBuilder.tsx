import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Circle, Crown, Download, Eye, Plus, Save, Sparkles, Square, Trash2, Upload, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import UserLayout from './UserLayout';
import { authService } from '../../services/authService';
import { cvService, type CVData, type TemplateDoc } from '../../services/cvService';
import { showToast } from '../../lib/toast';
import TemplateRenderer from '../../components/cv/TemplateRenderer';
import { isHtmlTemplate, parseTemplateConfig, type TemplateFieldConfig, type TemplateFieldSectionConfig } from '../../lib/templateConfig';
import { useConfirm } from '../../components/ui/useConfirm';
import { suggestCVContent, type AiSuggestionField } from '../../services/aiService';
import { revenueService } from '../../services/revenueService';

const steps = ['Personal Info', 'Profile Photo', 'Summary', 'Education', 'Internship', 'Experience', 'Skills', 'Projects', 'Professional Training', 'Certifications', 'Extra-Curricular Activities', 'Achievements', 'Languages', 'References', 'Review & Download'];
type BuilderStepItem = { label: string; baseIndex?: number; custom?: boolean; review?: boolean };
const standardStepItems: BuilderStepItem[] = steps.slice(0, -1).map((label, baseIndex) => ({ label, baseIndex }));
const languageLevels: CVData['languages'][number]['proficiency'][] = ['Basic', 'Conversational', 'Fluent', 'Native'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const currentDate = new Date();
const currentMonthYear = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
const currentYear = String(currentDate.getFullYear());

const emptyData: CVData = {
  title: '',
  fullName: '',
  professionalTitle: '',
  email: '',
  phone: '',
  address: '',
  linkedIn: '',
  portfolio: '',
  photoUrl: '',
  photoShape: 'rounded',
  photoZoom: 100,
  photoPositionX: 50,
  photoPositionY: 50,
  objective: '',
  summary: '',
  education: [{ degree: '', institute: '', subject: '', result: '', startYear: currentMonthYear, passingYear: currentMonthYear, currentlyStudying: false }],
  internships: [],
  experience: [{ jobTitle: '', company: '', location: '', startDate: currentMonthYear, endDate: currentMonthYear, currentlyWorking: false, responsibilities: '' }],
  skills: [],
  projects: [],
  training: [],
  certifications: [],
  extracurricularActivities: [],
  achievements: [],
  languages: [],
  referencesMode: 'available',
  references: [],
  customData: {},
};

const inputClass = 'w-full rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm font-medium text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:text-base';
const labelClass = 'mb-2 block text-sm font-extrabold uppercase tracking-widest text-gray-700 sm:text-xs';
const cardClass = 'rounded-xl border border-blue-100 bg-blue-50/40 p-3';
const photoShapeOptions = [
  { value: 'square', label: 'Square', icon: Square },
  { value: 'circle', label: 'Circle', icon: Circle },
  { value: 'rounded', label: 'Rounded', icon: Square },
] as const;

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidUrl = (url: string) => !url || /^https?:\/\/.+\..+/.test(url);
const linesToBullets = (value?: string) => (value || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const commaList = (value?: string) => (value || '').split(/[\n,]+/).map((item) => item.trim()).filter(Boolean).join(', ');
const skillsToText = (skills: CVData['skills']) => skills.map((skill) => skill.name).filter(Boolean).join('\n');
const textToSkills = (value: string) => value.split(/[\n,]+/).map((name) => name.trim()).filter(Boolean).map((name) => ({ name }));
const topicsToText = (value?: string) => (value || '').split(/[\n,]+/).map((item) => item.trim()).filter(Boolean).join(', ');
const getPhotoShapeClass = (shape?: CVData['photoShape']) => {
  if (shape === 'circle') return 'rounded-full';
  if (shape === 'square') return 'rounded-none';
  return 'rounded-xl';
};
const getPhotoStyle = (data: CVData) => ({
  objectPosition: `${data.photoPositionX ?? 50}% ${data.photoPositionY ?? 50}%`,
  transform: `scale(${(data.photoZoom ?? 100) / 100})`,
});
const splitMonthYear = (value?: string) => {
  if (!value) return { month: monthNames[currentDate.getMonth()], year: currentYear };
  const match = value.match(/^([A-Za-z]+)(?:\s+(\d{0,4}))?/);
  const month = match?.[1] || monthNames[currentDate.getMonth()];
  const year = match?.[2] ?? '';
  return {
    month: monthNames.includes(month) ? month : monthNames[currentDate.getMonth()],
    year: /^\d{0,4}$/.test(year) ? year : currentYear,
  };
};
const joinMonthYear = (month: string, year: string) => `${month} ${year}`;

const getRequiredWarnings = (data: CVData) => {
  const warnings: string[] = [];
  if (!data.fullName.trim()) warnings.push('Full name is required.');
  if (!isValidEmail(data.email)) warnings.push('Valid email is required.');
  if (!data.phone.trim()) warnings.push('Phone is required.');
  if (!data.summary.trim() && !data.objective?.trim()) warnings.push('Summary or career objective is required.');
  if (!data.education.some((item) => item.degree || item.institute) && !data.internships?.some((item) => item.internshipTitle || item.organizationName) && !data.experience.some((item) => item.jobTitle || item.company)) warnings.push('At least one education, internship, or experience item is required.');
  if (data.skills.filter((skill) => skill.name.trim()).length < 3) warnings.push('At least 3 skills are recommended.');
  if (!isValidUrl(data.linkedIn)) warnings.push('LinkedIn URL should start with http:// or https://.');
  if (!isValidUrl(data.portfolio)) warnings.push('Portfolio URL should start with http:// or https://.');
  return warnings;
};

const A4Preview = ({ data, template, previewId = 'cv-a4-preview' }: { data: CVData; template?: TemplateDoc | null; previewId?: string }) => {
  if (template && isHtmlTemplate(template)) return <TemplateRenderer data={data} template={template} previewId={previewId} />;

  const cleanSkills = data.skills.filter((skill) => skill.name.trim());
  const cleanEducation = data.education.filter((item) => item.degree || item.institute).toReversed();
  const cleanInternships = (data.internships || []).filter((item) => item.internshipTitle || item.organizationName).toReversed();
  const cleanExperience = data.experience.filter((item) => item.jobTitle || item.company).toReversed();
  const cleanProjects = data.projects.filter((item) => item.title || item.projectType || item.role || item.description).toReversed();
  const cleanTraining = (data.training || []).filter((item) => item.trainingName || item.institute || item.topicsCovered || item.description).toReversed();
  const cleanCertifications = data.certifications.filter((item) => item.name || item.organization).toReversed();
  const cleanActivities = (data.extracurricularActivities || []).filter((item) => item.activityTitle || item.organization || item.contribution).toReversed();
  const cleanAchievements = (data.achievements || []).filter((item) => item.achievementTitle || item.awardingOrganization || item.description).toReversed();
  const cleanLanguages = data.languages.filter((item) => item.language).toReversed();
  const cleanReferences = data.references.filter((item) => item.name || item.organization).toReversed();

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
          {(data.summary || data.objective) && (
            <section>
              <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Professional Summary</h2>
              {data.objective && <p className="mb-2 text-sm leading-relaxed text-gray-700">{data.objective}</p>}
              {data.summary && <p className="text-sm leading-relaxed text-gray-700">{data.summary}</p>}
            </section>
          )}

          {cleanEducation.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Education</h2>
              {cleanEducation.map((item, index) => (
                <div key={index} className="mb-4 break-inside-avoid">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-bold">{item.degree || 'Degree'}{item.subject ? ` in ${item.subject}` : ''}</p>
                    <p className="shrink-0 text-right text-xs font-bold text-gray-500">{[item.startYear, item.currentlyStudying ? 'Present' : item.passingYear].filter(Boolean).join(' - ')}</p>
                  </div>
                  {item.institute && <p className="mt-1 text-sm text-gray-700">{item.institute}</p>}
                  {item.result && <p className="mt-1 text-sm text-gray-700">CGPA: {item.result}</p>}
                </div>
              ))}
            </section>
          )}

          {cleanInternships.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Internship</h2>
              {cleanInternships.map((item, index) => (
                <div key={index} className="mb-4 break-inside-avoid">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-bold">{item.internshipTitle || 'Internship Title'}</p>
                    {item.duration && <p className="shrink-0 text-right text-sm font-bold text-gray-500">{item.duration}</p>}
                  </div>
                  <div className="mt-1 flex items-start justify-between gap-4">
                    {item.organizationName && <p className="text-sm italic text-gray-700">{item.organizationName}</p>}
                    {item.department && <p className="shrink-0 text-right text-sm italic text-gray-600">{item.department}</p>}
                  </div>
                  {item.responsibilities && (
                    <ul className="mt-2 space-y-1 text-sm leading-relaxed text-gray-700">
                      {linesToBullets(item.responsibilities).map((line, bulletIndex) => (
                        <li key={bulletIndex} className="flex gap-2">
                          <span className="shrink-0 text-gray-700">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {item.learningOutcome && <p className="mt-2 text-sm leading-relaxed text-gray-700"><strong>Learning/Outcome:</strong> {item.learningOutcome}</p>}
                </div>
              ))}
            </section>
          )}

          {cleanExperience.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Experience</h2>
              {cleanExperience.map((item, index) => (
                <div key={index} className="mb-4 break-inside-avoid">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-bold">{item.jobTitle || 'Job Title'}</p>
                    <p className="shrink-0 text-right text-sm font-bold text-gray-500">{[item.startDate, item.currentlyWorking ? 'Present' : item.endDate].filter(Boolean).join(' - ')}</p>
                  </div>
                  <div className="mt-1 flex items-start justify-between gap-4">
                    {item.company && <p className="text-sm italic text-gray-700">{item.company}</p>}
                    {item.location && <p className="shrink-0 text-right text-sm italic text-gray-600">{item.location}</p>}
                  </div>
                  {item.responsibilities && (
                    <ul className="mt-2 space-y-1 text-sm leading-relaxed text-gray-700">
                      {linesToBullets(item.responsibilities).map((line, bulletIndex) => (
                        <li key={bulletIndex} className="flex gap-2">
                          <span className="shrink-0 text-gray-700">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}

          {cleanSkills.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {cleanSkills.map((skill, index) => (
                  <span key={`${skill.name}-${index}`} className="cv-skill-pill inline-flex min-h-[22px] items-center rounded-full bg-blue-50 px-3 py-1 align-middle text-xs font-bold leading-none text-blue-700">
                    <span className="cv-skill-pill-text">{skill.name}</span>
                  </span>
                ))}
              </div>
            </section>
          )}

          {cleanProjects.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Projects</h2>
              {cleanProjects.map((item, index) => (
                <div key={index} className="mb-4 break-inside-avoid">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-bold">{item.title || 'Project'}</p>
                  </div>
                  {[item.projectType, item.role].filter(Boolean).length > 0 && <p className="mt-1 text-sm italic text-gray-700">{[item.projectType, item.role].filter(Boolean).join(' | ')}</p>}
                  {item.technologies && <p className="mt-1 text-sm text-gray-700">Tools/Technologies Used: {commaList(item.technologies)}</p>}
                  {item.url && <p className="mt-1 text-xs font-bold text-gray-500">Project Link: {item.url}</p>}
                  {item.description && (
                    <ul className="mt-2 space-y-1 text-sm leading-relaxed text-gray-700">
                      {linesToBullets(item.description).map((line, bulletIndex) => (
                        <li key={bulletIndex} className="flex gap-2">
                          <span className="shrink-0 text-gray-700">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}

          {cleanTraining.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Professional Training</h2>
              {cleanTraining.map((item, index) => (
                <div key={index} className="mb-4 break-inside-avoid">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-bold">{item.trainingName || 'Training Name'}</p>
                    {item.completionDate && <p className="shrink-0 text-right text-sm font-bold text-gray-500">{item.completionDate}</p>}
                  </div>
                  <div className="mt-1 flex items-start justify-between gap-4">
                    {item.institute && <p className="text-sm italic text-gray-700"><strong>Institute:</strong> {item.institute}</p>}
                    {item.duration && <p className="shrink-0 text-right text-sm italic text-gray-600">{item.duration}</p>}
                  </div>
                  {(item.topicsCovered || item.description) && <p className="mt-2 text-sm leading-relaxed text-gray-700"><strong>Topics Covered:</strong> {topicsToText(item.topicsCovered || item.description)}</p>}
                </div>
              ))}
            </section>
          )}
          {cleanCertifications.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Certifications</h2>
              {cleanCertifications.map((item, index) => (
                <div key={index} className="mb-4 break-inside-avoid text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-bold">{item.name}</p>
                    {item.year && <p className="shrink-0 text-right text-xs font-bold text-gray-500">{item.year}</p>}
                  </div>
                  {item.organization && <p className="mt-1 text-gray-700">{item.organization}</p>}
                  {item.credentialLink && <p className="mt-1 text-xs font-semibold text-gray-500">Credential URL: {item.credentialLink}</p>}
                </div>
              ))}
            </section>
          )}

          {cleanActivities.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Extra-Curricular Activities</h2>
              {cleanActivities.map((item, index) => (
                <div key={index} className="mb-4 break-inside-avoid text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-bold">{item.activityTitle || 'Activity Title'}</p>
                    <p className="shrink-0 text-right text-xs font-bold text-gray-500">{[item.startDate, item.currentlyWorking ? 'Present' : item.endDate].filter(Boolean).join(' - ')}</p>
                  </div>
                  {(item.organization || item.role) && (
                    <div className="mt-1 flex items-start justify-between gap-4 text-gray-700">
                      {item.organization && <p>{item.organization}</p>}
                      {item.role && <p className="shrink-0 text-right"><strong>Role:</strong> {item.role}</p>}
                    </div>
                  )}
                  {item.contribution && (
                    <ul className="mt-2 space-y-1 leading-relaxed text-gray-700">
                      {linesToBullets(item.contribution).map((line, bulletIndex) => (
                        <li key={bulletIndex} className="flex gap-2">
                          <span className="shrink-0 text-gray-700">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}

          {cleanAchievements.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Achievements</h2>
              {cleanAchievements.map((item, index) => (
                <div key={index} className="mb-4 break-inside-avoid text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-bold">{item.achievementTitle || 'Achievement Title'}</p>
                    {item.dateYear && <p className="shrink-0 text-right text-xs font-bold text-gray-500">{item.dateYear}</p>}
                  </div>
                  {item.awardingOrganization && <p className="mt-1 text-gray-700"><strong>Awarding Organization:</strong> {item.awardingOrganization}</p>}
                  {item.description && <p className="mt-2 leading-relaxed text-gray-700">{item.description}</p>}
                </div>
              ))}
            </section>
          )}

          {cleanLanguages.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Languages</h2>
              {cleanLanguages.map((item, index) => <p key={index} className="text-sm text-gray-700">{item.language} - {item.proficiency}</p>)}
            </section>
          )}

          {data.referencesMode === 'details' && cleanReferences.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">References</h2>
              {cleanReferences.map((item, index) => (
                <div key={index} className="mb-3 text-sm">
                  <p className="font-bold">{item.name}</p>
                  <p className="text-gray-600">{[item.designation, item.organization].filter(Boolean).join(' | ')}</p>
                  <p className="text-gray-500">{[item.email, item.phone].filter(Boolean).join(' | ')}</p>
                </div>
              ))}
            </section>
          )}
        </main>
      </div>
    </article>
  );
};

const downloadBlob = (fileName: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const PDF_MARGIN_MM = 0;

const getPdfPageMetrics = (pdf: jsPDF) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const printableWidth = pageWidth - PDF_MARGIN_MM * 2;
  const printableHeight = pageHeight - PDF_MARGIN_MM * 2;

  return { pageWidth, pageHeight, printableWidth, printableHeight };
};

const getCanvasContentHeight = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return canvas.height;

  const rowHasContent = (y: number) => {
    const row = context.getImageData(0, y, canvas.width, 1).data;
    for (let x = 0; x < row.length; x += 16) {
      if (row[x + 3] > 0 && (row[x] < 248 || row[x + 1] < 248 || row[x + 2] < 248)) return true;
    }
    return false;
  };

  for (let y = canvas.height - 1; y >= 0; y -= 2) {
    if (rowHasContent(y)) return Math.min(canvas.height, y + 18);
  }

  return canvas.height;
};

const preventSectionOrphans = (root: HTMLElement, pagePixelHeight: number) => {
  const minKeepWithTitle = 180;
  const pagePadding = 18;

  for (let pass = 0; pass < 8; pass += 1) {
    let changed = false;
    const rootTop = root.getBoundingClientRect().top;

    root.querySelectorAll<HTMLElement>('section, .cv-entry, .break-inside-avoid').forEach((block) => {
      block.style.breakInside = 'avoid';
      block.style.pageBreakInside = 'avoid';
    });

    root.querySelectorAll<HTMLElement>('h2, h3, .section-title, [data-section-title]').forEach((title) => {
      const section = title.closest<HTMLElement>('section') || title.parentElement;
      if (!section) return;

      const sectionRect = section.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      const sectionTop = sectionRect.top - rootTop;
      const sectionBottom = sectionRect.bottom - rootTop;
      const titleTop = titleRect.top - rootTop;
      const titleBottom = titleRect.bottom - rootTop;
      const pageBottom = (Math.floor(titleTop / pagePixelHeight) + 1) * pagePixelHeight;
      const sectionHeight = sectionBottom - sectionTop;
      const nextContent = Array.from(section.children).find((child) => child !== title) as HTMLElement | undefined;
      const nextContentTop = nextContent ? nextContent.getBoundingClientRect().top - rootTop : titleBottom;
      const headingIsOrphaned = pageBottom - titleBottom < minKeepWithTitle || nextContentTop >= pageBottom - pagePadding;

      if (sectionHeight >= pagePixelHeight * 0.85) return;
      if (sectionTop < pageBottom && (sectionBottom > pageBottom || headingIsOrphaned)) {
        const currentMargin = Number.parseFloat(section.style.marginTop || '0') || 0;
        section.style.marginTop = `${currentMargin + pageBottom - sectionTop + pagePadding}px`;
        changed = true;
      }
    });

    if (!changed) break;
  }
};

const preventPageBoundaryCuts = (root: HTMLElement, pagePixelHeight: number) => {
  const safeGap = 18;
  const selectors = [
    '.cv-entry',
    '.break-inside-avoid',
    'li',
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    '.cv-skill-pill',
    'img',
  ].join(',');

  for (let pass = 0; pass < 8; pass += 1) {
    let changed = false;
    const rootTop = root.getBoundingClientRect().top;

    root.querySelectorAll<HTMLElement>(selectors).forEach((element) => {
      const rect = element.getBoundingClientRect();
      const top = rect.top - rootTop;
      const bottom = rect.bottom - rootTop;
      const height = bottom - top;
      if (height <= 0 || height >= pagePixelHeight * 0.82) return;

      const boundary = Math.floor(top / pagePixelHeight + 1) * pagePixelHeight;
      if (top < boundary && bottom > boundary - safeGap) {
        const currentMargin = Number.parseFloat(element.style.marginTop || '0') || 0;
        element.style.marginTop = `${currentMargin + boundary - top + safeGap}px`;
        changed = true;
      }
    });

    if (!changed) break;
  }
};

const addCanvasPagesToPdf = (pdf: jsPDF, canvas: HTMLCanvasElement) => {
  const { printableWidth, printableHeight } = getPdfPageMetrics(pdf);
  const pagePixelHeight = (canvas.width * printableHeight) / printableWidth;
  const contentHeight = getCanvasContentHeight(canvas);
  const sourceContext = canvas.getContext('2d', { willReadFrequently: true });
  const findSafeCutY = (startY: number) => {
    const targetY = Math.min(contentHeight, Math.floor(startY + pagePixelHeight));
    if (targetY >= contentHeight) return contentHeight;
    if (!sourceContext) return targetY;

    const rowIsBlank = (y: number) => {
      const row = sourceContext.getImageData(0, y, canvas.width, 1).data;
      let whitePixels = 0;
      for (let x = 0; x < row.length; x += 4) {
        if (row[x] > 248 && row[x + 1] > 248 && row[x + 2] > 248) whitePixels += 1;
      }
      return whitePixels / canvas.width > 0.992;
    };

    const bandIsBlank = (y: number) => {
      for (let offset = -8; offset <= 8; offset += 2) {
        const rowY = y + offset;
        if (rowY <= startY || rowY >= contentHeight || !rowIsBlank(rowY)) return false;
      }
      return true;
    };

    const searchTop = Math.max(startY + Math.floor(pagePixelHeight * 0.55), targetY - 360);
    const searchBottom = Math.max(searchTop, targetY - 28);
    let bestY = Math.max(searchTop, targetY - 96);
    let bestScore = -1;

    for (let y = searchBottom; y >= searchTop; y -= 2) {
      if (bandIsBlank(y)) return y;
      const row = sourceContext.getImageData(0, y, canvas.width, 1).data;
      let whitePixels = 0;
      for (let x = 0; x < row.length; x += 4) {
        if (row[x] > 248 && row[x + 1] > 248 && row[x + 2] > 248) whitePixels += 1;
      }
      const score = whitePixels / canvas.width;
      if (score > bestScore) {
        bestScore = score;
        bestY = y;
      }
    }

    return bestScore > 0.985 ? bestY : Math.max(searchTop, targetY - 120);
  };

  let sourceY = 0;
  let pageIndex = 0;

  while (sourceY < contentHeight - 1) {
    const cutY = findSafeCutY(sourceY);
    const sourceHeight = Math.max(1, Math.min(cutY - sourceY, contentHeight - sourceY));
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sourceHeight;

    const context = pageCanvas.getContext('2d');
    if (!context) continue;

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    context.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);

    if (pageIndex > 0) pdf.addPage();
    const renderedHeight = Math.min(printableHeight, (sourceHeight * printableWidth) / canvas.width);
    pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.82), 'JPEG', PDF_MARGIN_MM, PDF_MARGIN_MM, printableWidth, renderedHeight, undefined, 'FAST');
    sourceY += sourceHeight;
    pageIndex += 1;
  }
};

const exportPdf = async (data: CVData) => {
  const element = document.getElementById('cv-a4-preview-export') || document.getElementById('cv-a4-preview-modal') || document.getElementById('cv-a4-preview-live');
  if (!element) {
    showToast('Preview is not ready yet.', 'error');
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 1.5,
      useCORS: true,
      imageTimeout: 15000,
      logging: false,
      windowWidth: 794,
      windowHeight: Math.max(1123, element.scrollHeight),
      onclone: (clonedDocument) => {
        clonedDocument.body.classList.add('pdf-rendering');
        clonedDocument.documentElement.style.color = '#111827';
        clonedDocument.body.style.backgroundColor = '#ffffff';
        clonedDocument.body.style.color = '#111827';
        const clonedRoot = clonedDocument.getElementById(element.id);
        if (clonedRoot) {
          const pdf = new jsPDF('p', 'mm', 'a4');
          const { printableWidth, printableHeight } = getPdfPageMetrics(pdf);
          const pagePixelHeight = (794 * printableHeight) / printableWidth;
          preventSectionOrphans(clonedRoot, pagePixelHeight);
          preventPageBoundaryCuts(clonedRoot, pagePixelHeight);
        }
        clonedDocument.querySelectorAll('img').forEach((image) => {
          image.crossOrigin = 'anonymous';
          image.referrerPolicy = 'no-referrer';
        });
      },
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    addCanvasPagesToPdf(pdf, canvas);
    pdf.save(`${data.fullName || data.title || 'cv'}.pdf`);
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'PDF export failed. Please try again.', 'error');
  }
};

const exportDoc = (data: CVData) => {
  const source = document.getElementById('cv-a4-preview-export')?.outerHTML || document.getElementById('cv-a4-preview-modal')?.outerHTML || document.getElementById('cv-a4-preview-live')?.outerHTML || '';
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${data.title}</title><style>body{font-family:Arial,sans-serif;color:#111827}.bg-white{background:white}.text-blue-700{color:#1d4ed8}.font-black{font-weight:900}.font-bold{font-weight:700}.text-gray-700{color:#374151}.text-gray-600{color:#4b5563}.text-gray-500{color:#6b7280}.border-blue-600{border-color:#2563eb}.border-b-4{border-bottom:4px solid #2563eb}.rounded-full{border-radius:999px}.bg-blue-50{background:#eff6ff}.px-3{padding-left:12px;padding-right:12px}.py-1{padding-top:4px;padding-bottom:4px}</style></head><body>${source}</body></html>`;
  downloadBlob(`${data.fullName || data.title || 'cv'}.doc`, html, 'application/msword;charset=utf-8');
};
void exportDoc;

const CVBuilder = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const selectedTemplateId = searchParams.get('template');
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [data, setData] = useState<CVData>(emptyData);
  const [skillsDraft, setSkillsDraft] = useState(skillsToText(emptyData.skills));
  const [template, setTemplate] = useState<TemplateDoc | null>(null);
  const [cvId, setCvId] = useState<string | null>(id || null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [notice, setNotice] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [upgradePrompt, setUpgradePrompt] = useState('');
  const [aiLoadingKey, setAiLoadingKey] = useState<string | null>(null);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<Record<string, string>>({});
  const [autocompleteLoading, setAutocompleteLoading] = useState<Record<string, boolean>>({});
  const { confirm, ConfirmationDialog } = useConfirm();
  const loadedRef = useRef(false);
  const autosaveTimerRef = useRef<number | null>(null);

  const templateConfig = useMemo(() => parseTemplateConfig(template), [template]);
  const customSections = useMemo(
    () => (templateConfig.fieldSchema?.sections || []).filter((section) => section.id && section.label && section.fields?.length),
    [templateConfig],
  );
  const effectiveStepItems = useMemo(() => {
    return [
      ...standardStepItems,
      ...customSections.map<BuilderStepItem>((section) => ({ label: section.label, custom: true })),
      { label: 'Review & Download', review: true },
    ];
  }, [customSections]);
  const effectiveSteps = useMemo(() => effectiveStepItems.map((item) => item.label), [effectiveStepItems]);
  const activeStepItem = effectiveStepItems[step] || effectiveStepItems[0];
  const activeBaseStep = activeStepItem?.baseIndex;
  const warnings = useMemo(() => getRequiredWarnings(data), [data]);
  const completed = warnings.filter((warning) => !warning.includes('recommended') && !warning.includes('URL')).length === 0;
  const personalInfoWarnings = useMemo(() => {
    const nextWarnings: string[] = [];
    if (!data.fullName.trim()) nextWarnings.push('Full name is required.');
    if (!isValidEmail(data.email)) nextWarnings.push('Valid email is required.');
    if (!data.phone.trim()) nextWarnings.push('Phone is required.');
    return nextWarnings;
  }, [data.fullName, data.email, data.phone]);

  const setField = <K extends keyof CVData>(key: K, value: CVData[K]) => setData((current) => ({ ...current, [key]: value }));

  const requestAiSuggestion = async (options: {
    key: string;
    field: AiSuggestionField;
    currentValue?: string;
    instruction?: string;
    onApply: (value: string) => void;
  }) => {
    setAiLoadingKey(options.key);
    try {
      const result = await suggestCVContent({
        field: options.field,
        currentValue: options.currentValue,
        instruction: options.instruction,
        cvData: data,
      });
      const suggestion = result.suggestions[0]?.trim();
      if (!suggestion) throw new Error('No suggestion found.');
      options.onApply(suggestion);
      showToast(result.usedFallback ? 'Local suggestion added. Configure AI keys for live AI.' : `AI suggestion added via ${result.provider}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI suggestion failed.';
      if (message.toLowerCase().includes('upgrade') || message.toLowerCase().includes('limit')) setUpgradePrompt(message);
      showToast(message, 'error');
    } finally {
      setAiLoadingKey(null);
    }
  };

  const autocompleteTimeoutRef = useRef<number | null>(null);

  const requestAutocomplete = useCallback((key: string, field: AiSuggestionField, currentValue: string, instruction?: string) => {
    if (autocompleteTimeoutRef.current) {
      clearTimeout(autocompleteTimeoutRef.current);
    }
    if (!currentValue.trim() || currentValue.split(/\s+/).length < 3) {
      setAutocompleteSuggestions(prev => ({ ...prev, [key]: '' }));
      setAutocompleteLoading(prev => ({ ...prev, [key]: false }));
      return;
    }
    setAutocompleteLoading(prev => ({ ...prev, [key]: true }));
    autocompleteTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await suggestCVContent({
          field,
          action: 'continue',
          currentValue,
          instruction,
          cvData: data,
        });
        const suggestion = result.suggestions[0]?.trim();
        setAutocompleteSuggestions(prev => ({ ...prev, [key]: suggestion || '' }));
      } catch {
        setAutocompleteSuggestions(prev => ({ ...prev, [key]: '' }));
      } finally {
        setAutocompleteLoading(prev => ({ ...prev, [key]: false }));
      }
    }, 1200);
  }, [data]);

  const renderAiButton = (options: {
    buttonKey: string;
    field: AiSuggestionField;
    currentValue?: string;
    instruction?: string;
    onApply: (value: string) => void;
    label?: string;
  }) => (
    <button
      type="button"
      onClick={() => void requestAiSuggestion({
        key: options.buttonKey,
        field: options.field,
        currentValue: options.currentValue,
        instruction: options.instruction,
        onApply: options.onApply,
      })}
      disabled={aiLoadingKey === options.buttonKey}
      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white transition hover:bg-blue-700 disabled:opacity-60"
    >
      <Sparkles className="h-3.5 w-3.5" />
      {aiLoadingKey === options.buttonKey ? 'Suggesting...' : options.label || 'AI Suggest'}
    </button>
  );

  const renderTextareaWithAutocomplete = (options: {
    key: string;
    field: AiSuggestionField;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    instruction?: string;
    minHeight?: string;
  }) => {
    const suggestion = autocompleteSuggestions[options.key];
    const isLoading = autocompleteLoading[options.key];
    return (
      <div className="relative">
        <textarea
          className={options.className || `${inputClass} min-h-28 resize-y`}
          value={options.value}
          placeholder={options.placeholder}
          onChange={(event) => {
            options.onChange(event.target.value);
            requestAutocomplete(options.key, options.field, event.target.value, options.instruction);
          }}
        />
        {suggestion && (
          <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-green-700">Continue writing:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => options.onChange(options.value + (options.value.endsWith(' ') ? '' : ' ') + suggestion)}
                  className="rounded bg-green-600 px-2 py-1 text-xs font-bold text-white hover:bg-green-700"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => setAutocompleteSuggestions(prev => ({ ...prev, [options.key]: '' }))}
                  className="rounded bg-gray-500 px-2 py-1 text-xs font-bold text-white hover:bg-gray-600"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-green-800">{suggestion}</p>
          </div>
        )}
        {isLoading && (
          <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-sm font-medium text-blue-700">Generating suggestion...</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    setStep((current) => Math.min(current, effectiveSteps.length - 1));
  }, [effectiveSteps.length]);

  useEffect(() => {
    if (!customSections.length) return;
    setData((current) => {
      const nextCustomData = { ...(current.customData || {}) };
      let changed = false;
      customSections.forEach((section) => {
        if (!Array.isArray(nextCustomData[section.id])) {
          nextCustomData[section.id] = [Object.fromEntries(section.fields.map((field) => [field.name, '']))];
          changed = true;
        }
      });
      return changed ? { ...current, customData: nextCustomData } : current;
    });
  }, [customSections]);

  useEffect(() => {
    const load = async () => {
      try {
        if (selectedTemplateId && !id) {
          const user = await authService.getCurrentUser();
          if (user) {
            await cvService.cleanupExpiredDrafts(user.$id);
            const existingDraft = await cvService.findDraftByTemplate(user.$id, selectedTemplateId);
            if (existingDraft) {
              navigate(`/user/cv/${existingDraft.$id}/edit`, { replace: true });
              return;
            }
          }
        }
        if (selectedTemplateId) {
          const selectedTemplate = await cvService.getTemplate(selectedTemplateId);
          setTemplate(selectedTemplate);
          setData((current) => current.title ? current : { ...current, title: selectedTemplate.name });
        }
        if (id) {
          const cv = await cvService.getCV(id);
          setCvId(cv.$id);
          const parsed = cvService.parseCVData(cv);
          if (parsed) {
            const nextData = { ...emptyData, ...parsed };
            setData(nextData);
            setSkillsDraft(skillsToText(nextData.skills));
          }
          if (cv.template_id) {
            try {
              setTemplate(await cvService.getTemplate(cv.template_id));
            } catch {
              setTemplate(null);
            }
          }
        }
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to load CV.', 'error');
      } finally {
        loadedRef.current = true;
      }
    };
    void load();
  }, [id, selectedTemplateId]);

  const saveCV = async (status: 'Draft' | 'Completed', silent = false) => {
    setIsSaving(true);
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Please login again.');
      const saved = await cvService.saveCV(cvId, user.$id, template, data, status);
      setCvId(saved.$id);
      if (!silent) {
        setNotice(status === 'Completed' ? 'CV marked as complete.' : 'CV saved as draft.');
        showToast(status === 'Completed' ? 'CV marked as complete.' : 'CV saved as draft.');
        if (status === 'Completed') setPreviewOpen(true);
      }
      if (!id) navigate(`/user/cv/${saved.$id}/edit`, { replace: true });
    } catch (error) {
      if (!silent) {
        setNotice(error instanceof Error ? error.message : 'Failed to save CV.');
        showToast(error instanceof Error ? error.message : 'Failed to save CV.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!loadedRef.current) return;
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => {
      if (data.fullName || data.email || data.phone || data.summary || data.objective) void saveCV('Draft', true);
    }, 2500);
    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [data]);

  const uploadPhoto = async (file: File | undefined) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await cvService.uploadAsset(file);
      setField('photoUrl', url);
      showToast('Profile photo uploaded.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to upload photo.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const downloadPdf = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Please login before downloading.');
      await revenueService.assertCanDownload(user.$id, template);
      await exportPdf(data);
      await revenueService.incrementDownloadUsage(user.$id);
      showToast('Download started.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Download blocked. Please upgrade.';
      setUpgradePrompt(message);
      showToast(message, 'error');
    }
  };

  const addItem = <K extends 'education' | 'internships' | 'experience' | 'skills' | 'projects' | 'training' | 'certifications' | 'extracurricularActivities' | 'achievements' | 'languages' | 'references'>(key: K, item: CVData[K][number]) => {
    setData((current) => ({ ...current, [key]: [...current[key], item] }));
  };

  const removeItem = async <K extends 'education' | 'internships' | 'experience' | 'skills' | 'projects' | 'training' | 'certifications' | 'extracurricularActivities' | 'achievements' | 'languages' | 'references'>(key: K, index: number) => {
    const itemName = key.slice(0, -1) || 'item';
    const shouldDelete = await confirm({
      title: `Delete ${itemName}?`,
      message: 'This item will be removed from your CV preview and saved data.',
    });
    if (!shouldDelete) return;
    setField(key, data[key].filter((_, itemIndex) => itemIndex !== index) as CVData[K]);
  };

  const updateItem = <K extends 'education' | 'internships' | 'experience' | 'skills' | 'projects' | 'training' | 'certifications' | 'extracurricularActivities' | 'achievements' | 'languages' | 'references'>(key: K, index: number, item: CVData[K][number]) => {
    const next = [...data[key]];
    next[index] = item;
    setField(key, next as CVData[K]);
  };

  const getCustomItems = (sectionId: string) => {
    const value = data.customData?.[sectionId];
    return Array.isArray(value) ? value : [];
  };

  const setCustomItems = (sectionId: string, items: Array<Record<string, string>>) => {
    setData((current) => ({
      ...current,
      customData: {
        ...(current.customData || {}),
        [sectionId]: items,
      },
    }));
  };

  const addCustomItem = (section: TemplateFieldSectionConfig) => {
    const blankItem = Object.fromEntries(section.fields.map((field) => [field.name, '']));
    setCustomItems(section.id, [...getCustomItems(section.id), blankItem]);
  };

  const updateCustomItem = (sectionId: string, index: number, fieldName: string, value: string) => {
    const next = [...getCustomItems(sectionId)];
    next[index] = { ...(next[index] || {}), [fieldName]: value };
    setCustomItems(sectionId, next);
  };

  const removeCustomItem = async (sectionId: string, index: number) => {
    const shouldDelete = await confirm({
      title: 'Delete custom item?',
      message: 'This custom template entry will be removed from your CV.',
    });
    if (!shouldDelete) return;
    setCustomItems(sectionId, getCustomItems(sectionId).filter((_, itemIndex) => itemIndex !== index));
  };

  const renderStep = () => {
    if (activeBaseStep === 0) return (
      <div className="grid gap-5 md:grid-cols-2">
        {[
          ['Full Name', 'fullName', true],
          ['Email', 'email', true],
          ['Phone', 'phone', true],
          ['Address', 'address', false],
          ['LinkedIn URL', 'linkedIn', false],
          ['Portfolio URL', 'portfolio', false],
        ].map(([label, key, required]) => (
          <div key={String(key)}>
            <label className={labelClass}>{label}{required && <span className="text-red-500"> *</span>}</label>
            <input className={inputClass} value={String(data[key as keyof CVData] || '')} onChange={(event) => setField(key as keyof CVData, event.target.value as never)} />
          </div>
        ))}
        <div>
          <label className={labelClass}>Professional Title</label>
          <input className={inputClass} value={data.professionalTitle} onChange={(event) => setField('professionalTitle', event.target.value)} />
          <div className="mt-2 flex flex-wrap gap-2">
            {renderAiButton({
              buttonKey: 'title-objective',
              field: 'career_objective',
              currentValue: data.objective || '',
              instruction: 'Write a short career objective for the target job title.',
              onApply: (value) => setField('objective', value),
              label: 'Suggest Objective',
            })}
            {renderAiButton({
              buttonKey: 'title-skills',
              field: 'skills',
              currentValue: skillsDraft,
              instruction: 'Suggest relevant CV skills based on the job title.',
              onApply: (value) => {
                setSkillsDraft(value);
                setField('skills', textToSkills(value));
              },
              label: 'Suggest Skills',
            })}
          </div>
        </div>
      </div>
    );

    if (activeBaseStep === 1) return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Profile Photo (optional)</label>
          <div className="grid gap-4 sm:grid-cols-[120px_1fr] sm:items-start">
            <div className={`flex h-32 w-32 items-center justify-center overflow-hidden border border-blue-100 bg-blue-50 ${getPhotoShapeClass(data.photoShape)}`}>
              {data.photoUrl ? <img src={data.photoUrl} alt="Profile" crossOrigin="anonymous" referrerPolicy="no-referrer" className="h-full w-full object-cover" style={getPhotoStyle(data)} /> : <span className="text-xs font-bold text-blue-600">Photo</span>}
            </div>
            <div className="grid gap-3">
              <input className={inputClass} value={data.photoUrl || ''} onChange={(event) => setField('photoUrl', event.target.value)} placeholder="Paste image URL or upload" />
              <label className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 hover:bg-blue-100">
                <Upload className="h-4 w-4" />
                {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                <input type="file" accept="image/*" disabled={uploadingPhoto} onChange={(event) => void uploadPhoto(event.target.files?.[0])} className="hidden" />
              </label>
              <p className="text-xs font-semibold text-gray-500">Recommended max file size: 200KB. Larger photos are compressed before upload.</p>
              <div>
                <label className={labelClass}>Photo Shape</label>
                <div className="grid grid-cols-3 gap-2">
                  {photoShapeOptions.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setField('photoShape', value)}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition ${data.photoShape === value ? 'border-blue-600 bg-blue-600 text-white' : 'border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                    >
                      <Icon className={`h-4 w-4 ${value === 'rounded' ? 'rounded-sm' : ''}`} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-xs font-bold text-gray-600">
                  Zoom
                  <input type="range" min="100" max="180" value={data.photoZoom ?? 100} onChange={(event) => setField('photoZoom', Number(event.target.value))} className="mt-2 w-full accent-blue-600" />
                </label>
                <label className="text-xs font-bold text-gray-600">
                  Left / Right
                  <input type="range" min="0" max="100" value={data.photoPositionX ?? 50} onChange={(event) => setField('photoPositionX', Number(event.target.value))} className="mt-2 w-full accent-blue-600" />
                </label>
                <label className="text-xs font-bold text-gray-600">
                  Up / Down
                  <input type="range" min="0" max="100" value={data.photoPositionY ?? 50} onChange={(event) => setField('photoPositionY', Number(event.target.value))} className="mt-2 w-full accent-blue-600" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    if (activeBaseStep === 2) return (
      <div className="space-y-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label className="block text-xs font-extrabold uppercase tracking-widest text-gray-700">Career Objective</label>
            {renderAiButton({
              buttonKey: 'objective',
              field: 'career_objective',
              currentValue: data.objective || '',
              instruction: 'Write a short career objective for the target job title.',
              onApply: (value) => setField('objective', value),
              label: 'Suggest Objective',
            })}
          </div>
          {renderTextareaWithAutocomplete({
            key: 'objective-autocomplete',
            field: 'career_objective',
            value: data.objective || '',
            onChange: (value) => setField('objective', value),
            placeholder: 'Short career objective for students or fresh graduates.',
            className: `${inputClass} min-h-28 resize-y`,
            instruction: 'Continue writing this career objective based on the job title.',
          })}
        </div>
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label className="block text-xs font-extrabold uppercase tracking-widest text-gray-700">Professional Summary</label>
            {renderAiButton({
              buttonKey: 'summary',
              field: 'career_summary',
              currentValue: data.summary,
              instruction: 'Write a concise professional summary based on the target job title and available CV details.',
              onApply: (value) => setField('summary', value),
              label: 'Suggest Summary',
            })}
          </div>
          {renderTextareaWithAutocomplete({
            key: 'summary-autocomplete',
            field: 'career_summary',
            value: data.summary,
            onChange: (value) => setField('summary', value),
            placeholder: 'Experience-focused summary or short professional profile.',
            className: `${inputClass} min-h-44 resize-y`,
            instruction: 'Continue writing this professional summary based on the job title and CV details.',
          })}
          <p className="mt-2 text-sm font-medium text-gray-500">Suggested length: 300-600 characters. Current: {data.summary.length}</p>
        </div>
      </div>
    );

    if (activeBaseStep === 3) return (
      <div className="space-y-4">
        {data.education.map((item, index) => (
          <div key={index} className={cardClass}>
            <div className="mb-3 flex justify-end"><button onClick={() => removeItem('education', index)} className="rounded-xl bg-red-50 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button></div>
            <div className="grid gap-4 md:grid-cols-2">
              {(['degree', 'institute', 'subject', 'result'] as const).map((field) => (
                <input key={field} className={inputClass} value={String(item[field])} placeholder={field} onChange={(event) => updateItem('education', index, { ...item, [field]: event.target.value })} />
              ))}
              <MonthYearInput label="Start" value={item.startYear} onChange={(value) => updateItem('education', index, { ...item, startYear: value })} />
              <MonthYearInput label="Passing Year" value={item.passingYear} disabled={item.currentlyStudying} onChange={(value) => updateItem('education', index, { ...item, passingYear: value })} />
              <label className="flex items-center gap-2 font-bold text-gray-700"><input type="checkbox" checked={item.currentlyStudying} onChange={(event) => updateItem('education', index, { ...item, currentlyStudying: event.target.checked })} /> Currently studying</label>
            </div>
          </div>
        ))}
        <button onClick={() => addItem('education', { degree: '', institute: '', subject: '', result: '', startYear: currentMonthYear, passingYear: currentMonthYear, currentlyStudying: false })} className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 font-bold text-blue-700"><Plus className="h-4 w-4" /> Add Education</button>
      </div>
    );

    if (activeBaseStep === 4) return (
      <div className="space-y-4">
        <p className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">Recommended for students and fresh graduates.</p>
        {(data.internships || []).map((item, index) => (
          <div key={index} className={cardClass}>
            <div className="mb-3 flex justify-end"><button onClick={() => removeItem('internships', index)} className="rounded-xl bg-red-50 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button></div>
            <div className="grid gap-4 md:grid-cols-2">
              <input className={inputClass} value={item.internshipTitle} placeholder="Internship Title" onChange={(event) => updateItem('internships', index, { ...item, internshipTitle: event.target.value })} />
              <input className={inputClass} value={item.organizationName} placeholder="Organization Name" onChange={(event) => updateItem('internships', index, { ...item, organizationName: event.target.value })} />
              <input className={inputClass} value={item.duration} placeholder="Duration" onChange={(event) => updateItem('internships', index, { ...item, duration: event.target.value })} />
              <input className={inputClass} value={item.department} placeholder="Department" onChange={(event) => updateItem('internships', index, { ...item, department: event.target.value })} />
            </div>
            <div className="mt-4">
              <div className="mb-2 flex justify-end">
                {renderAiButton({
                  buttonKey: `internship-responsibilities-${index}`,
                  field: 'internship_responsibilities',
                  currentValue: item.responsibilities,
                  instruction: `Internship title: ${item.internshipTitle}. Organization: ${item.organizationName}. Department: ${item.department}.`,
                  onApply: (value) => updateItem('internships', index, { ...item, responsibilities: value }),
                })}
              </div>
              {renderTextareaWithAutocomplete({
                key: `internship-responsibilities-${index}-autocomplete`,
                field: 'internship_responsibilities',
                value: item.responsibilities,
                onChange: (value) => updateItem('internships', index, { ...item, responsibilities: value }),
                placeholder: 'Responsibilities - press Enter for each bullet point',
                className: `${inputClass} min-h-28`,
                instruction: `Continue writing internship responsibilities for ${item.internshipTitle} at ${item.organizationName}.`,
              })}
            </div>
            <div className="mt-4">
              <div className="mb-2 flex justify-end">
                {renderAiButton({
                  buttonKey: `internship-learning-${index}`,
                  field: 'internship_learning',
                  currentValue: item.learningOutcome,
                instruction: `Internship title: ${item.internshipTitle}. Organization: ${item.organizationName}.`,
                onApply: (value) => updateItem('internships', index, { ...item, learningOutcome: value }),
                label: 'Suggest Outcome',
              })}
            </div>
              {renderTextareaWithAutocomplete({
                key: `internship-learning-${index}-autocomplete`,
                field: 'internship_learning',
                value: item.learningOutcome,
                onChange: (value) => updateItem('internships', index, { ...item, learningOutcome: value }),
                placeholder: 'Learning/Outcome',
                className: `${inputClass} min-h-24`,
                instruction: `Continue internship learning outcome for ${item.internshipTitle} in ${item.department} department at ${item.organizationName}.`,
              })}
            </div>
          </div>
        ))}
        <button onClick={() => addItem('internships', { internshipTitle: '', organizationName: '', duration: '', department: '', responsibilities: '', learningOutcome: '' })} className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 font-bold text-blue-700"><Plus className="h-4 w-4" /> Add Internship</button>
      </div>
    );

    if (activeBaseStep === 5) return (
      <div className="space-y-4">
        {data.experience.map((item, index) => (
          <div key={index} className={cardClass}>
            <div className="mb-3 flex justify-end"><button onClick={() => removeItem('experience', index)} className="rounded-xl bg-red-50 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button></div>
            <div className="grid gap-4 md:grid-cols-2">
              {(['jobTitle', 'company', 'location'] as const).map((field) => (
                <input key={field} className={inputClass} value={String(item[field])} placeholder={field} onChange={(event) => updateItem('experience', index, { ...item, [field]: event.target.value })} />
              ))}
              <MonthYearInput label="Start" value={item.startDate} onChange={(value) => updateItem('experience', index, { ...item, startDate: value })} />
              <MonthYearInput label="End" value={item.endDate} disabled={item.currentlyWorking} onChange={(value) => updateItem('experience', index, { ...item, endDate: value })} />
              <label className="flex items-center gap-2 font-bold text-gray-700"><input type="checkbox" checked={item.currentlyWorking} onChange={(event) => updateItem('experience', index, { ...item, currentlyWorking: event.target.checked })} /> Currently working</label>
            </div>
            <div className="mt-4">
              <div className="mb-2 flex justify-end">
                {renderAiButton({
                  buttonKey: `experience-responsibilities-${index}`,
                  field: 'experience_responsibilities',
                  currentValue: item.responsibilities,
                  instruction: `Job title: ${item.jobTitle}. Company: ${item.company}. Location: ${item.location}.`,
                  onApply: (value) => updateItem('experience', index, { ...item, responsibilities: value }),
                })}
              </div>
              {renderTextareaWithAutocomplete({
                key: `experience-responsibilities-${index}-autocomplete`,
                field: 'experience_responsibilities',
                value: item.responsibilities,
                onChange: (value) => updateItem('experience', index, { ...item, responsibilities: value }),
                placeholder: 'Responsibilities - press Enter for each bullet point',
                className: `${inputClass} min-h-28`,
                instruction: `Continue writing job responsibilities for ${item.jobTitle} at ${item.company}.`,
              })}
            </div>
          </div>
        ))}
        <button onClick={() => addItem('experience', { jobTitle: '', company: '', location: '', startDate: currentMonthYear, endDate: currentMonthYear, currentlyWorking: false, responsibilities: '' })} className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 font-bold text-blue-700"><Plus className="h-4 w-4" /> Add Experience</button>
      </div>
    );

    if (activeBaseStep === 6) return (
      <div className="space-y-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label className="block text-xs font-extrabold uppercase tracking-widest text-gray-700">Skills</label>
            {renderAiButton({
              buttonKey: 'skills',
              field: 'skills',
              currentValue: skillsDraft,
              instruction: 'Suggest relevant CV skills based on the job title, education, projects, and experience.',
              onApply: (value) => {
                setSkillsDraft(value);
                setField('skills', textToSkills(value));
              },
              label: 'Suggest Skills',
            })}
          </div>
          <textarea
            className={`${inputClass} min-h-44 resize-y`}
            value={skillsDraft}
            placeholder="Write each skill on a new line"
            onChange={(event) => {
              setSkillsDraft(event.target.value);
              setField('skills', textToSkills(event.target.value));
            }}
          />
          <p className="mt-2 text-sm font-medium text-gray-500">Press Enter after each skill. Preview will show them as separate skill boxes.</p>
        </div>
        <div className="flex flex-wrap gap-2 rounded-2xl border border-blue-100 bg-blue-50/40 p-3">
          {data.skills.filter((skill) => skill.name.trim()).map((skill, index) => (
            <span key={`${skill.name}-${index}`} className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-100">{skill.name}</span>
          ))}
        </div>
      </div>
    );

    if (activeBaseStep === 7) return (
      <div className="space-y-4">
        {data.projects.map((item, index) => (
          <div key={index} className={cardClass}>
            <div className="mb-3 flex justify-end"><button onClick={() => removeItem('projects', index)} className="rounded-xl bg-red-50 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button></div>
            <div className="grid gap-4 md:grid-cols-2">
              <input className={inputClass} value={item.title} placeholder="Project Name" onChange={(event) => updateItem('projects', index, { ...item, title: event.target.value })} />
              <input className={inputClass} value={item.projectType || ''} placeholder="Project Type (Academic, Personal, Professional)" onChange={(event) => updateItem('projects', index, { ...item, projectType: event.target.value })} />
              <input className={inputClass} value={item.role || ''} placeholder="Role" onChange={(event) => updateItem('projects', index, { ...item, role: event.target.value })} />
              <input className={inputClass} value={item.url} placeholder="Project Link (optional)" onChange={(event) => updateItem('projects', index, { ...item, url: event.target.value })} />
            </div>
            <div className="mt-4">
              <div className="mb-2 flex justify-end">
                {renderAiButton({
                  buttonKey: `project-tech-${index}`,
                  field: 'project_technologies',
                  currentValue: item.technologies,
                  instruction: `Project name: ${item.title}. Project type: ${item.projectType}. Role: ${item.role}.`,
                  onApply: (value) => updateItem('projects', index, { ...item, technologies: value }),
                  label: 'Suggest Tools',
                })}
              </div>
              <textarea className={`${inputClass} min-h-24`} value={item.technologies} placeholder="Tools/Technologies Used - write each tool on a new line or separate with commas" onChange={(event) => updateItem('projects', index, { ...item, technologies: event.target.value })} />
            </div>
            <div className="mt-4">
              <div className="mb-2 flex justify-end">
                {renderAiButton({
                  buttonKey: `project-description-${index}`,
                  field: 'project_description',
                  currentValue: item.description,
                  instruction: `Project name: ${item.title}. Project type: ${item.projectType}. Role: ${item.role}. Tools: ${item.technologies}.`,
                  onApply: (value) => updateItem('projects', index, { ...item, description: value }),
                })}
              </div>
              {renderTextareaWithAutocomplete({
                key: `project-description-${index}-autocomplete`,
                field: 'project_description',
                value: item.description,
                onChange: (value) => updateItem('projects', index, { ...item, description: value }),
                placeholder: 'Description - press Enter for each bullet point',
                className: `${inputClass} min-h-24`,
                instruction: `Continue writing project description for ${item.title}.`,
              })}
            </div>
          </div>
        ))}
        <button onClick={() => addItem('projects', { title: '', projectType: '', role: '', technologies: '', description: '', url: '' })} className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 font-bold text-blue-700"><Plus className="h-4 w-4" /> Add Project</button>
      </div>
    );

    if (activeBaseStep === 8) return (
      <div className="space-y-4">
        {(data.training || []).map((item, index) => (
          <div key={index} className={cardClass}>
            <div className="mb-3 flex justify-end"><button onClick={() => removeItem('training', index)} className="rounded-xl bg-red-50 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button></div>
            <div className="grid gap-4 md:grid-cols-2">
              <input className={inputClass} value={item.trainingName} placeholder="Training Name" onChange={(event) => updateItem('training', index, { ...item, trainingName: event.target.value })} />
              <input className={inputClass} value={item.institute} placeholder="Institute/Organization" onChange={(event) => updateItem('training', index, { ...item, institute: event.target.value })} />
              <input className={inputClass} value={item.duration} placeholder="Duration" onChange={(event) => updateItem('training', index, { ...item, duration: event.target.value })} />
              <MonthYearInput label="Completion Date" value={item.completionDate} onChange={(value) => updateItem('training', index, { ...item, completionDate: value })} />
            </div>
            <div className="mt-4">
              <div className="mb-2 flex justify-end">
                {renderAiButton({
                  buttonKey: `training-topics-${index}`,
                  field: 'training_topics',
                  currentValue: item.topicsCovered ?? item.description ?? '',
                  instruction: `Training name: ${item.trainingName}. Institute: ${item.institute}.`,
                  onApply: (value) => updateItem('training', index, { ...item, topicsCovered: value, description: '' }),
                  label: 'Suggest Topics',
                })}
              </div>
              <textarea className={`${inputClass} min-h-24`} value={item.topicsCovered ?? item.description ?? ''} placeholder="Topics Covered - press Enter after each topic" onChange={(event) => updateItem('training', index, { ...item, topicsCovered: event.target.value, description: '' })} />
            </div>
          </div>
        ))}
        <button onClick={() => addItem('training', { trainingName: '', institute: '', duration: '', completionDate: currentMonthYear, topicsCovered: '', description: '' })} className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 font-bold text-blue-700"><Plus className="h-4 w-4" /> Add Training</button>
      </div>
    );

    if (activeBaseStep === 9) return (
      <div className="space-y-4">
        {data.certifications.map((item, index) => (
          <div key={index} className={cardClass}>
            <div className="mb-3 flex justify-end"><button onClick={() => removeItem('certifications', index)} className="rounded-xl bg-red-50 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button></div>
            <div className="grid gap-4 md:grid-cols-2">
              <input className={inputClass} value={item.name} placeholder="Certification name" onChange={(event) => updateItem('certifications', index, { ...item, name: event.target.value })} />
              <input className={inputClass} value={item.organization} placeholder="Organization" onChange={(event) => updateItem('certifications', index, { ...item, organization: event.target.value })} />
              <MonthYearInput label="Issued Month & Year" value={item.year} onChange={(value) => updateItem('certifications', index, { ...item, year: value })} />
              <input className={inputClass} value={item.credentialLink} placeholder="Credential URL" onChange={(event) => updateItem('certifications', index, { ...item, credentialLink: event.target.value })} />
            </div>
          </div>
        ))}
        <button onClick={() => addItem('certifications', { name: '', organization: '', year: currentMonthYear, credentialLink: '' })} className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 font-bold text-blue-700"><Plus className="h-4 w-4" /> Add Certification</button>
      </div>
    );

    if (activeBaseStep === 10) return (
      <div className="space-y-4">
        {(data.extracurricularActivities || []).map((item, index) => (
          <div key={index} className={cardClass}>
            <div className="mb-3 flex justify-end"><button onClick={() => removeItem('extracurricularActivities', index)} className="rounded-xl bg-red-50 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button></div>
            <div className="grid gap-4 md:grid-cols-2">
              <input className={inputClass} value={item.activityTitle} placeholder="Activity Title" onChange={(event) => updateItem('extracurricularActivities', index, { ...item, activityTitle: event.target.value })} />
              <MonthYearInput label="Start Date" value={item.startDate} onChange={(value) => updateItem('extracurricularActivities', index, { ...item, startDate: value })} />
              <MonthYearInput label="End Date" value={item.endDate} disabled={item.currentlyWorking} onChange={(value) => updateItem('extracurricularActivities', index, { ...item, endDate: value })} />
              <input className={inputClass} value={item.organization} placeholder="Organization" onChange={(event) => updateItem('extracurricularActivities', index, { ...item, organization: event.target.value })} />
              <input className={inputClass} value={item.role} placeholder="Role" onChange={(event) => updateItem('extracurricularActivities', index, { ...item, role: event.target.value })} />
              <label className="flex items-center gap-2 font-bold text-gray-700"><input type="checkbox" checked={Boolean(item.currentlyWorking)} onChange={(event) => updateItem('extracurricularActivities', index, { ...item, currentlyWorking: event.target.checked })} /> Currently working here</label>
            </div>
            <div className="mt-4">
              <div className="mb-2 flex justify-end">
                {renderAiButton({
                  buttonKey: `activity-contribution-${index}`,
                  field: 'activity_contribution',
                  currentValue: item.contribution,
                instruction: `Activity title: ${item.activityTitle}. Organization: ${item.organization}. Role: ${item.role}.`,
                onApply: (value) => updateItem('extracurricularActivities', index, { ...item, contribution: value }),
              })}
            </div>
              {renderTextareaWithAutocomplete({
                key: `activity-contribution-${index}-autocomplete`,
                field: 'activity_contribution',
                value: item.contribution,
                onChange: (value) => updateItem('extracurricularActivities', index, { ...item, contribution: value }),
                placeholder: 'Contribution - press Enter for each bullet point',
                className: `${inputClass} min-h-24`,
                instruction: `Continue activity contribution for ${item.activityTitle} at ${item.organization} as ${item.role}.`,
              })}
            </div>
          </div>
        ))}
        <button onClick={() => addItem('extracurricularActivities', { activityTitle: '', organization: '', role: '', startDate: currentMonthYear, endDate: currentMonthYear, currentlyWorking: false, contribution: '' })} className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 font-bold text-blue-700"><Plus className="h-4 w-4" /> Add Activity</button>
      </div>
    );

    if (activeBaseStep === 11) return (
      <div className="space-y-4">
        {(data.achievements || []).map((item, index) => (
          <div key={index} className={cardClass}>
            <div className="mb-3 flex justify-end"><button onClick={() => removeItem('achievements', index)} className="rounded-xl bg-red-50 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button></div>
            <div className="grid gap-4 md:grid-cols-2">
              <input className={inputClass} value={item.achievementTitle} placeholder="Achievement Title" onChange={(event) => updateItem('achievements', index, { ...item, achievementTitle: event.target.value })} />
              <input className={inputClass} value={item.awardingOrganization} placeholder="Awarding Organization" onChange={(event) => updateItem('achievements', index, { ...item, awardingOrganization: event.target.value })} />
              <MonthYearInput label="Date / Year" value={item.dateYear} onChange={(value) => updateItem('achievements', index, { ...item, dateYear: value })} />
            </div>
            <div className="mt-4">
              <div className="mb-2 flex justify-end">
                {renderAiButton({
                  buttonKey: `achievement-description-${index}`,
                  field: 'achievement_description',
                  currentValue: item.description,
                instruction: `Achievement title: ${item.achievementTitle}. Awarding organization: ${item.awardingOrganization}. Date/year: ${item.dateYear}.`,
                onApply: (value) => updateItem('achievements', index, { ...item, description: value }),
              })}
            </div>
              {renderTextareaWithAutocomplete({
                key: `achievement-description-${index}-autocomplete`,
                field: 'achievement_description',
                value: item.description,
                onChange: (value) => updateItem('achievements', index, { ...item, description: value }),
                placeholder: 'Description',
                className: `${inputClass} min-h-24`,
                instruction: `Continue achievement description for ${item.achievementTitle} from ${item.awardingOrganization}.`,
              })}
            </div>
          </div>
        ))}
        <button onClick={() => addItem('achievements', { achievementTitle: '', awardingOrganization: '', dateYear: currentMonthYear, description: '' })} className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 font-bold text-blue-700"><Plus className="h-4 w-4" /> Add Achievement</button>
      </div>
    );

    if (activeBaseStep === 12) return (
      <div className="space-y-4">
        {data.languages.map((item, index) => (
          <div key={index} className="grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-3 sm:grid-cols-[1fr_220px_auto]">
            <input className={inputClass} value={item.language} placeholder="Language" onChange={(event) => updateItem('languages', index, { ...item, language: event.target.value })} />
            <select className={inputClass} value={item.proficiency} onChange={(event) => updateItem('languages', index, { ...item, proficiency: event.target.value as CVData['languages'][number]['proficiency'] })}>{languageLevels.map((level) => <option key={level}>{level}</option>)}</select>
            <button onClick={() => removeItem('languages', index)} className="rounded-xl bg-red-50 p-3 text-red-600"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        <button onClick={() => addItem('languages', { language: '', proficiency: 'Basic' })} className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 font-bold text-blue-700"><Plus className="h-4 w-4" /> Add Language</button>
      </div>
    );

    if (activeBaseStep === 13) return (
      <div className="space-y-5">
        <label className="flex items-center gap-3 rounded-2xl bg-blue-50 p-4 font-bold text-blue-700"><input type="checkbox" checked={data.referencesMode === 'available'} onChange={(event) => setField('referencesMode', event.target.checked ? 'available' : 'details')} /> Available upon request</label>
        {data.referencesMode === 'details' && <RepeatableSection items={data.references} fields={['name', 'designation', 'organization', 'email', 'phone']} onAdd={() => addItem('references', { name: '', designation: '', organization: '', email: '', phone: '' })} onRemove={(index) => removeItem('references', index)} onChange={(index, item) => updateItem('references', index, item)} addLabel="Add Reference" />}
      </div>
    );

    if (activeStepItem?.custom) return (
      <CustomTemplateFields
        sections={customSections}
        getItems={getCustomItems}
        onAdd={addCustomItem}
        onRemove={removeCustomItem}
        onChange={updateCustomItem}
      />
    );

    return (
      <div className="space-y-5">
        <div className={`rounded-2xl border p-5 ${completed ? 'border-green-100 bg-green-50 text-green-800' : 'border-amber-100 bg-amber-50 text-amber-800'}`}>
          <p className="font-black">{completed ? 'Ready to mark complete.' : 'Some important fields are missing. You can still save as draft.'}</p>
          {!completed && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm font-bold">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
        </div>
        <button onClick={() => setPreviewOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 font-black text-white shadow-lg shadow-blue-600/20">
          <Eye className="h-5 w-5" />
          Open Final Preview
        </button>
      </div>
    );
  };

  const isReviewStep = step === effectiveSteps.length - 1;
  const canLeaveCurrentStep = activeBaseStep !== 0 || personalInfoWarnings.length === 0;
  const showCurrentStepWarnings = activeBaseStep === 0 && personalInfoWarnings.length > 0;
  const goNext = () => setStep((current) => Math.min(effectiveSteps.length - 1, current + 1));
  const goBack = () => setStep((current) => Math.max(0, current - 1));
  const handleNextStep = () => {
    if (!canLeaveCurrentStep) {
      showToast(personalInfoWarnings[0], 'error');
      return;
    }
    goNext();
  };

  return (
    <UserLayout title={id ? 'Edit CV' : 'Create CV'}>
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-900/5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/user/dashboard" className="rounded-lg bg-blue-50 p-2.5 text-blue-700"><ArrowLeft className="h-5 w-5" /></Link>
          <input className="min-w-0 flex-1 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-base font-black text-gray-950 outline-none focus:bg-white lg:w-80" value={data.title} onChange={(event) => setField('title', event.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button disabled={isSaving} onClick={() => void saveCV('Draft')} className="flex items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 disabled:opacity-60 sm:text-sm"><Save className="h-4 w-4" /> {isSaving ? 'Saving' : 'Save Draft'}</button>
          <button onClick={() => setPreviewOpen(true)} className="flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-700 ring-1 ring-blue-100 sm:text-sm"><Eye className="h-4 w-4" /> Preview</button>
          <button onClick={() => void downloadPdf()} className="col-span-2 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white sm:col-span-1 sm:text-sm"><Download className="h-4 w-4" /> PDF</button>
        </div>
      </div>
      {notice && <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 font-bold text-blue-700">{notice}</div>}

      <div className="mb-5 grid grid-cols-2 rounded-2xl bg-white p-2 shadow-sm shadow-blue-900/5 lg:hidden">
        <button onClick={() => setMode('edit')} className="min-w-32 flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white">Edit</button>
        <button onClick={() => setPreviewOpen(true)} className="min-w-32 flex-1 rounded-xl py-3 text-sm font-bold text-blue-700">Preview Popup</button>
      </div>

      <div className="mb-4 rounded-2xl border border-blue-100 bg-white p-3 shadow-sm shadow-blue-900/5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">Builder Progress</p>
            <p className="text-sm font-bold text-gray-600">Step {step + 1} of {effectiveSteps.length}: {effectiveSteps[step]}</p>
          </div>
          <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">{Math.round(((step + 1) / effectiveSteps.length) * 100)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-blue-50">
          <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${((step + 1) / effectiveSteps.length) * 100}%` }} />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(320px,410px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(360px,460px)_minmax(0,1fr)]">
        <section className={`${mode === 'preview' ? 'hidden lg:block' : 'block'}`}>
          <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-900/5">
            <div className="border-b border-blue-100 bg-blue-50/70 px-4 py-4">
              <p className="text-xs font-black uppercase tracking-widest text-blue-600">Step {step + 1} of {effectiveSteps.length}</p>
              <h2 className="mt-1 text-lg font-black text-gray-950">{effectiveSteps[step]}</h2>
            </div>
            <div className="p-4">
              {renderStep()}
              {showCurrentStepWarnings && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {personalInfoWarnings.join(' ')}
                </div>
              )}
              <div className="mt-5 flex flex-col gap-2 border-t border-blue-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <button disabled={step === 0} onClick={goBack} className="rounded-lg border border-blue-100 px-4 py-3 text-sm font-bold text-blue-700 disabled:opacity-40 sm:py-2">Back</button>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {!isReviewStep && <button onClick={handleNextStep} disabled={!canLeaveCurrentStep} className="rounded-lg border border-blue-100 bg-white px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 sm:py-2">Skip Section</button>}
                  <button onClick={() => isReviewStep ? void saveCV(completed ? 'Completed' : 'Draft') : handleNextStep()} disabled={!isReviewStep && !canLeaveCurrentStep} className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 sm:py-2">{isReviewStep ? (completed ? 'Mark Complete' : 'Save Draft') : 'Save & Continue'}</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="hidden xl:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-auto rounded-2xl border border-blue-100 bg-slate-100 p-4 shadow-xl shadow-blue-900/10">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-blue-600">Live A4 Preview</p>
                <p className="text-sm font-bold text-gray-600">Updates as you type</p>
              </div>
              <button onClick={() => setPreviewOpen(true)} className="rounded-xl bg-white px-3 py-2 text-sm font-black text-blue-700 ring-1 ring-blue-100">
                Open
              </button>
            </div>
            <div className="cv-preview-shell">
              <div className="cv-preview-scale">
                <A4Preview data={data} template={template} previewId="cv-a4-preview-live" />
              </div>
            </div>
          </div>
        </aside>
      </div>
      <div className="cv-export-source" aria-hidden="true">
        <A4Preview data={data} template={template} previewId="cv-a4-preview-export" />
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-[90] bg-slate-950/70 p-3 backdrop-blur-sm sm:p-5">
          <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-slate-100 shadow-2xl shadow-slate-950/30">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-blue-600">A4 CV Preview</p>
                <h3 className="text-lg font-black text-slate-950 sm:text-xl">{data.title || 'Untitled CV'}</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button onClick={() => void downloadPdf()} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white sm:px-6"><Download className="h-4 w-4" /> PDF</button>
                <button onClick={() => setPreviewOpen(false)} className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 sm:px-6"><X className="h-4 w-4" /> Close</button>
              </div>
            </div>
            <div className="cv-preview-shell flex-1 bg-slate-100 p-2 sm:p-4">
              <div className="cv-preview-scale">
                <A4Preview data={data} template={template} previewId="cv-a4-preview-modal" />
              </div>
            </div>
          </div>
        </div>
      )}
      {upgradePrompt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
            <button onClick={() => setUpgradePrompt('')} className="ml-auto block rounded-xl bg-slate-100 p-2 text-slate-600"><X className="h-5 w-5" /></button>
            <Crown className="mx-auto mb-4 h-14 w-14 text-blue-600" />
            <h3 className="mb-3 text-2xl font-black text-gray-950">Upgrade Required</h3>
            <p className="mb-6 font-semibold leading-relaxed text-gray-600">{upgradePrompt}</p>
            <button onClick={() => navigate('/user/plans')} className="w-full rounded-xl bg-blue-600 px-5 py-3 font-black text-white">View Plans</button>
          </div>
        </div>
      )}
      <ConfirmationDialog />
    </UserLayout>
  );
};

const MonthYearInput = ({ label, value, disabled, onChange }: { label: string; value?: string; disabled?: boolean; onChange: (value: string) => void }) => {
  const parsed = splitMonthYear(value);

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="grid grid-cols-[1fr_80px] gap-2 sm:grid-cols-[1fr_92px]">
        <select className={inputClass} value={parsed.month} disabled={disabled} onChange={(event) => onChange(joinMonthYear(event.target.value, parsed.year))}>
          {monthNames.map((month) => <option key={month} value={month}>{month}</option>)}
        </select>
        <input
          className={inputClass}
          value={parsed.year}
          disabled={disabled}
          inputMode="numeric"
          type="number"
          min="1900"
          max="2100"
          placeholder="Year"
          onChange={(event) => onChange(joinMonthYear(parsed.month, event.target.value.replace(/\D/g, '').slice(0, 4)))}
        />
      </div>
    </div>
  );
};

const CustomFieldInput = ({ field, value, onChange }: { field: TemplateFieldConfig; value: string; onChange: (value: string) => void }) => {
  if (field.type === 'textarea') {
    return <textarea className={`${inputClass} min-h-24`} value={value} placeholder={field.label} onChange={(event) => onChange(event.target.value)} />;
  }

  if (field.type === 'select') {
    return (
      <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select {field.label}</option>
        {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    );
  }

  if (field.type === 'monthYear') {
    return <MonthYearInput label={field.label} value={value} onChange={onChange} />;
  }

  return <input className={inputClass} value={value} placeholder={field.label} type={field.type === 'url' ? 'url' : 'text'} onChange={(event) => onChange(event.target.value)} />;
};

const CustomTemplateFields = ({
  sections,
  getItems,
  onAdd,
  onRemove,
  onChange,
}: {
  sections: TemplateFieldSectionConfig[];
  getItems: (sectionId: string) => Array<Record<string, string>>;
  onAdd: (section: TemplateFieldSectionConfig) => void;
  onRemove: (sectionId: string, index: number) => void;
  onChange: (sectionId: string, index: number, fieldName: string, value: string) => void;
}) => (
  <div className="space-y-5">
    {sections.map((section) => {
      const items = getItems(section.id);
      return (
        <div key={section.id} className="rounded-2xl border border-blue-100 bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-gray-950">{section.label}</h3>
              <p className="text-xs font-semibold text-gray-500">Placeholder: {'{{'}{section.id}{'}}'}</p>
            </div>
            <button type="button" onClick={() => onAdd(section)} className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700"><Plus className="h-4 w-4" /> Add</button>
          </div>
          <div className="space-y-4">
            {items.length === 0 && <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">No {section.label.toLowerCase()} added yet.</p>}
            {items.map((item, itemIndex) => (
              <div key={itemIndex} className={cardClass}>
                <div className="mb-3 flex justify-end"><button type="button" onClick={() => onRemove(section.id, itemIndex)} className="rounded-xl bg-red-50 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button></div>
                <div className="grid gap-4 md:grid-cols-2">
                  {section.fields.map((field) => (
                    <div key={field.name}>
                      <label className={labelClass}>{field.label}{field.required && <span className="text-red-500"> *</span>}</label>
                      <CustomFieldInput field={field} value={item[field.name] || ''} onChange={(value) => onChange(section.id, itemIndex, field.name, value)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

type RepeatableProps<T extends Record<string, string>> = {
  items: T[];
  fields: Array<keyof T>;
  addLabel: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, item: T) => void;
};

const RepeatableSection = <T extends Record<string, string>>({ items, fields, addLabel, onAdd, onRemove, onChange }: RepeatableProps<T>) => (
  <div className="space-y-4">
    {items.map((item, index) => (
      <div key={index} className={cardClass}>
        <div className="mb-3 flex justify-end"><button onClick={() => onRemove(index)} className="rounded-xl bg-red-50 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button></div>
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <input key={String(field)} className={inputClass} value={String(item[field] || '')} placeholder={String(field)} onChange={(event) => onChange(index, { ...item, [field]: event.target.value })} />
          ))}
        </div>
      </div>
    ))}
    <button onClick={onAdd} className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 font-bold text-blue-700"><Plus className="h-4 w-4" /> {addLabel}</button>
  </div>
);

export default CVBuilder;
