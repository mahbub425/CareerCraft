const studentFreshTwoColumnHtml = `
<div class="sf-two-column">
  <aside class="sf-sidebar">
    <div class="sf-photo" data-field="photo">{{photo}}</div>
    <h1>{{fullName}}</h1>
    <p class="sf-title">{{professionalTitle}}</p>
    <section class="sf-contact">
      <h2>Contact</h2>
      <p>{{email}}</p>
      <p>{{phone}}</p>
      <p>{{address}}</p>
      <p>{{linkedIn}}</p>
      <p>{{portfolio}}</p>
    </section>
    <section>
      <h2>Skills</h2>
      <div class="sf-pills">{{skills}}</div>
    </section>
    <section>
      <h2>Languages</h2>
      {{languages}}
    </section>
    <section>
      <h2>Certifications</h2>
      {{certifications}}
    </section>
  </aside>
  <main class="sf-main" data-main>
    <section class="sf-profile">
      <h2>Career Objective</h2>
      <p>{{summary}}</p>
    </section>
    <section>
      <h2>Education</h2>
      {{education}}
    </section>
    <section>
      <h2>Internship Experience</h2>
      {{internships}}
    </section>
    <section>
      <h2>Academic Projects</h2>
      {{projects}}
    </section>
    <section>
      <h2>Training</h2>
      {{training}}
    </section>
    <section>
      <h2>Activities</h2>
      {{extracurricularActivities}}
    </section>
    <section>
      <h2>Achievements</h2>
      {{achievements}}
    </section>
    <section>
      <h2>References</h2>
      {{references}}
    </section>
  </main>
</div>`.trim();

const studentFreshTwoColumnCss = `
.sf-two-column {
  display: grid;
  grid-template-columns: 245px 1fr;
  min-height: 1123px;
  background: #ffffff;
  color: #172033;
  font-family: Arial, sans-serif;
  line-height: 1.45;
}
.sf-two-column .sf-sidebar {
  background: #12324a;
  color: #f8fafc;
  padding: 34px 24px;
}
.sf-two-column .sf-main {
  padding: 38px 42px;
}
.sf-two-column .sf-photo {
  width: 126px;
  height: 126px;
  margin: 0 0 22px;
  overflow: hidden;
  border: 4px solid rgba(255,255,255,.7);
  border-radius: 18px;
  background: rgba(255,255,255,.12);
}
.sf-two-column .sf-photo:empty {
  display: none;
}
.sf-two-column h1 {
  margin: 0;
  color: #ffffff;
  font-size: 28px;
  font-weight: 900;
  line-height: 1.05;
}
.sf-two-column .sf-title {
  margin: 10px 0 26px;
  color: #b7e4d8;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}
.sf-two-column h2 {
  margin: 0 0 12px;
  border-bottom: 2px solid #49b69f;
  padding-bottom: 7px;
  color: #12324a;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.sf-two-column .sf-sidebar h2 {
  border-color: rgba(255,255,255,.28);
  color: #ffffff;
}
.sf-two-column section {
  margin: 0 0 22px;
  break-inside: avoid;
}
.sf-two-column p {
  margin: 0 0 7px;
  font-size: 12px;
}
.sf-two-column .sf-main p,
.sf-two-column .sf-main div,
.sf-two-column .sf-main li {
  font-size: 12px;
}
.sf-two-column .cv-entry {
  margin-bottom: 14px;
}
.sf-two-column .cv-entry-head {
  align-items: baseline;
}
.sf-two-column .cv-entry strong {
  color: #172033;
}
.sf-two-column .sf-sidebar .cv-entry strong,
.sf-two-column .sf-sidebar p,
.sf-two-column .sf-sidebar div {
  color: #f8fafc;
  font-size: 11px;
  overflow-wrap: anywhere;
}
.sf-two-column .cv-skill-pill {
  margin: 0 6px 7px 0 !important;
  background: rgba(255,255,255,.14) !important;
  color: #ffffff !important;
  border: 1px solid rgba(255,255,255,.18);
}
.sf-two-column .cv-bullet-list li::before {
  color: #49b69f !important;
}
`.trim();

const studentFreshTwoColumnLayout = {
  templateMode: 'html',
  html: studentFreshTwoColumnHtml,
  css: studentFreshTwoColumnCss,
  theme: {
    primaryColor: '#49b69f',
    textColor: '#172033',
    headingColor: '#12324a',
  },
  personalInfo: {
    color: '#ffffff',
    alignment: 'left',
  },
  photo: {
    show: true,
    placement: 'left',
  },
  visibility: {
    showOnHome: true,
    availableToUsers: true,
  },
};

export const studentFreshTwoColumnTemplateSeeds = [
  {
    id: 'student_two_column',
    data: {
      name: 'Student Two Column',
      category: 'Student',
      tags: ['Modern', 'One Page', 'With Photo', 'ATS Friendly', 'Fresh Graduate'],
      preview_image: '/preview-student-fresh-two-column.svg',
      layout_type: 'Modern',
      status: 'Active',
      is_free: true,
      access_type: 'free',
      layout_config: JSON.stringify(studentFreshTwoColumnLayout),
      used_count: 0,
    },
  },
  {
    id: 'fresh_graduate_two_column',
    data: {
      name: 'Fresh Graduate Two Column',
      category: 'Fresh Graduate',
      tags: ['Modern', 'One Page', 'With Photo', 'ATS Friendly', 'Student'],
      preview_image: '/preview-student-fresh-two-column.svg',
      layout_type: 'Modern',
      status: 'Active',
      is_free: true,
      access_type: 'free',
      layout_config: JSON.stringify(studentFreshTwoColumnLayout),
      used_count: 0,
    },
  },
];

const sectionSetByAudience = {
  Student: [
    ['Career Objective', '{{summary}}'],
    ['Education', '{{education}}'],
    ['Internship Experience', '{{internships}}'],
    ['Work / Campus Experience', '{{experience}}'],
    ['Academic Projects', '{{projects}}'],
    ['Training', '{{training}}'],
    ['Activities', '{{extracurricularActivities}}'],
    ['Achievements', '{{achievements}}'],
    ['References', '{{references}}'],
  ],
  'Fresh Graduate': [
    ['Profile', '{{summary}}'],
    ['Education', '{{education}}'],
    ['Internship Experience', '{{internships}}'],
    ['Entry-Level / Part-Time Experience', '{{experience}}'],
    ['Projects', '{{projects}}'],
    ['Training', '{{training}}'],
    ['Achievements', '{{achievements}}'],
    ['References', '{{references}}'],
  ],
  Professional: [
    ['Professional Summary', '{{summary}}'],
    ['Work Experience', '{{experience}}'],
    ['Projects', '{{projects}}'],
    ['Education', '{{education}}'],
    ['Training', '{{training}}'],
    ['Certifications', '{{certifications}}'],
    ['Achievements', '{{achievements}}'],
    ['References', '{{references}}'],
  ],
};

const sectionHtml = (audience) => sectionSetByAudience[audience]
  .map(([title, placeholder]) => `<section><h2>${title}</h2>${placeholder}</section>`)
  .join('\n    ');

const atsHtml = (audience, className) => `
<div class="${className}">
  <header>
    <h1>{{fullName}}</h1>
    <p class="role">{{professionalTitle}}</p>
    <p class="contact">{{email}} | {{phone}} | {{address}}</p>
    <p class="contact">{{linkedIn}} | {{portfolio}}</p>
  </header>
  <main data-main>
    ${sectionHtml(audience)}
  </main>
  <aside>
    <section>
      <h2>Skills</h2>
      {{skills}}
    </section>
    <section>
      <h2>Languages</h2>
      {{languages}}
    </section>
  </aside>
</div>`.trim();

const normalHtml = (audience, className, withPhoto = true) => `
<div class="${className}">
  <header>
    ${withPhoto ? '<div class="photo" data-field="photo">{{photo}}</div>' : ''}
    <div>
      <h1>{{fullName}}</h1>
      <p class="role">{{professionalTitle}}</p>
      <p class="contact">{{email}} | {{phone}} | {{address}}</p>
      <p class="contact">{{linkedIn}} | {{portfolio}}</p>
    </div>
  </header>
  <div class="content">
    <main data-main>
      ${sectionHtml(audience)}
    </main>
    <aside>
      <section>
        <h2>Skills</h2>
        {{skills}}
      </section>
      <section>
        <h2>Languages</h2>
        {{languages}}
      </section>
      <section>
        <h2>Certifications</h2>
        {{certifications}}
      </section>
    </aside>
  </div>
</div>`.trim();

const atsCss = (className, accent, heading, subtle) => `
.${className} {
  min-height: 1123px;
  padding: 42px 48px;
  background: #ffffff;
  color: #111827;
  font-family: Arial, sans-serif;
  line-height: 1.44;
}
.${className} header {
  border-bottom: 3px solid ${accent};
  padding-bottom: 18px;
  margin-bottom: 24px;
}
.${className} h1 {
  margin: 0;
  color: #111827;
  font-size: 34px;
  font-weight: 900;
  line-height: 1.1;
}
.${className} .role {
  margin: 8px 0 10px;
  color: ${heading};
  font-size: 15px;
  font-weight: 800;
}
.${className} .contact {
  margin: 3px 0;
  color: #4b5563;
  font-size: 11px;
}
.${className} main,
.${className} aside {
  display: block;
}
.${className} section {
  margin: 0 0 20px;
  break-inside: avoid;
}
.${className} h2 {
  margin: 0 0 10px;
  border-bottom: 1px solid ${subtle};
  padding-bottom: 6px;
  color: ${heading};
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.${className} p,
.${className} div,
.${className} li {
  font-size: 12px;
}
.${className} .cv-entry {
  margin-bottom: 13px;
}
.${className} .cv-entry strong {
  color: #111827;
}
.${className} .cv-entry-head {
  align-items: baseline;
}
.${className} .cv-skill-pill {
  background: ${subtle} !important;
  color: ${heading} !important;
}
`.trim();

const normalCss = (className, accent, sidebar, pale) => `
.${className} {
  min-height: 1123px;
  background: #ffffff;
  color: #172033;
  font-family: Arial, sans-serif;
  line-height: 1.45;
}
.${className} header {
  display: flex;
  gap: 22px;
  align-items: center;
  background: ${sidebar};
  padding: 36px 42px;
  color: #ffffff;
}
.${className} .photo {
  width: 112px;
  height: 112px;
  overflow: hidden;
  border: 3px solid rgba(255,255,255,.75);
  border-radius: 16px;
  background: rgba(255,255,255,.14);
  flex: 0 0 auto;
}
.${className} .photo:empty {
  display: none;
}
.${className} h1 {
  margin: 0;
  color: #ffffff;
  font-size: 32px;
  font-weight: 900;
  line-height: 1.1;
}
.${className} .role {
  margin: 8px 0 10px;
  color: ${pale};
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
}
.${className} .contact {
  margin: 3px 0;
  color: rgba(255,255,255,.88);
  font-size: 11px;
}
.${className} .content {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 30px;
  padding: 34px 42px 42px;
}
.${className} aside {
  border-left: 3px solid ${pale};
  padding-left: 22px;
}
.${className} section {
  margin: 0 0 21px;
  break-inside: avoid;
}
.${className} h2 {
  margin: 0 0 11px;
  color: ${accent};
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.${className} h2::after {
  content: "";
  display: block;
  width: 46px;
  height: 2px;
  margin-top: 6px;
  background: ${accent};
}
.${className} p,
.${className} div,
.${className} li {
  font-size: 12px;
}
.${className} .cv-entry {
  margin-bottom: 14px;
}
.${className} .cv-entry-head {
  align-items: baseline;
}
.${className} .cv-skill-pill {
  background: ${pale} !important;
  color: ${accent} !important;
}
`.trim();

const layoutConfig = ({ html, css, accent, heading, showPhoto }) => ({
  templateMode: 'html',
  html,
  css,
  theme: {
    primaryColor: accent,
    textColor: '#172033',
    headingColor: heading,
  },
  personalInfo: {
    color: showPhoto ? '#ffffff' : '#111827',
    alignment: 'left',
  },
  photo: {
    show: showPhoto,
    placement: 'left',
  },
  visibility: {
    showOnHome: true,
    availableToUsers: true,
  },
});

const categorySlug = {
  Student: 'student',
  'Fresh Graduate': 'fresh_graduate',
  Professional: 'professional',
};

const previewImage = '/preview-student-fresh-two-column.svg';

const templateSpec = [
  ['ats_slate', 'Modern ATS Slate', 'Modern', 'ATS Friendly', '#2563eb', '#1d4ed8', '#dbeafe', false],
  ['ats_emerald', 'Modern ATS Emerald', 'Modern', 'ATS Friendly', '#059669', '#047857', '#d1fae5', false],
  ['ats_crimson', 'Modern ATS Crimson', 'Modern', 'ATS Friendly', '#dc2626', '#991b1b', '#fee2e2', false],
  ['normal_sidebar', 'Normal Sidebar', 'Classic', 'Simple', '#0f766e', '#134e4a', '#ccfbf1', true],
  ['normal_clean', 'Normal Clean', 'Minimal', 'Simple', '#334155', '#1e293b', '#e2e8f0', false],
  ['normal_accent', 'Normal Accent', 'Modern', 'One Page', '#7c3aed', '#4c1d95', '#ede9fe', true],
];

const makeTemplateSeed = (audience, [key, label, layoutType, tag, accent, heading, subtle, showPhoto]) => {
  const isAts = key.startsWith('ats_');
  const className = `${categorySlug[audience]}-${key}`;
  const html = isAts ? atsHtml(audience, className) : normalHtml(audience, className, showPhoto);
  const css = isAts ? atsCss(className, accent, heading, subtle) : normalCss(className, accent, heading, subtle);

  return {
    id: `${categorySlug[audience]}_${key}`,
    data: {
      name: `${audience} ${label}`,
      category: audience,
      tags: isAts
        ? ['Modern', 'ATS Friendly', 'One Page', showPhoto ? 'With Photo' : 'Without Photo']
        : [tag, layoutType, 'One Page', showPhoto ? 'With Photo' : 'Without Photo'],
      preview_image: previewImage,
      layout_type: layoutType,
      status: 'Active',
      is_free: true,
      access_type: 'free',
      layout_config: JSON.stringify(layoutConfig({ html, css, accent, heading, showPhoto })),
      used_count: 0,
    },
  };
};

export const expandedCategoryTemplateSeeds = ['Student', 'Fresh Graduate', 'Professional']
  .flatMap((audience) => templateSpec.map((spec) => makeTemplateSeed(audience, spec)));

export const allTemplateSeeds = [
  ...studentFreshTwoColumnTemplateSeeds,
  ...expandedCategoryTemplateSeeds,
];
