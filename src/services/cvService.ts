import { ID, Permission, Query, Role, type Models } from 'appwrite';
import { account, assetsBucketId, collections, databaseId, databases, storage } from '../lib/appwrite';

export type UserProfile = Models.Document & {
  user_id: string;
  full_name: string;
  email: string;
  user_type: 'Student' | 'Fresh Graduate' | 'Professional';
  role: 'User' | 'Admin';
  status: 'Active' | 'Inactive';
  total_cvs: number;
  registered_at?: string;
  last_login?: string;
};

export type TemplateDoc = Models.Document & {
  name: string;
  category: string;
  tags?: string[];
  preview_image: string;
  layout_type: 'Classic' | 'Modern' | 'Minimal';
  status: 'Active' | 'Inactive';
  is_free?: boolean;
  access_type?: 'free' | 'premium';
  layout_config?: string;
  used_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type CategoryDoc = Models.Document & {
  name: string;
  description?: string;
  status: 'Active' | 'Inactive';
  templates_count?: number;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CVData = {
  title: string;
  fullName: string;
  professionalTitle: string;
  email: string;
  phone: string;
  address: string;
  linkedIn: string;
  portfolio: string;
  photoUrl?: string;
  photoShape?: 'square' | 'circle' | 'rounded';
  photoZoom?: number;
  photoPositionX?: number;
  photoPositionY?: number;
  objective?: string;
  summary: string;
  education: Array<{ degree: string; institute: string; subject: string; result: string; startYear: string; passingYear: string; currentlyStudying: boolean }>;
  internships: Array<{ internshipTitle: string; organizationName: string; duration: string; department: string; responsibilities: string; learningOutcome: string }>;
  experience: Array<{ jobTitle: string; company: string; department?: string; location: string; startDate: string; endDate: string; currentlyWorking: boolean; responsibilities: string; keyAchievements?: string }>;
  skills: Array<{ name: string; level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' }>;
  projects: Array<{ title: string; projectType?: string; role?: string; technologies: string; description: string; url: string }>;
  training: Array<{ trainingName: string; institute: string; duration: string; completionDate: string; topicsCovered?: string; description?: string }>;
  certifications: Array<{ name: string; organization: string; year: string; credentialLink: string }>;
  extracurricularActivities: Array<{ activityTitle: string; organization: string; role: string; startDate: string; endDate: string; currentlyWorking?: boolean; contribution: string }>;
  achievements: Array<{ achievementTitle: string; awardingOrganization: string; dateYear: string; description: string }>;
  languages: Array<{ language: string; proficiency: 'Basic' | 'Conversational' | 'Fluent' | 'Native' }>;
  referencesMode: 'details' | 'available';
  references: Array<{ name: string; designation: string; organization: string; email: string; phone: string }>;
  customData?: Record<string, string | Array<Record<string, string>>>;
};

export type CVDoc = Models.Document & {
  user_id: string;
  title: string;
  category?: string;
  template_id: string;
  template_name?: string;
  status: 'Draft' | 'Completed';
  cv_data?: string;
  section_order?: string;
  pdf_downloads?: number;
  docx_downloads?: number;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
};

export type SiteContentDoc = Models.Document & {
  key: string;
  hero_title: string;
  hero_subtitle?: string;
  primary_cta_text?: string;
  secondary_cta_text?: string;
  benefits_title?: string;
  benefit_items?: string;
  final_cta_title?: string;
  final_cta_subtitle?: string;
  featured_template_ids?: string[];
  updated_at?: string;
};

export type AboutDeveloperDoc = Models.Document & {
  key: string;
  developer_name: string;
  short_bio?: string;
  profile_image?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  portfolio_url?: string;
  expertise_label?: string;
  expertise_value?: string;
  skills?: string[];
  updated_at?: string;
};

const now = () => new Date().toISOString();

const userDocumentPermissions = (userId: string) => [
  Permission.read(`user:${userId}`),
  Permission.update(`user:${userId}`),
  Permission.delete(`user:${userId}`),
  Permission.read(Role.label('admin')),
  Permission.update(Role.label('admin')),
  Permission.delete(Role.label('admin')),
];

const parseCVData = (cv: CVDoc): CVData | null => {
  if (!cv.cv_data) return null;
  try {
    return JSON.parse(cv.cv_data) as CVData;
  } catch {
    return null;
  }
};

const isMissingCollection = (error: unknown) => {
  const message = String((error as { message?: string })?.message || '').toLowerCase();
  return message.includes('collection') && message.includes('not');
};

const isUnknownAttribute = (error: unknown, attribute: string) => {
  const message = String((error as { message?: string })?.message || '').toLowerCase();
  return message.includes('unknown attribute') && message.includes(attribute.toLowerCase());
};

const loadImageFile = (file: File) => new Promise<HTMLImageElement>((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(url);
    resolve(image);
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error('Failed to read image.'));
  };
  image.src = url;
});

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number) => new Promise<Blob>((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error('Failed to compress image.'));
  }, 'image/webp', quality);
});

const compressImageUnder200KB = async (file: File) => {
  const targetBytes = 200 * 1024;
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.size <= targetBytes) return file;

  const image = await loadImageFile(file);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return file;

  let maxSide = Math.min(1200, Math.max(image.naturalWidth, image.naturalHeight));
  let bestBlob: Blob | null = null;

  while (maxSide >= 320) {
    const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.92, 0.86, 0.8, 0.74, 0.68, 0.62]) {
      const blob = await canvasToBlob(canvas, quality);
      bestBlob = !bestBlob || blob.size < bestBlob.size ? blob : bestBlob;
      if (blob.size <= targetBytes) {
        return new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp', lastModified: Date.now() });
      }
    }

    maxSide = Math.floor(maxSide * 0.82);
  }

  return bestBlob ? new File([bestBlob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp', lastModified: Date.now() }) : file;
};

export const cvService = {
  parseCVData,

  getCurrentAccount: () => account.get(),

  uploadAsset: async (file: File) => {
    const currentUser = await account.get();
    const uploadFile = await compressImageUnder200KB(file);
    const permissions = [
      Permission.read(Role.any()),
      Permission.update(Role.user(currentUser.$id)),
      Permission.delete(Role.user(currentUser.$id)),
    ];

    if (currentUser.labels?.includes('admin')) {
      permissions.push(
        Permission.update(Role.label('admin')),
        Permission.delete(Role.label('admin')),
      );
    }

    const uploaded = await storage.createFile(
      assetsBucketId,
      ID.unique(),
      uploadFile,
      permissions,
    );

    return storage.getFileView(assetsBucketId, uploaded.$id);
  },

  createUserProfile: async (user: Models.User<Models.Preferences>, userType = 'Student') => {
    return databases.createDocument(
      databaseId,
      collections.userProfiles,
      user.$id,
      {
        user_id: user.$id,
        full_name: user.name,
        email: user.email,
        user_type: userType,
        role: user.labels?.includes('admin') ? 'Admin' : 'User',
        status: 'Active',
        total_cvs: 0,
        registered_at: now(),
        last_login: now(),
      },
    );
  },

  getUserProfile: async (userId: string) => {
    return databases.getDocument<UserProfile>(databaseId, collections.userProfiles, userId);
  },

  upsertUserProfile: async (userId: string, data: Partial<UserProfile>) => {
    return databases.upsertDocument<UserProfile>(
      databaseId,
      collections.userProfiles,
      userId,
      { ...data, user_id: userId },
    );
  },

  updateUserProfile: async (userId: string, data: Partial<UserProfile>) => {
    return databases.updateDocument<UserProfile>(databaseId, collections.userProfiles, userId, data);
  },

  listUserProfiles: async () => {
    try {
      return await databases.listDocuments<UserProfile>(databaseId, collections.userProfiles, [
        Query.orderDesc('$createdAt'),
        Query.limit(100),
      ]);
    } catch (error) {
      if (isMissingCollection(error)) return { documents: [], total: 0 } as Models.DocumentList<UserProfile>;
      throw error;
    }
  },

  listTemplates: async (activeOnly = false) => {
    const queries = [Query.orderDesc('$createdAt'), Query.limit(100)];
    if (activeOnly) queries.unshift(Query.equal('status', 'Active'));
    return databases.listDocuments<TemplateDoc>(databaseId, collections.templates, queries);
  },

  getTemplate: async (templateId: string) => {
    return databases.getDocument<TemplateDoc>(databaseId, collections.templates, templateId);
  },

  saveTemplate: async (templateId: string | null, data: Partial<TemplateDoc>) => {
    const payload = {
      name: data.name || 'Untitled Template',
      category: data.category || 'Professional',
      tags: data.tags || [],
      preview_image: data.preview_image || '/preview-template.png',
      layout_type: data.layout_type || 'Modern',
      status: data.status || 'Active',
      is_free: data.is_free ?? true,
      access_type: data.access_type || (data.is_free === false ? 'premium' : 'free'),
      layout_config: data.layout_config || '{}',
      used_count: data.used_count ?? 0,
      updated_at: now(),
      ...(templateId ? {} : { created_at: now() }),
    };

    const savePayload = async (nextPayload: Partial<TemplateDoc>) => {
      if (templateId) {
        return databases.updateDocument<Models.Document>(databaseId, collections.templates, templateId, nextPayload as Record<string, unknown>) as Promise<TemplateDoc>;
      }

      return databases.createDocument<Models.Document>(databaseId, collections.templates, ID.unique(), nextPayload as Record<string, unknown>) as Promise<TemplateDoc>;
    };

    try {
      return await savePayload(payload);
    } catch (error) {
      if (!isUnknownAttribute(error, 'access_type')) throw error;
      const { access_type: _accessType, ...fallbackPayload } = payload;
      return savePayload(fallbackPayload);
    }
  },

  deleteTemplate: async (templateId: string) => {
    return databases.deleteDocument(databaseId, collections.templates, templateId);
  },

  listCategories: async () => {
    return databases.listDocuments<CategoryDoc>(databaseId, collections.categories, [
      Query.orderAsc('name'),
      Query.limit(100),
    ]);
  },

  saveCategory: async (categoryId: string, data: Partial<CategoryDoc>) => {
    return databases.updateDocument<CategoryDoc>(databaseId, collections.categories, categoryId, {
      ...data,
      updated_at: now(),
    });
  },

  createCategory: async (data: Partial<CategoryDoc>) => {
    return databases.createDocument<CategoryDoc>(databaseId, collections.categories, ID.unique(), {
      name: data.name || 'Untitled Category',
      description: data.description || '',
      status: data.status || 'Active',
      templates_count: data.templates_count ?? 0,
      is_default: data.is_default ?? false,
      created_at: now(),
      updated_at: now(),
    });
  },

  listUserCVs: async (userId: string) => {
    return databases.listDocuments<CVDoc>(databaseId, collections.cvs, [
      Query.equal('user_id', userId),
      Query.orderDesc('updated_at'),
      Query.limit(100),
    ]);
  },

  cleanupExpiredDrafts: async (userId: string, maxAgeDays = 7) => {
    const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000).toISOString();
    const result = await databases.listDocuments<CVDoc>(databaseId, collections.cvs, [
      Query.equal('user_id', userId),
      Query.equal('status', 'Draft'),
      Query.lessThan('updated_at', cutoff),
      Query.limit(100),
    ]);
    await Promise.all(result.documents.map((cv) => databases.deleteDocument(databaseId, collections.cvs, cv.$id)));
    return result.documents.length;
  },

  findDraftByTemplate: async (userId: string, templateId: string) => {
    const result = await databases.listDocuments<CVDoc>(databaseId, collections.cvs, [
      Query.equal('user_id', userId),
      Query.equal('template_id', templateId),
      Query.equal('status', 'Draft'),
      Query.orderDesc('updated_at'),
      Query.limit(1),
    ]);
    return result.documents[0] || null;
  },

  listAllCVs: async () => {
    return databases.listDocuments<CVDoc>(databaseId, collections.cvs, [
      Query.orderDesc('updated_at'),
      Query.limit(100),
    ]);
  },

  getCV: async (cvId: string) => {
    return databases.getDocument<CVDoc>(databaseId, collections.cvs, cvId);
  },

  saveCV: async (cvId: string | null, userId: string, template: TemplateDoc | null, data: CVData, status: 'Draft' | 'Completed') => {
    const payload = {
      user_id: userId,
      title: data.title || template?.name || 'Untitled CV',
      category: template?.category || 'Professional',
      template_id: template?.$id || 'executive_modern',
      template_name: template?.name || 'Executive Modern v2.1',
      status,
      cv_data: JSON.stringify(data),
      section_order: JSON.stringify(['Personal Info', 'Summary', 'Education', 'Experience', 'Skills']),
      updated_at: now(),
      ...(status === 'Completed' ? { completed_at: now() } : {}),
    };

    if (cvId) {
      return databases.updateDocument<CVDoc>(databaseId, collections.cvs, cvId, payload);
    }

    return databases.createDocument<CVDoc>(
      databaseId,
      collections.cvs,
      ID.unique(),
      {
        ...payload,
        pdf_downloads: 0,
        docx_downloads: 0,
        created_at: now(),
      },
      userDocumentPermissions(userId),
    );
  },

  deleteCV: async (cvId: string) => {
    return databases.deleteDocument(databaseId, collections.cvs, cvId);
  },

  recordDownload: async (cv: CVDoc, format: 'PDF' | 'DOCX') => {
    await databases.createDocument(databaseId, collections.downloads, ID.unique(), {
      user_id: cv.user_id,
      cv_id: cv.$id,
      template_id: cv.template_id,
      format,
      file_name: `${cv.title || 'cv'}.${format.toLowerCase()}`,
      downloaded_at: now(),
    }, userDocumentPermissions(cv.user_id));

    const key = format === 'PDF' ? 'pdf_downloads' : 'docx_downloads';
    await databases.updateDocument(databaseId, collections.cvs, cv.$id, {
      [key]: (cv[key] || 0) + 1,
      updated_at: now(),
    });
  },

  getSiteContent: async () => {
    return databases.getDocument<SiteContentDoc>(databaseId, collections.siteContent, 'home');
  },

  saveSiteContent: async (data: Partial<SiteContentDoc>) => {
    return databases.upsertDocument<SiteContentDoc>(databaseId, collections.siteContent, 'home', {
      key: 'home',
      ...data,
      updated_at: now(),
    });
  },

  getAboutDeveloper: async () => {
    return databases.getDocument<AboutDeveloperDoc>(databaseId, collections.aboutDeveloper, 'developer');
  },

  saveAboutDeveloper: async (data: Partial<AboutDeveloperDoc>) => {
    return databases.upsertDocument<AboutDeveloperDoc>(databaseId, collections.aboutDeveloper, 'developer', {
      key: 'developer',
      ...data,
      updated_at: now(),
    });
  },
};
