import {
  Client,
  Databases,
  DatabasesIndexType,
  Permission,
  Role,
  Storage,
} from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const {
  VITE_APPWRITE_ENDPOINT,
  VITE_APPWRITE_PROJECT_ID,
  VITE_APPWRITE_DATABASE_ID,
  APPWRITE_API_KEY,
} = process.env;

const databaseName = 'CareerCraft CV Builder';

const requiredEnv = {
  VITE_APPWRITE_ENDPOINT,
  VITE_APPWRITE_PROJECT_ID,
  VITE_APPWRITE_DATABASE_ID,
  APPWRITE_API_KEY,
};

const missingEnv = Object.entries(requiredEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingEnv.length) {
  console.error(`Missing required env value(s): ${missingEnv.join(', ')}`);
  process.exit(1);
}

const client = new Client()
  .setEndpoint(VITE_APPWRITE_ENDPOINT)
  .setProject(VITE_APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const adminOnly = [
  Permission.read(Role.label('admin')),
  Permission.create(Role.label('admin')),
  Permission.update(Role.label('admin')),
  Permission.delete(Role.label('admin')),
];

const publicReadAdminWrite = [
  Permission.read(Role.any()),
  Permission.create(Role.label('admin')),
  Permission.update(Role.label('admin')),
  Permission.delete(Role.label('admin')),
];

const usersAndAdmin = [
  Permission.read(Role.users()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
  Permission.read(Role.label('admin')),
  Permission.create(Role.label('admin')),
  Permission.update(Role.label('admin')),
  Permission.delete(Role.label('admin')),
];

const adminReadableUserCreate = [
  Permission.read(Role.label('admin')),
  Permission.create(Role.users()),
  Permission.create(Role.label('admin')),
  Permission.update(Role.label('admin')),
  Permission.delete(Role.label('admin')),
];

const collections = [
  {
    id: 'user_profiles',
    name: 'User Profiles',
    permissions: usersAndAdmin,
    documentSecurity: true,
    attributes: [
      { type: 'string', key: 'user_id', size: 255, required: true },
      { type: 'string', key: 'full_name', size: 255, required: true },
      { type: 'string', key: 'email', size: 320, required: true },
      {
        type: 'enum',
        key: 'user_type',
        elements: ['Student', 'Fresh Graduate', 'Professional'],
        required: false,
        default: 'Student',
      },
      { type: 'enum', key: 'role', elements: ['User', 'Admin'], required: false, default: 'User' },
      { type: 'enum', key: 'status', elements: ['Active', 'Inactive'], required: false, default: 'Active' },
      { type: 'integer', key: 'total_cvs', required: false, min: 0, default: 0 },
      { type: 'datetime', key: 'registered_at', required: false },
      { type: 'datetime', key: 'last_login', required: false },
    ],
    indexes: [
      { key: 'user_profiles_user_id_idx', attributes: ['user_id'] },
      { key: 'user_profiles_email_idx', attributes: ['email'] },
      { key: 'user_profiles_role_idx', attributes: ['role'] },
      { key: 'user_profiles_status_idx', attributes: ['status'] },
    ],
  },
  {
    id: 'cvs',
    name: 'CVs',
    permissions: usersAndAdmin,
    documentSecurity: true,
    attributes: [
      { type: 'string', key: 'user_id', size: 255, required: true },
      { type: 'string', key: 'title', size: 255, required: true },
      { type: 'string', key: 'category', size: 255, required: false },
      { type: 'string', key: 'template_id', size: 255, required: true },
      { type: 'string', key: 'template_name', size: 255, required: false },
      { type: 'enum', key: 'status', elements: ['Draft', 'Completed'], required: false, default: 'Draft' },
      { type: 'string', key: 'cv_data', size: 65535, required: false },
      { type: 'string', key: 'section_order', size: 2000, required: false },
      { type: 'integer', key: 'pdf_downloads', required: false, min: 0, default: 0 },
      { type: 'integer', key: 'docx_downloads', required: false, min: 0, default: 0 },
      { type: 'datetime', key: 'created_at', required: false },
      { type: 'datetime', key: 'updated_at', required: false },
      { type: 'datetime', key: 'completed_at', required: false },
    ],
    indexes: [
      { key: 'cvs_user_id_idx', attributes: ['user_id'] },
      { key: 'cvs_template_id_idx', attributes: ['template_id'] },
      { key: 'cvs_status_idx', attributes: ['status'] },
      { key: 'cvs_updated_at_idx', attributes: ['updated_at'] },
    ],
  },
  {
    id: 'templates',
    name: 'Templates',
    permissions: publicReadAdminWrite,
    documentSecurity: false,
    attributes: [
      { type: 'string', key: 'name', size: 255, required: true },
      { type: 'string', key: 'category', size: 255, required: true },
      { type: 'string', key: 'tags', size: 100, required: false, array: true },
      { type: 'string', key: 'preview_image', size: 1000, required: true },
      { type: 'enum', key: 'layout_type', elements: ['Classic', 'Modern', 'Minimal'], required: false, default: 'Modern' },
      { type: 'enum', key: 'status', elements: ['Active', 'Inactive'], required: false, default: 'Active' },
      { type: 'boolean', key: 'is_free', required: false, default: true },
      { type: 'enum', key: 'access_type', elements: ['free', 'premium'], required: false, default: 'free' },
      { type: 'string', key: 'layout_config', size: 65535, required: false },
      { type: 'integer', key: 'used_count', required: false, min: 0, default: 0 },
      { type: 'datetime', key: 'created_at', required: false },
      { type: 'datetime', key: 'updated_at', required: false },
    ],
    indexes: [
      { key: 'templates_category_idx', attributes: ['category'] },
      { key: 'templates_status_idx', attributes: ['status'] },
      { key: 'templates_layout_type_idx', attributes: ['layout_type'] },
    ],
    seeds: [
      {
        id: 'executive_modern',
        data: {
          name: 'Executive Modern v2.1',
          category: 'Professional',
          tags: ['Modern', 'ATS Friendly', 'With Photo'],
          preview_image: '/preview-executive-modern.png',
          layout_type: 'Modern',
          status: 'Active',
          is_free: true,
          access_type: 'free',
          layout_config: '{}',
          used_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      {
        id: 'student_clean',
        data: {
          name: 'Student Clean',
          category: 'Student',
          tags: ['Simple', 'One Page', 'Without Photo'],
          preview_image: '/preview-student-clean.png',
          layout_type: 'Minimal',
          status: 'Active',
          is_free: true,
          access_type: 'free',
          layout_config: '{}',
          used_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
    ],
  },
  {
    id: 'categories',
    name: 'Categories',
    permissions: publicReadAdminWrite,
    documentSecurity: false,
    attributes: [
      { type: 'string', key: 'name', size: 255, required: true },
      { type: 'string', key: 'description', size: 1000, required: false },
      { type: 'enum', key: 'status', elements: ['Active', 'Inactive'], required: false, default: 'Active' },
      { type: 'integer', key: 'templates_count', required: false, min: 0, default: 0 },
      { type: 'boolean', key: 'is_default', required: false, default: true },
      { type: 'datetime', key: 'created_at', required: false },
      { type: 'datetime', key: 'updated_at', required: false },
    ],
    indexes: [
      { key: 'categories_status_idx', attributes: ['status'] },
      { key: 'categories_name_idx', attributes: ['name'] },
    ],
    seeds: [
      {
        id: 'student',
        data: {
          name: 'Student',
          description: 'Academic and internship-ready CV templates.',
          status: 'Active',
          templates_count: 1,
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      {
        id: 'fresh_graduate',
        data: {
          name: 'Fresh Graduate',
          description: 'Entry-level CV templates for new graduates.',
          status: 'Active',
          templates_count: 0,
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      {
        id: 'professional',
        data: {
          name: 'Professional',
          description: 'Modern templates for experienced professionals.',
          status: 'Active',
          templates_count: 1,
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
    ],
  },
  {
    id: 'download_history',
    name: 'Download History',
    permissions: adminReadableUserCreate,
    documentSecurity: true,
    attributes: [
      { type: 'string', key: 'user_id', size: 255, required: true },
      { type: 'string', key: 'cv_id', size: 255, required: true },
      { type: 'string', key: 'template_id', size: 255, required: false },
      { type: 'enum', key: 'format', elements: ['PDF', 'DOCX'], required: true },
      { type: 'string', key: 'file_name', size: 255, required: false },
      { type: 'datetime', key: 'downloaded_at', required: false },
    ],
    indexes: [
      { key: 'download_history_user_id_idx', attributes: ['user_id'] },
      { key: 'download_history_cv_id_idx', attributes: ['cv_id'] },
      { key: 'download_history_format_idx', attributes: ['format'] },
    ],
  },
  {
    id: 'cv_activity',
    name: 'CV Activity',
    permissions: adminReadableUserCreate,
    documentSecurity: false,
    attributes: [
      { type: 'string', key: 'cv_id', size: 255, required: true },
      { type: 'string', key: 'user_id', size: 255, required: true },
      { type: 'string', key: 'user_name', size: 255, required: false },
      { type: 'string', key: 'user_email', size: 320, required: false },
      { type: 'string', key: 'cv_title', size: 255, required: true },
      { type: 'string', key: 'template_id', size: 255, required: false },
      { type: 'string', key: 'template_name', size: 255, required: false },
      { type: 'enum', key: 'status', elements: ['Draft', 'Completed'], required: false, default: 'Draft' },
      { type: 'integer', key: 'pdf_downloads', required: false, min: 0, default: 0 },
      { type: 'integer', key: 'docx_downloads', required: false, min: 0, default: 0 },
      { type: 'datetime', key: 'created_at', required: false },
      { type: 'datetime', key: 'updated_at', required: false },
    ],
    indexes: [
      { key: 'cv_activity_user_id_idx', attributes: ['user_id'] },
      { key: 'cv_activity_cv_id_idx', attributes: ['cv_id'] },
      { key: 'cv_activity_status_idx', attributes: ['status'] },
    ],
  },
  {
    id: 'site_content',
    name: 'Site Content',
    permissions: publicReadAdminWrite,
    documentSecurity: false,
    attributes: [
      { type: 'string', key: 'key', size: 100, required: true },
      { type: 'string', key: 'hero_title', size: 255, required: true },
      { type: 'string', key: 'hero_subtitle', size: 1000, required: false },
      { type: 'string', key: 'primary_cta_text', size: 100, required: false },
      { type: 'string', key: 'secondary_cta_text', size: 100, required: false },
      { type: 'string', key: 'benefits_title', size: 255, required: false },
      { type: 'string', key: 'benefit_items', size: 65535, required: false },
      { type: 'string', key: 'final_cta_title', size: 255, required: false },
      { type: 'string', key: 'final_cta_subtitle', size: 1000, required: false },
      { type: 'string', key: 'featured_template_ids', size: 255, required: false, array: true },
      { type: 'datetime', key: 'updated_at', required: false },
    ],
    indexes: [{ key: 'site_content_key_idx', attributes: ['key'] }],
    seeds: [
      {
        id: 'home',
        data: {
          key: 'home',
          hero_title: 'Build a professional CV in minutes',
          hero_subtitle: 'Choose a template, fill your details, preview live, and download your CV.',
          primary_cta_text: 'Create CV',
          secondary_cta_text: 'View Templates',
          benefits_title: 'Why CareerCraft works',
          benefit_items: JSON.stringify(['ATS friendly templates', 'Live preview', 'PDF and DOCX download']),
          final_cta_title: 'Ready to build your next CV?',
          final_cta_subtitle: 'Start with a polished template and make it yours.',
          featured_template_ids: ['executive_modern', 'student_clean'],
          updated_at: new Date().toISOString(),
        },
      },
    ],
  },
  {
    id: 'about_developer',
    name: 'About Developer',
    permissions: publicReadAdminWrite,
    documentSecurity: false,
    attributes: [
      { type: 'string', key: 'key', size: 100, required: true },
      { type: 'string', key: 'developer_name', size: 255, required: true },
      { type: 'string', key: 'short_bio', size: 2000, required: false },
      { type: 'string', key: 'profile_image', size: 1000, required: false },
      { type: 'string', key: 'email', size: 320, required: false },
      { type: 'string', key: 'phone', size: 100, required: false },
      { type: 'string', key: 'linkedin', size: 1000, required: false },
      { type: 'string', key: 'github', size: 1000, required: false },
      { type: 'string', key: 'portfolio_url', size: 1000, required: false },
      { type: 'string', key: 'expertise_label', size: 100, required: false },
      { type: 'string', key: 'expertise_value', size: 100, required: false },
      { type: 'string', key: 'skills', size: 100, required: false, array: true },
      { type: 'datetime', key: 'updated_at', required: false },
    ],
    indexes: [{ key: 'about_developer_key_idx', attributes: ['key'] }],
    seeds: [
      {
        id: 'developer',
        data: {
          key: 'developer',
          developer_name: 'CareerCraft Developer',
          short_bio: 'Building practical tools for fast, polished CV creation.',
          profile_image: '',
          email: '',
          phone: '',
          linkedin: '',
          github: '',
          portfolio_url: '',
          expertise_label: 'Expertise',
          expertise_value: 'Full Stack',
          skills: ['React', 'TypeScript', 'Appwrite'],
          updated_at: new Date().toISOString(),
        },
      },
    ],
  },
  {
    id: 'reports_cache',
    name: 'Reports Cache',
    permissions: adminOnly,
    documentSecurity: false,
    attributes: [
      { type: 'string', key: 'key', size: 100, required: true },
      { type: 'integer', key: 'total_users', required: false, min: 0, default: 0 },
      { type: 'integer', key: 'new_users_this_month', required: false, min: 0, default: 0 },
      { type: 'integer', key: 'total_cvs', required: false, min: 0, default: 0 },
      { type: 'integer', key: 'cvs_this_month', required: false, min: 0, default: 0 },
      { type: 'string', key: 'most_used_template', size: 255, required: false },
      { type: 'integer', key: 'total_downloads', required: false, min: 0, default: 0 },
      { type: 'integer', key: 'pdf_downloads', required: false, min: 0, default: 0 },
      { type: 'integer', key: 'docx_downloads', required: false, min: 0, default: 0 },
      { type: 'datetime', key: 'generated_at', required: false },
    ],
    indexes: [{ key: 'reports_cache_key_idx', attributes: ['key'] }],
    seeds: [
      {
        id: 'summary',
        data: {
          key: 'summary',
          total_users: 0,
          new_users_this_month: 0,
          total_cvs: 0,
          cvs_this_month: 0,
          most_used_template: '',
          total_downloads: 0,
          pdf_downloads: 0,
          docx_downloads: 0,
          generated_at: new Date().toISOString(),
        },
      },
    ],
  },
  {
    id: 'plans',
    name: 'Plans',
    permissions: publicReadAdminWrite,
    documentSecurity: false,
    attributes: [
      { type: 'string', key: 'name', size: 120, required: true },
      { type: 'integer', key: 'price_bdt', required: true, min: 0, default: 0 },
      { type: 'integer', key: 'duration_days', required: false, min: 1, default: 30 },
      { type: 'integer', key: 'ai_credits', required: false, min: 0, default: 0 },
      { type: 'integer', key: 'download_limit', required: false, min: -1, default: 0 },
      { type: 'boolean', key: 'premium_templates', required: false, default: false },
      { type: 'boolean', key: 'priority_support', required: false, default: false },
      { type: 'enum', key: 'status', elements: ['Active', 'Inactive'], required: false, default: 'Active' },
      { type: 'integer', key: 'sort_order', required: false, min: 0, default: 0 },
      { type: 'string', key: 'features', size: 4000, required: false },
    ],
    indexes: [
      { key: 'plans_status_idx', attributes: ['status'] },
      { key: 'plans_sort_order_idx', attributes: ['sort_order'] },
    ],
    seeds: [
      { id: 'free', data: { name: 'Free', price_bdt: 0, duration_days: 30, ai_credits: 10, download_limit: 2, premium_templates: false, priority_support: false, status: 'Active', sort_order: 0, features: '10 AI credits/month\n2 free-template downloads/month\nPremium template preview' } },
      { id: 'starter', data: { name: 'Starter', price_bdt: 99, duration_days: 30, ai_credits: 80, download_limit: 20, premium_templates: true, priority_support: false, status: 'Active', sort_order: 1, features: '80 AI credits/month\n20 downloads/month\nPremium template downloads' } },
      { id: 'pro', data: { name: 'Pro', price_bdt: 199, duration_days: 30, ai_credits: 250, download_limit: -1, premium_templates: true, priority_support: false, status: 'Active', sort_order: 2, features: '250 AI credits/month\nUnlimited downloads\nPremium template downloads' } },
      { id: 'career_plus', data: { name: 'Career Plus', price_bdt: 299, duration_days: 30, ai_credits: 600, download_limit: -1, premium_templates: true, priority_support: true, status: 'Active', sort_order: 3, features: '600 AI credits/month\nUnlimited downloads\nPremium templates\nPriority support' } },
    ],
  },
  {
    id: 'subscriptions',
    name: 'Subscriptions',
    permissions: usersAndAdmin,
    documentSecurity: true,
    attributes: [
      { type: 'string', key: 'user_id', size: 255, required: true },
      { type: 'string', key: 'plan_id', size: 255, required: true },
      { type: 'string', key: 'plan_name', size: 120, required: true },
      { type: 'enum', key: 'status', elements: ['Active', 'Expired', 'Cancelled'], required: false, default: 'Active' },
      { type: 'datetime', key: 'starts_at', required: true },
      { type: 'datetime', key: 'expires_at', required: true },
      { type: 'integer', key: 'ai_credits_used', required: false, min: 0, default: 0 },
      { type: 'integer', key: 'downloads_used', required: false, min: 0, default: 0 },
    ],
    indexes: [
      { key: 'subscriptions_user_id_idx', attributes: ['user_id'] },
      { key: 'subscriptions_status_idx', attributes: ['status'] },
      { key: 'subscriptions_expires_at_idx', attributes: ['expires_at'] },
    ],
  },
  {
    id: 'payment_requests',
    name: 'Payment Requests',
    permissions: adminReadableUserCreate,
    documentSecurity: true,
    attributes: [
      { type: 'string', key: 'user_id', size: 255, required: true },
      { type: 'string', key: 'user_email', size: 320, required: true },
      { type: 'string', key: 'user_name', size: 255, required: false },
      { type: 'string', key: 'plan_id', size: 255, required: true },
      { type: 'string', key: 'plan_name', size: 120, required: true },
      { type: 'integer', key: 'amount_bdt', required: true, min: 0, default: 0 },
      { type: 'string', key: 'bkash_number', size: 80, required: true },
      { type: 'string', key: 'sender_number', size: 80, required: true },
      { type: 'string', key: 'transaction_id', size: 120, required: true },
      { type: 'string', key: 'screenshot_url', size: 1000, required: false },
      { type: 'enum', key: 'status', elements: ['pending', 'approved', 'rejected'], required: false, default: 'pending' },
      { type: 'string', key: 'admin_note', size: 1000, required: false },
      { type: 'datetime', key: 'submitted_at', required: true },
      { type: 'datetime', key: 'reviewed_at', required: false },
    ],
    indexes: [
      { key: 'payment_requests_user_id_idx', attributes: ['user_id'] },
      { key: 'payment_requests_status_idx', attributes: ['status'] },
      { key: 'payment_requests_txn_idx', attributes: ['transaction_id'] },
      { key: 'payment_requests_submitted_idx', attributes: ['submitted_at'] },
    ],
  },
  {
    id: 'billing_settings',
    name: 'Billing Settings',
    permissions: publicReadAdminWrite,
    documentSecurity: false,
    attributes: [
      { type: 'string', key: 'key', size: 100, required: true },
      { type: 'integer', key: 'free_ai_credits', required: false, min: 0, default: 10 },
      { type: 'integer', key: 'free_download_limit', required: false, min: 0, default: 2 },
      { type: 'string', key: 'bkash_number', size: 80, required: true },
      { type: 'string', key: 'payment_instruction', size: 2000, required: false },
      { type: 'datetime', key: 'updated_at', required: false },
    ],
    indexes: [{ key: 'billing_settings_key_idx', attributes: ['key'] }],
    seeds: [
      {
        id: 'billing',
        data: {
          key: 'billing',
          free_ai_credits: 10,
          free_download_limit: 2,
          bkash_number: '01XXXXXXXXX',
          payment_instruction: 'Send money to the bKash number, then submit your transaction ID, sender number, and screenshot.',
          updated_at: new Date().toISOString(),
        },
      },
    ],
  },
];

const commonBucket = {
  id: 'career_assets',
  fallbackId: 'cv_photos',
  name: 'CareerCraft Common Assets',
  permissions: [
    Permission.read(Role.any()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
    Permission.create(Role.label('admin')),
    Permission.update(Role.label('admin')),
    Permission.delete(Role.label('admin')),
  ],
  fileSecurity: true,
  maximumFileSize: 10 * 1024 * 1024,
  extensions: ['jpg', 'jpeg', 'png', 'webp', 'svg', 'pdf', 'docx'],
};

const paymentProofsBucket = {
  id: 'payment_proofs',
  name: 'Payment Proof Screenshots',
  permissions: [
    Permission.read(Role.label('admin')),
    Permission.create(Role.users()),
    Permission.update(Role.label('admin')),
    Permission.delete(Role.label('admin')),
  ],
  fileSecurity: true,
  maximumFileSize: 5 * 1024 * 1024,
  extensions: ['jpg', 'jpeg', 'png', 'webp'],
};

function isAlreadyExists(error) {
  return error?.code === 409 || String(error?.message || '').toLowerCase().includes('already exists');
}

function isNotFound(error) {
  return error?.code === 404 || String(error?.message || '').toLowerCase().includes('not found');
}

async function skipIfExists(label, action) {
  try {
    await action();
    console.log(`Created ${label}`);
  } catch (error) {
    if (isAlreadyExists(error)) {
      console.log(`Exists  ${label}`);
      return;
    }
    throw error;
  }
}

async function ensureDatabase() {
  try {
    await databases.get(VITE_APPWRITE_DATABASE_ID);
    console.log(`Exists  database: ${VITE_APPWRITE_DATABASE_ID}`);
  } catch (error) {
    if (!isNotFound(error)) throw error;
    await databases.create(VITE_APPWRITE_DATABASE_ID, databaseName);
    console.log(`Created database: ${VITE_APPWRITE_DATABASE_ID}`);
  }
}

async function ensureCollection(collection) {
  await skipIfExists(`collection: ${collection.id}`, () =>
    databases.createCollection(
      VITE_APPWRITE_DATABASE_ID,
      collection.id,
      collection.name,
      collection.permissions,
      collection.documentSecurity,
      true,
    ),
  );
}

async function createAttribute(collectionId, attribute) {
  const { key, required } = attribute;
  const defaultValue = required ? undefined : attribute.default;

  if (attribute.type === 'string') {
    return databases.createStringAttribute(
      VITE_APPWRITE_DATABASE_ID,
      collectionId,
      key,
      attribute.size,
      required,
      defaultValue,
      Boolean(attribute.array),
      Boolean(attribute.encrypt),
    );
  }

  if (attribute.type === 'enum') {
    return databases.createEnumAttribute(
      VITE_APPWRITE_DATABASE_ID,
      collectionId,
      key,
      attribute.elements,
      required,
      defaultValue,
      Boolean(attribute.array),
    );
  }

  if (attribute.type === 'boolean') {
    return databases.createBooleanAttribute(
      VITE_APPWRITE_DATABASE_ID,
      collectionId,
      key,
      required,
      defaultValue,
      Boolean(attribute.array),
    );
  }

  if (attribute.type === 'integer') {
    return databases.createIntegerAttribute(
      VITE_APPWRITE_DATABASE_ID,
      collectionId,
      key,
      required,
      attribute.min,
      attribute.max,
      defaultValue,
      Boolean(attribute.array),
    );
  }

  if (attribute.type === 'datetime') {
    return databases.createDatetimeAttribute(
      VITE_APPWRITE_DATABASE_ID,
      collectionId,
      key,
      required,
      defaultValue,
      Boolean(attribute.array),
    );
  }

  throw new Error(`Unsupported attribute type "${attribute.type}" for ${collectionId}.${key}`);
}

async function ensureAttributes(collection) {
  for (const attribute of collection.attributes) {
    await skipIfExists(`attribute: ${collection.id}.${attribute.key}`, () =>
      createAttribute(collection.id, attribute),
    );
  }
}

async function waitForAttributes(collection) {
  const pendingKeys = new Set(collection.attributes.map((attribute) => attribute.key));

  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const result = await databases.listAttributes(VITE_APPWRITE_DATABASE_ID, collection.id);
    const unavailable = result.attributes.filter((attribute) => attribute.status === 'failed');
    if (unavailable.length) {
      throw new Error(
        `Attribute creation failed in ${collection.id}: ${unavailable
          .map((attribute) => attribute.key)
          .join(', ')}`,
      );
    }

    for (const attribute of result.attributes) {
      if (attribute.status === 'available') pendingKeys.delete(attribute.key);
    }

    if (pendingKeys.size === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log(`Waiting skipped for ${collection.id}; indexes/seeds will be attempted anyway.`);
}

async function ensureIndexes(collection) {
  for (const index of collection.indexes || []) {
    await skipIfExists(`index: ${collection.id}.${index.key}`, () =>
      databases.createIndex(
        VITE_APPWRITE_DATABASE_ID,
        collection.id,
        index.key,
        DatabasesIndexType.Key,
        index.attributes,
      ),
    );
  }
}

async function seedCollection(collection) {
  for (const seed of collection.seeds || []) {
    try {
      await databases.getDocument(VITE_APPWRITE_DATABASE_ID, collection.id, seed.id);
      console.log(`Exists  seed document: ${collection.id}.${seed.id}`);
    } catch (error) {
      if (!isNotFound(error)) throw error;
      await databases.createDocument(
        VITE_APPWRITE_DATABASE_ID,
        collection.id,
        seed.id,
        seed.data,
        collection.documentSecurity ? collection.permissions : undefined,
      );
      console.log(`Seeded  document: ${collection.id}.${seed.id}`);
    }
  }
}

async function createOrUpdateBucket(bucketId, bucket) {
  try {
    await storage.getBucket(bucketId);
    await storage.updateBucket(
      bucketId,
      bucket.name,
      bucket.permissions,
      bucket.fileSecurity,
      true,
      bucket.maximumFileSize,
      bucket.extensions,
      'gzip',
      true,
      true,
    );
    console.log(`Updated bucket: ${bucketId}`);
    return true;
  } catch (error) {
    if (!isNotFound(error)) throw error;
    return false;
  }
}

async function ensureCommonBucket() {
  const existingCommon = await createOrUpdateBucket(commonBucket.id, commonBucket);
  if (existingCommon) return;

  try {
    await skipIfExists(`bucket: ${commonBucket.id}`, () =>
      storage.createBucket(
        commonBucket.id,
        commonBucket.name,
        commonBucket.permissions,
        commonBucket.fileSecurity,
        true,
        commonBucket.maximumFileSize,
        commonBucket.extensions,
        'gzip',
        true,
        true,
      ),
    );
  } catch (error) {
    const message = String(error?.message || '');
    if (message.toLowerCase().includes('maximum number of buckets')) {
      const existingFallback = await createOrUpdateBucket(commonBucket.fallbackId, commonBucket);
      if (existingFallback) {
        console.log(`Using existing bucket as common assets bucket: ${commonBucket.fallbackId}`);
        return;
      }
      console.log(`Skipped bucket: ${commonBucket.id} (plan bucket limit reached)`);
      return;
    }
    throw error;
  }
}

async function setup() {
  console.log('Starting Appwrite setup...');
  console.log(`Endpoint: ${VITE_APPWRITE_ENDPOINT}`);
  console.log(`Project:  ${VITE_APPWRITE_PROJECT_ID}`);
  console.log(`Database: ${VITE_APPWRITE_DATABASE_ID}`);

  await ensureDatabase();

  for (const collection of collections) {
    await ensureCollection(collection);
    await ensureAttributes(collection);
  }

  for (const collection of collections) {
    await waitForAttributes(collection);
    await ensureIndexes(collection);
    await seedCollection(collection);
  }

  await ensureCommonBucket();
  const existingPaymentProofBucket = await createOrUpdateBucket(paymentProofsBucket.id, paymentProofsBucket);
  if (!existingPaymentProofBucket) {
    try {
      await skipIfExists(`bucket: ${paymentProofsBucket.id}`, () =>
      storage.createBucket(
        paymentProofsBucket.id,
        paymentProofsBucket.name,
        paymentProofsBucket.permissions,
        paymentProofsBucket.fileSecurity,
        true,
        paymentProofsBucket.maximumFileSize,
        paymentProofsBucket.extensions,
        'gzip',
        true,
        true,
      ),
    );
    } catch (error) {
      const message = String(error?.message || '').toLowerCase();
      if (message.includes('maximum number of buckets')) {
        console.log(`Skipped bucket: ${paymentProofsBucket.id} (plan bucket limit reached; app will use the configured assets bucket as fallback)`);
      } else {
        throw error;
      }
    }
  }

  console.log('Appwrite setup complete.');
}

setup().catch((error) => {
  console.error('Appwrite setup failed.');
  console.error(error?.message || error);
  process.exit(1);
});
