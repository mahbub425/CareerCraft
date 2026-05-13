import type { TemplateDoc } from '../services/cvService';

export type TemplateFieldConfig = {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'url' | 'select' | 'monthYear';
  required?: boolean;
  options?: string[];
};

export type TemplateFieldSectionConfig = {
  id: string;
  label: string;
  type?: 'list' | 'single';
  fields: TemplateFieldConfig[];
};

export type TemplateFieldSchema = {
  sections?: TemplateFieldSectionConfig[];
};

export type TemplateLayoutConfig = {
  templateMode?: 'html' | 'default';
  html?: string;
  css?: string;
  theme?: Record<string, string>;
  photo?: { show?: boolean; placement?: 'left' | 'right' };
  personalInfo?: { sectionName?: string; color?: string; alignment?: 'left' | 'center' | 'right' };
  sections?: Record<string, { label?: string; visible?: boolean; order?: number; color?: string }>;
  visibility?: { showOnHome?: boolean; availableToUsers?: boolean };
  fieldSchema?: TemplateFieldSchema;
};

export const parseTemplateConfig = (template?: Pick<TemplateDoc, 'layout_config'> | null): TemplateLayoutConfig => {
  if (!template?.layout_config) return {};

  try {
    const parsed = JSON.parse(template.layout_config) as TemplateLayoutConfig;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export const stringifyTemplateConfig = (config: TemplateLayoutConfig) => JSON.stringify(config);

export const isHtmlTemplate = (template?: Pick<TemplateDoc, 'layout_config'> | null) => {
  const config = parseTemplateConfig(template);
  return config.templateMode === 'html' && Boolean(config.html?.trim());
};

export const isTemplateShownOnHome = (template: TemplateDoc) => {
  const config = parseTemplateConfig(template);
  return config.visibility?.showOnHome !== false;
};

export const isTemplateAvailableToUsers = (template: TemplateDoc) => {
  const config = parseTemplateConfig(template);
  return config.visibility?.availableToUsers !== false;
};
