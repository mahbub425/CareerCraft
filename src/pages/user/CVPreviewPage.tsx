import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Crown, Download, Pencil, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import UserLayout from './UserLayout';
import { cvService, type CVData, type CVDoc, type TemplateDoc } from '../../services/cvService';
import TemplateRenderer from '../../components/cv/TemplateRenderer';
import { isHtmlTemplate } from '../../lib/templateConfig';
import { authService } from '../../services/authService';
import { revenueService } from '../../services/revenueService';
import { showToast } from '../../lib/toast';

const linesToBullets = (value?: string) => (value || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const commaList = (value?: string) => (value || '').split(/[\n,]+/).map((item) => item.trim()).filter(Boolean).join(', ');
const topicsToText = (value?: string) => commaList(value);
const getPhotoShapeClass = (shape?: CVData['photoShape']) => {
  if (shape === 'circle') return 'rounded-full';
  if (shape === 'square') return 'rounded-none';
  return 'rounded-xl';
};
const getPhotoStyle = (data: CVData) => ({
  objectPosition: `${data.photoPositionX ?? 50}% ${data.photoPositionY ?? 50}%`,
  transform: `scale(${(data.photoZoom ?? 100) / 100})`,
});

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
  const minKeepWithTitle = 130;

  for (let pass = 0; pass < 4; pass += 1) {
    let changed = false;
    const rootTop = root.getBoundingClientRect().top;

    root.querySelectorAll<HTMLElement>('section').forEach((section) => {
      const title = section.querySelector<HTMLElement>('h2');
      if (!title) return;

      const sectionRect = section.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      const sectionTop = sectionRect.top - rootTop;
      const sectionBottom = sectionRect.bottom - rootTop;
      const titleTop = titleRect.top - rootTop;
      const pageBottom = (Math.floor(titleTop / pagePixelHeight) + 1) * pagePixelHeight;
      const sectionHeight = sectionBottom - sectionTop;

      if (sectionHeight >= pagePixelHeight * 0.85) return;
      if (sectionTop < pageBottom && sectionBottom > pageBottom && pageBottom - titleTop < minKeepWithTitle) {
        const currentMargin = Number.parseFloat(section.style.marginTop || '0') || 0;
        section.style.marginTop = `${currentMargin + pageBottom - sectionTop + 12}px`;
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
  const pageCount = Math.max(1, Math.ceil(contentHeight / pagePixelHeight - 0.01));

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const sourceY = Math.floor(pageIndex * pagePixelHeight);
    const sourceHeight = Math.min(Math.ceil(pagePixelHeight), contentHeight - sourceY);
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
  }
};

const exportPdf = async (title: string) => {
  const element = document.getElementById('cv-preview-page');
  if (!element) return;

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
        const clonedRoot = clonedDocument.getElementById('cv-preview-page');
        if (clonedRoot) {
          const pdf = new jsPDF('p', 'mm', 'a4');
          const { printableWidth, printableHeight } = getPdfPageMetrics(pdf);
          preventSectionOrphans(clonedRoot, (794 * printableHeight) / printableWidth);
        }
        clonedDocument.querySelectorAll('img').forEach((image) => {
          image.crossOrigin = 'anonymous';
          image.referrerPolicy = 'no-referrer';
        });
      },
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    addCanvasPagesToPdf(pdf, canvas);
    pdf.save(`${title || 'cv'}.pdf`);
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'PDF export failed. Please try again.');
  }
};

const exportDoc = (title: string) => {
  const source = document.getElementById('cv-preview-page')?.outerHTML || '';
  downloadBlob(`${title || 'cv'}.doc`, `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif}.text-blue-700{color:#1d4ed8}.font-black{font-weight:900}.font-bold{font-weight:700}</style></head><body>${source}</body></html>`, 'application/msword;charset=utf-8');
};

const CVPreviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cv, setCv] = useState<CVDoc | null>(null);
  const [data, setData] = useState<CVData | null>(null);
  const [template, setTemplate] = useState<TemplateDoc | null>(null);
  const [upgradePrompt, setUpgradePrompt] = useState('');

  useEffect(() => {
    if (!id) return;
    cvService.getCV(id).then((result) => {
      setCv(result);
      setData(cvService.parseCVData(result));
      if (result.template_id) {
        cvService.getTemplate(result.template_id).then(setTemplate).catch(() => setTemplate(null));
      }
    });
  }, [id]);

  const recordAndExport = async (format: 'PDF' | 'DOCX') => {
    if (!cv || !data) return;
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Please login before downloading.');
      await revenueService.assertCanDownload(user.$id, template);
      if (format === 'PDF') await exportPdf(data.title);
      else exportDoc(data.title);
      await cvService.recordDownload(cv, format);
      await revenueService.incrementDownloadUsage(user.$id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Download blocked. Please upgrade.';
      setUpgradePrompt(message);
      showToast(message, 'error');
    }
  };

  if (!cv || !data) {
    return (
      <UserLayout title="Preview CV">
        <div className="rounded-3xl border border-blue-100 bg-white p-10 text-center font-bold text-blue-700">Loading preview...</div>
      </UserLayout>
    );
  }

  const experience = data.experience.filter((item) => item.jobTitle || item.company).toReversed();
  const internships = (data.internships || []).filter((item) => item.internshipTitle || item.organizationName || item.responsibilities || item.learningOutcome).toReversed();
  const education = data.education.filter((item) => item.degree || item.institute).toReversed();
  const projects = (data.projects || []).filter((item) => item.title || item.projectType || item.role || item.description).toReversed();
  const training = (data.training || []).filter((item) => item.trainingName || item.institute || item.topicsCovered || item.description).toReversed();
  const certifications = (data.certifications || []).filter((item) => item.name || item.organization).toReversed();
  const extracurricularActivities = (data.extracurricularActivities || []).filter((item) => item.activityTitle || item.organization || item.contribution).toReversed();
  const achievements = (data.achievements || []).filter((item) => item.achievementTitle || item.awardingOrganization || item.description).toReversed();
  const skills = data.skills.filter((skill) => skill.name);

  return (
    <UserLayout title="Preview CV">
      <div className="mb-5 flex flex-col gap-4 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-900/5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/user/dashboard" className="rounded-xl bg-blue-50 p-3 text-blue-700"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h2 className="text-2xl font-black text-gray-950">{cv.title}</h2>
            <p className="text-sm font-medium text-gray-500">{cv.template_name} - {cv.status}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <Link to={`/user/cv/${cv.$id}/edit`} className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-3 font-bold text-blue-700"><Pencil className="h-4 w-4" /> Edit</Link>
          <button onClick={() => void recordAndExport('PDF')} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white"><Download className="h-4 w-4" /> PDF</button>
        </div>
      </div>

      <div className="cv-preview-shell rounded-2xl bg-slate-100 p-3 sm:p-5">
        <div className="cv-preview-scale">
          {template && isHtmlTemplate(template) ? (
            <TemplateRenderer data={data} template={template} previewId="cv-preview-page" />
          ) : (
          <section id="cv-preview-page" className="cv-a4-page cv-export-safe mx-auto bg-white p-10 text-gray-950 shadow-2xl shadow-blue-900/10">
        <div className="flex gap-5 border-b-4 border-blue-600 pb-6">
          {data.photoUrl && (
            <div className={`h-28 w-28 shrink-0 overflow-hidden ${getPhotoShapeClass(data.photoShape)} ring-2 ring-blue-100`}>
              <img src={data.photoUrl} alt={data.fullName} crossOrigin="anonymous" referrerPolicy="no-referrer" className="h-full w-full object-cover" style={getPhotoStyle(data)} />
            </div>
          )}
          <div>
            <h1 className="text-4xl font-black text-gray-950">{data.fullName || 'Your Name'}</h1>
            <p className="text-xl font-bold text-blue-700">{data.professionalTitle || 'Professional Title'}</p>
            <p className="mt-3 text-sm font-medium text-gray-500">{[data.email, data.phone, data.address].filter(Boolean).join(' | ')}</p>
          </div>
        </div>
        <div className="space-y-7 py-10">
          <div className="space-y-7">
            {(data.objective || data.summary) && (
              <section>
                <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Professional Summary</h2>
                {data.objective && <p className="mb-2 leading-relaxed text-gray-600">{data.objective}</p>}
                {data.summary && <p className="leading-relaxed text-gray-600">{data.summary}</p>}
              </section>
            )}
            {education.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Education</h2>
                {education.map((item, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-bold text-gray-950">{item.degree || 'Degree'}{item.subject ? ` in ${item.subject}` : ''}</p>
                      <p className="shrink-0 text-right text-xs font-bold text-gray-500">{[item.startYear, item.currentlyStudying ? 'Present' : item.passingYear].filter(Boolean).join(' - ')}</p>
                    </div>
                    {item.institute && <p className="mt-1 text-sm text-gray-600">{item.institute}</p>}
                    {item.result && <p className="mt-1 text-sm text-gray-600">CGPA: {item.result}</p>}
                  </div>
                ))}
              </section>
            )}
            {internships.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Internship</h2>
                {internships.map((item, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-bold text-gray-950">{item.internshipTitle || 'Internship Title'}</p>
                      {item.duration && <p className="shrink-0 text-right text-sm font-bold text-gray-500">{item.duration}</p>}
                    </div>
                    <div className="mt-1 flex items-start justify-between gap-4">
                      {item.organizationName && <p className="text-sm italic text-gray-600">{item.organizationName}</p>}
                      {item.department && <p className="shrink-0 text-right text-sm italic text-gray-500">{item.department}</p>}
                    </div>
                    {item.responsibilities && (
                      <ul className="mt-2 space-y-1 text-gray-600">
                        {linesToBullets(item.responsibilities).map((line, bulletIndex) => (
                          <li key={bulletIndex} className="flex gap-2">
                            <span className="shrink-0 text-gray-600">•</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {item.learningOutcome && <p className="mt-2 leading-relaxed text-gray-600"><strong>Learning/Outcome:</strong> {item.learningOutcome}</p>}
                  </div>
                ))}
              </section>
            )}
            {experience.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Experience</h2>
                {experience.map((item, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-bold text-gray-950">{item.jobTitle || 'Job Title'}</p>
                      <p className="shrink-0 text-right text-sm font-bold text-gray-500">{[item.startDate, item.currentlyWorking ? 'Present' : item.endDate].filter(Boolean).join(' - ')}</p>
                    </div>
                    <div className="mt-1 flex items-start justify-between gap-4">
                      {item.company && <p className="text-sm italic text-gray-600">{item.company}</p>}
                      {item.location && <p className="shrink-0 text-right text-sm italic text-gray-500">{item.location}</p>}
                    </div>
                    {item.responsibilities && (
                      <ul className="mt-2 space-y-1 text-gray-600">
                        {linesToBullets(item.responsibilities).map((line, bulletIndex) => (
                          <li key={bulletIndex} className="flex gap-2">
                            <span className="shrink-0 text-gray-600">•</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </section>
            )}
            {skills.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span key={`${skill.name}-${index}`} className="cv-skill-pill inline-flex min-h-[22px] items-center rounded-full bg-blue-50 px-3 py-1 align-middle text-xs font-bold leading-none text-blue-700">
                      <span className="cv-skill-pill-text">{skill.name}</span>
                    </span>
                  ))}
                </div>
              </section>
            )}
            {projects.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Projects</h2>
                {projects.map((item, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-bold text-gray-950">{item.title || 'Project Name'}</p>
                    </div>
                    {[item.projectType, item.role].filter(Boolean).length > 0 && <p className="mt-1 text-sm italic text-gray-600">{[item.projectType, item.role].filter(Boolean).join(' | ')}</p>}
                    {item.technologies && <p className="mt-1 text-sm text-gray-600">Tools/Technologies Used: {commaList(item.technologies)}</p>}
                    {item.url && <p className="mt-1 text-xs font-bold text-gray-500">Project Link: {item.url}</p>}
                    {item.description && <p className="mt-2 leading-relaxed text-gray-600">{item.description}</p>}
                  </div>
                ))}
              </section>
            )}
            {training.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Professional Training</h2>
                {training.map((item, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-bold text-gray-950">{item.trainingName || 'Training Name'}</p>
                      {item.completionDate && <p className="shrink-0 text-right text-sm font-bold text-gray-500">{item.completionDate}</p>}
                    </div>
                    <div className="mt-1 flex items-start justify-between gap-4">
                      {item.institute && <p className="text-sm italic text-gray-600"><strong>Institute:</strong> {item.institute}</p>}
                      {item.duration && <p className="shrink-0 text-right text-sm italic text-gray-500">{item.duration}</p>}
                    </div>
                    {(item.topicsCovered || item.description) && <p className="mt-2 leading-relaxed text-gray-600"><strong>Topics Covered:</strong> {topicsToText(item.topicsCovered || item.description)}</p>}
                  </div>
                ))}
              </section>
            )}
            {certifications.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Certifications</h2>
                {certifications.map((item, index) => (
                  <div key={index} className="mb-4 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-bold text-gray-950">{item.name}</p>
                      {item.year && <p className="shrink-0 text-right text-xs font-bold text-gray-500">{item.year}</p>}
                    </div>
                    {item.organization && <p className="mt-1 text-gray-600">{item.organization}</p>}
                    {item.credentialLink && <p className="mt-1 text-xs font-semibold text-gray-500">Credential URL: {item.credentialLink}</p>}
                  </div>
                ))}
              </section>
            )}
            {extracurricularActivities.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Extra-Curricular Activities</h2>
                {extracurricularActivities.map((item, index) => (
                  <div key={index} className="mb-4 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-bold text-gray-950">{item.activityTitle || 'Activity Title'}</p>
                      <p className="shrink-0 text-right text-xs font-bold text-gray-500">{[item.startDate, item.currentlyWorking ? 'Present' : item.endDate].filter(Boolean).join(' - ')}</p>
                    </div>
                    {(item.organization || item.role) && (
                      <div className="mt-1 flex items-start justify-between gap-4 text-gray-600">
                        {item.organization && <p>{item.organization}</p>}
                        {item.role && <p className="shrink-0 text-right"><strong>Role:</strong> {item.role}</p>}
                      </div>
                    )}
                    {item.contribution && (
                      <ul className="mt-2 space-y-1 leading-relaxed text-gray-600">
                        {linesToBullets(item.contribution).map((line, bulletIndex) => (
                          <li key={bulletIndex} className="flex gap-2">
                            <span className="shrink-0 text-gray-600">•</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </section>
            )}
            {achievements.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Achievements</h2>
                {achievements.map((item, index) => (
                  <div key={index} className="mb-4 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-bold text-gray-950">{item.achievementTitle || 'Achievement Title'}</p>
                      {item.dateYear && <p className="shrink-0 text-right text-xs font-bold text-gray-500">{item.dateYear}</p>}
                    </div>
                    {item.awardingOrganization && <p className="mt-1 text-gray-600"><strong>Awarding Organization:</strong> {item.awardingOrganization}</p>}
                    {item.description && <p className="mt-2 leading-relaxed text-gray-600">{item.description}</p>}
                  </div>
                ))}
              </section>
            )}
            {data.languages.some((item) => item.language) && (
              <section>
                <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-blue-700">Languages</h2>
                {data.languages.filter((item) => item.language).map((item, index) => <p key={index} className="text-gray-600">{item.language} - {item.proficiency}</p>)}
              </section>
            )}
          </div>
        </div>
          </section>
          )}
        </div>
      </div>

      {upgradePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
            <button onClick={() => setUpgradePrompt('')} className="ml-auto block rounded-xl bg-slate-100 p-2 text-slate-600"><X className="h-5 w-5" /></button>
            <Crown className="mx-auto mb-4 h-14 w-14 text-blue-600" />
            <h3 className="mb-3 text-2xl font-black text-gray-950">Upgrade Required</h3>
            <p className="mb-6 font-semibold leading-relaxed text-gray-600">{upgradePrompt}</p>
            <button onClick={() => navigate('/user/plans')} className="w-full rounded-xl bg-blue-600 px-5 py-3 font-black text-white">View Plans</button>
          </div>
        </div>
      )}
    </UserLayout>
  );
};

export default CVPreviewPage;
