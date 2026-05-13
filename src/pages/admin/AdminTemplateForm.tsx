import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { Panel } from './AdminShared';
import { cvService, type CategoryDoc, type TemplateDoc } from '../../services/cvService';
import { showToast } from '../../lib/toast';
import TemplateRenderer, { normalizeSampleTemplateCode, sampleCVData } from '../../components/cv/TemplateRenderer';
import { parseTemplateConfig, stringifyTemplateConfig, type TemplateLayoutConfig } from '../../lib/templateConfig';

const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100';
const labelClass = 'mb-2 block text-xs font-extrabold uppercase tracking-widest text-slate-600';
const allTags = ['Simple', 'Modern', 'ATS Friendly', 'One Page', 'With Photo', 'Without Photo'];
const defaultFieldSchemaCode = `{
  "sections": [
    {
      "id": "skillGroups",
      "label": "Skill Categories",
      "type": "list",
      "fields": [
        { "name": "category", "label": "Category", "type": "text" },
        { "name": "items", "label": "Skills", "type": "textarea" }
      ]
    }
  ]
}`;
const sampleTemplateCode = `<style>
.cv-template {
  font-family: Arial, sans-serif;
  color: var(--cv-text, #111827);
  line-height: 1.45;
}
.cv-template header {
  border-bottom: 4px solid var(--cv-primary, #2563eb);
  padding-bottom: 24px;
  margin-bottom: 32px;
  text-align: var(--cv-personal-align, left);
}
.cv-template h1 {
  margin: 0;
  color: var(--cv-personal-color, #111827);
  font-size: 34px;
  font-weight: 900;
}
.cv-template h2 {
  margin: 0 0 12px;
  color: var(--cv-heading, #1d4ed8);
  font-size: 13px;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.cv-template section {
  margin-bottom: 23px;
}
.cv-template img {
  width: 96px;
  height: 112px;
  border-radius: 12px;
  float: right;
}
</style>
<div class="cv-template">
  <header>
    {{photo}}
    <h1>{{fullName}}</h1>
    <p>{{professionalTitle}}</p>
    <p>{{email}} | {{phone}} | {{address}}</p>
    <p>{{linkedIn}} | {{portfolio}}</p>
  </header>

  <section>
    <h2>Summary</h2>
    <p>{{summary}}</p>
  </section>

  <section>
    <h2>Internship</h2>
    {{internships}}
  </section>

  <section>
    <h2>Experience</h2>
    {{experience}}
  </section>

  <section>
    <h2>Education</h2>
    {{education}}
  </section>

  <section>
    <h2>Projects</h2>
    {{projects}}
  </section>

  <section>
    <h2>Skills</h2>
    {{skills}}
  </section>

  <section>
    <h2>Training</h2>
    {{training}}
  </section>

  <section>
    <h2>Skill Categories</h2>
    {{skillGroups}}
  </section>

  <section>
    <h2>Certifications</h2>
    {{certifications}}
  </section>

  <section>
    <h2>Extra-Curricular Activities</h2>
    {{extracurricularActivities}}
  </section>

  <section>
    <h2>Achievements</h2>
    {{achievements}}
  </section>

  <section>
    <h2>Languages</h2>
    {{languages}}
  </section>

  <section>
    <h2>References</h2>
    {{references}}
  </section>
</div>`;
const placeholderGroups = [
  ['{{fullName}}', '{{professionalTitle}}', '{{summary}}', '{{photo}}'],
  ['{{email}}', '{{phone}}', '{{address}}', '{{linkedIn}}', '{{portfolio}}'],
  ['{{skills}}', '{{internships}}', '{{experience}}', '{{education}}', '{{projects}}'],
  ['{{certifications}}', '{{extracurricularActivities}}', '{{achievements}}'],
  ['{{languages}}', '{{references}}'],
  ['{{photoUrl}}', '{{degree}}', '{{institute}}', '{{jobTitle}}', '{{company}}'],
  ['{{internshipTitle}}', '{{internshipOrganization}}', '{{internshipDuration}}', '{{internshipDepartment}}'],
  ['{{internshipResponsibilities}}', '{{learningOutcome}}'],
  ['{{projectName}}', '{{projectTitle}}', '{{projectType}}', '{{projectRole}}'],
  ['{{technologies}}', '{{projectDescription}}', '{{projectUrl}}'],
  ['{{training}}', '{{trainingName}}', '{{trainingInstitute}}', '{{trainingDuration}}'],
  ['{{trainingCompletionDate}}', '{{trainingTopics}}', '{{topicsCovered}}'],
  ['{{activityTitle}}', '{{activityOrganization}}', '{{activityRole}}', '{{contribution}}'],
  ['{{activityStartDate}}', '{{activityEndDate}}'],
  ['{{achievementTitle}}', '{{awardingOrganization}}', '{{achievementDateYear}}'],
  ['{{achievementDescription}}'],
  ['{{certificationName}}', '{{language}}'],
  ['{{skillGroups}}'],
];

const AdminTemplateForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Professional');
  const [layoutType, setLayoutType] = useState<'Classic' | 'Modern' | 'Minimal'>('Modern');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [accessType, setAccessType] = useState<'free' | 'premium'>('free');
  const [tags, setTags] = useState<string[]>(['Modern']);
  const [previewImage, setPreviewImage] = useState('/preview-template.png');
  const [code, setCode] = useState(sampleTemplateCode);
  const [schemaCode, setSchemaCode] = useState(defaultFieldSchemaCode);
  const [showOnHome, setShowOnHome] = useState(true);
  const [availableToUsers, setAvailableToUsers] = useState(true);
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [textColor, setTextColor] = useState('#111827');
  const [headingColor, setHeadingColor] = useState('#1d4ed8');
  const [personalColor, setPersonalColor] = useState('#111827');
  const [personalAlignment, setPersonalAlignment] = useState<'left' | 'center' | 'right'>('left');
  const [photoShow, setPhotoShow] = useState(true);
  const [photoPlacement, setPhotoPlacement] = useState<'left' | 'right'>('right');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const canSave = Boolean(name.trim() && category.trim() && !saving);

  useEffect(() => {
    cvService.listCategories().then((result) => setCategories(result.documents));
    if (id) {
      cvService.getTemplate(id).then((template) => {
        setName(template.name);
        setCategory(template.category);
        setLayoutType(template.layout_type);
        setStatus(template.status);
        setAccessType(template.access_type || (template.is_free === false ? 'premium' : 'free'));
        setTags(template.tags || []);
        setPreviewImage(template.preview_image);
        const config = parseTemplateConfig(template);
        setCode(config.css ? `<style>\n${config.css}\n</style>\n${config.html || ''}` : config.html || '');
        setSchemaCode(config.fieldSchema ? JSON.stringify(config.fieldSchema, null, 2) : defaultFieldSchemaCode);
        setShowOnHome(config.visibility?.showOnHome !== false);
        setAvailableToUsers(config.visibility?.availableToUsers !== false);
        setPrimaryColor(config.theme?.primaryColor || '#2563eb');
        setTextColor(config.theme?.textColor || '#111827');
        setHeadingColor(config.theme?.headingColor || '#1d4ed8');
        setPersonalColor(config.personalInfo?.color || '#111827');
        setPersonalAlignment(config.personalInfo?.alignment || 'left');
        setPhotoShow(config.photo?.show !== false);
        setPhotoPlacement(config.photo?.placement || 'right');
      });
    }
  }, [id]);

  const splitCode = (value: string) => {
    const styleMatch = value.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    const css = styleMatch?.[1]?.trim() || '';
    const html = value.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').trim();
    return { html, css };
  };

  const parseFieldSchema = () => {
    const trimmed = schemaCode.trim();
    if (!trimmed) return undefined;
    return JSON.parse(trimmed);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (!name.trim() || !category.trim()) {
      setMessage('Template name and category are required.');
      return;
    }
    setSaving(true);
    try {
      const split = splitCode(code);
      const fieldSchema = parseFieldSchema();
      const layoutConfig: TemplateLayoutConfig = {
        templateMode: split.html.trim() ? 'html' : 'default',
        html: normalizeSampleTemplateCode(split.html),
        css: split.css,
        theme: { primaryColor, textColor, headingColor },
        personalInfo: { color: personalColor, alignment: personalAlignment },
        photo: { show: photoShow, placement: photoPlacement },
        visibility: { showOnHome, availableToUsers },
        fieldSchema,
      };

      await cvService.saveTemplate(id || null, {
        name,
        category,
        layout_type: layoutType,
        status,
        access_type: accessType,
        is_free: accessType === 'free',
        tags,
        preview_image: previewImage,
        layout_config: stringifyTemplateConfig(layoutConfig),
      });
      showToast(id ? 'Template customized successfully.' : 'Template added to gallery successfully.');
      setMessage(id ? 'Template customized successfully.' : 'Template added to gallery successfully.');
      navigate('/admin/template-gallery');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save template. Check template schema JSON.';
      setMessage(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const createCategory = async () => {
    const nextName = newCategoryName.trim();
    if (!nextName) return;
    try {
      const created = await cvService.createCategory({ name: nextName, description: '', status: 'Active', is_default: false });
      setCategories((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setCategory(created.name);
      setNewCategoryName('');
      showToast('Category created successfully.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create category.', 'error');
    }
  };

  const splitPreview = splitCode(code);
  let previewFieldSchema: TemplateLayoutConfig['fieldSchema'];
  try {
    previewFieldSchema = parseFieldSchema();
  } catch {
    previewFieldSchema = undefined;
  }
  const previewTemplate = {
    $id: id || 'preview',
    $collectionId: 'templates',
    $databaseId: '',
    $createdAt: '',
    $updatedAt: '',
    $sequence: '0',
    $permissions: [],
    name: name || 'Template Preview',
    category,
    tags,
    preview_image: previewImage,
    layout_type: layoutType,
    status,
    layout_config: stringifyTemplateConfig({
      templateMode: splitPreview.html.trim() ? 'html' : 'default',
      html: splitPreview.html,
      css: splitPreview.css,
      theme: { primaryColor, textColor, headingColor },
      personalInfo: { color: personalColor, alignment: personalAlignment },
      photo: { show: photoShow, placement: photoPlacement },
      visibility: { showOnHome, availableToUsers },
      fieldSchema: previewFieldSchema,
    }),
  } as TemplateDoc;

  const toggleTag = (tag: string) => {
    setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  };

  const uploadPreviewImage = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await cvService.uploadAsset(file);
      setPreviewImage(url);
      showToast('Preview image uploaded successfully.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to upload preview image.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout title={id ? 'Customize Template' : 'Template Builder'}>
      <Panel title={id ? 'Customize Template' : 'Template Builder'}>
        {message && <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 font-bold text-red-600">{message}</div>}
        <div>
          <form onSubmit={save} className="grid gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Template Name</label>
              <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Executive Modern" />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select className={inputClass} value={category} onChange={(event) => setCategory(event.target.value)}>
                {!categories.some((item) => item.name === category) && <option value={category}>{category || 'Select category'}</option>}
                {categories.map((item) => <option key={item.$id}>{item.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Create Category</label>
              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <input className={inputClass} value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="New category name" />
                <button type="button" onClick={() => void createCategory()} className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700">Add Category</button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Layout Type</label>
              <select className={inputClass} value={layoutType} onChange={(event) => setLayoutType(event.target.value as 'Classic' | 'Modern' | 'Minimal')}>
                <option>Classic</option>
                <option>Modern</option>
                <option>Minimal</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value as 'Active' | 'Inactive')}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Access</label>
              <select className={inputClass} value={accessType} onChange={(event) => setAccessType(event.target.value as 'free' | 'premium')}>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Tags</label>
              <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                {allTags.map((tag) => (
                  <label key={tag} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
                    <input type="checkbox" checked={tags.includes(tag)} onChange={() => toggleTag(tag)} className="mr-2 accent-blue-600" />
                    {tag}
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
              <label className="flex items-center gap-3 text-sm font-bold text-slate-700"><input type="checkbox" checked={showOnHome} onChange={(event) => setShowOnHome(event.target.checked)} className="accent-blue-600" /> Show on home page</label>
              <label className="flex items-center gap-3 text-sm font-bold text-slate-700"><input type="checkbox" checked={availableToUsers} onChange={(event) => setAvailableToUsers(event.target.checked)} className="accent-blue-600" /> Available to users</label>
            </div>
            {id && (
              <div className="md:col-span-2 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
                <div>
                  <label className={labelClass}>Template Color</label>
                  <input type="color" className="h-12 w-full rounded-xl border border-slate-200 bg-white p-1" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Text Color</label>
                  <input type="color" className="h-12 w-full rounded-xl border border-slate-200 bg-white p-1" value={textColor} onChange={(event) => setTextColor(event.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Section Heading Color</label>
                  <input type="color" className="h-12 w-full rounded-xl border border-slate-200 bg-white p-1" value={headingColor} onChange={(event) => setHeadingColor(event.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Personal Info Color</label>
                  <input type="color" className="h-12 w-full rounded-xl border border-slate-200 bg-white p-1" value={personalColor} onChange={(event) => setPersonalColor(event.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Personal Info Align</label>
                  <select className={inputClass} value={personalAlignment} onChange={(event) => setPersonalAlignment(event.target.value as 'left' | 'center' | 'right')}>
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Photo Placement</label>
                  <select className={inputClass} value={photoPlacement} onChange={(event) => setPhotoPlacement(event.target.value as 'left' | 'right')}>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <label className="flex items-center gap-3 text-sm font-bold text-slate-700"><input type="checkbox" checked={photoShow} onChange={(event) => setPhotoShow(event.target.checked)} className="accent-blue-600" /> Show photo when user adds one</label>
              </div>
            )}
            <div className="md:col-span-2">
              <label className={labelClass}>Template Code Editor</label>
              <div className="mb-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-blue-900">Available placeholders</p>
                    <p className="text-xs font-semibold text-blue-700">Use these inside your HTML. Ask AI to generate a CV template using this sample and placeholders, then replace the code here.</p>
                  </div>
                  <button type="button" onClick={() => setCode(sampleTemplateCode)} className="rounded-xl bg-white px-4 py-2 text-sm font-black text-blue-700 ring-1 ring-blue-100">Load Sample Code</button>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {placeholderGroups.map((group) => (
                    <div key={group.join('-')} className="flex flex-wrap gap-2">
                      {group.map((placeholder) => <code key={placeholder} className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-slate-700 ring-1 ring-blue-100">{placeholder}</code>)}
                    </div>
                  ))}
                </div>
              </div>
              <textarea className={`${inputClass} min-h-[520px] font-mono text-xs leading-relaxed`} value={code} onChange={(event) => setCode(event.target.value)} placeholder="<style>...</style><div>{{fullName}}</div>" />
              <p className="mt-2 text-xs font-semibold text-slate-500">HTML and CSS stay together here. Use placeholders like {'{{fullName}}'}, {'{{summary}}'}, {'{{skills}}'}.</p>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Template Field Schema</label>
              <div className="mb-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-emerald-900">Custom input fields for this template</p>
                    <p className="text-xs font-semibold text-emerald-700">Only add schema when the template needs extra fields beyond standard CV data. Section id becomes the placeholder name, for example {'{{skillGroups}}'}.</p>
                  </div>
                  <button type="button" onClick={() => setSchemaCode(defaultFieldSchemaCode)} className="rounded-xl bg-white px-4 py-2 text-sm font-black text-emerald-700 ring-1 ring-emerald-100">Load Sample Schema</button>
                </div>
              </div>
              <textarea className={`${inputClass} min-h-[260px] font-mono text-xs leading-relaxed`} value={schemaCode} onChange={(event) => setSchemaCode(event.target.value)} placeholder={defaultFieldSchemaCode} />
              <p className="mt-2 text-xs font-semibold text-slate-500">This JSON is saved inside template layout_config. User answers are saved inside each CV's cv_data.customData, so old CV data stays untouched.</p>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Preview Image URL</label>
              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <input className={inputClass} value={previewImage} onChange={(event) => setPreviewImage(event.target.value)} placeholder="/preview-template.png" />
                <label className="flex items-center justify-center rounded-xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 hover:bg-blue-100">
                  {uploading ? 'Uploading...' : 'Upload Image'}
                  <input type="file" accept="image/*" disabled={uploading} onChange={(event) => void uploadPreviewImage(event.target.files?.[0])} className="hidden" />
                </label>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-500">Paste an image URL or upload JPG/PNG/WebP/SVG to the common assets bucket.</p>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="button" onClick={() => setPreviewOpen(true)} className="rounded-xl border border-blue-100 bg-blue-50 px-6 py-3 font-bold text-blue-700">Preview</button>
              <button
                type="submit"
                disabled={!canSave}
                className={`rounded-xl px-6 py-3 font-bold text-white transition ${canSave ? 'cursor-pointer bg-blue-600 hover:bg-blue-700' : 'cursor-not-allowed bg-slate-300'}`}
              >
                {saving ? 'Saving...' : id ? 'Save Customization' : 'Add to Template Gallery'}
              </button>
              <button type="button" onClick={() => navigate('/admin/template-gallery')} className="rounded-xl border border-slate-200 px-6 py-3 font-bold text-slate-700">Cancel</button>
            </div>
          </form>
        </div>
      </Panel>
      {previewOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-slate-100 shadow-2xl">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-blue-600">Template Preview</p>
                <h3 className="text-xl font-black text-slate-950">{name || 'Template Preview'}</h3>
                <p className="mt-1 text-sm text-slate-500">Review how the current template renders before saving it to the gallery.</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                Close Preview
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="mx-auto max-w-[calc(100vw-4rem)] rounded-3xl bg-white p-4 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200">
                <div className="cv-preview-shell rounded-3xl bg-slate-100 p-4">
                  <div className="cv-preview-scale">
                    <TemplateRenderer data={sampleCVData} template={previewTemplate} previewId="admin-template-preview" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTemplateForm;
