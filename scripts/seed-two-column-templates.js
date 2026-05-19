import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
import { allTemplateSeeds } from './template-seeds.js';

dotenv.config();

const {
  VITE_APPWRITE_ENDPOINT,
  VITE_APPWRITE_PROJECT_ID,
  VITE_APPWRITE_DATABASE_ID,
  APPWRITE_API_KEY,
} = process.env;

const missingEnv = Object.entries({
  VITE_APPWRITE_ENDPOINT,
  VITE_APPWRITE_PROJECT_ID,
  VITE_APPWRITE_DATABASE_ID,
  APPWRITE_API_KEY,
})
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
const databaseId = VITE_APPWRITE_DATABASE_ID;

function isNotFound(error) {
  return error?.code === 404 || String(error?.message || '').toLowerCase().includes('not found');
}

async function upsertDocument(collectionId, documentId, data) {
  const payload = {
    ...data,
    updated_at: new Date().toISOString(),
  };

  try {
    await databases.getDocument(databaseId, collectionId, documentId);
    await databases.updateDocument(databaseId, collectionId, documentId, payload);
    console.log(`Updated ${collectionId}.${documentId}`);
  } catch (error) {
    if (!isNotFound(error)) throw error;
    await databases.createDocument(databaseId, collectionId, documentId, {
      ...payload,
      created_at: new Date().toISOString(),
    });
    console.log(`Created ${collectionId}.${documentId}`);
  }
}

async function updateCategoryCount(categoryId, templatesCount) {
  try {
    await databases.updateDocument(databaseId, 'categories', categoryId, {
      templates_count: templatesCount,
      updated_at: new Date().toISOString(),
    });
    console.log(`Updated categories.${categoryId}`);
  } catch (error) {
    if (!isNotFound(error)) throw error;
    console.log(`Skipped missing category ${categoryId}`);
  }
}

async function updateHomeFeaturedTemplates() {
  try {
    const home = await databases.getDocument(databaseId, 'site_content', 'home');
    const existing = Array.isArray(home.featured_template_ids) ? home.featured_template_ids : [];
    const featured_template_ids = Array.from(new Set([
      ...existing,
      'student_ats_slate',
      'fresh_graduate_ats_slate',
      'professional_ats_slate',
      'student_two_column',
      'fresh_graduate_two_column',
    ]));

    await databases.updateDocument(databaseId, 'site_content', 'home', {
      featured_template_ids,
      updated_at: new Date().toISOString(),
    });
    console.log('Updated site_content.home');
  } catch (error) {
    if (!isNotFound(error)) throw error;
    console.log('Skipped missing site_content.home');
  }
}

async function seed() {
  for (const seed of allTemplateSeeds) {
    await upsertDocument('templates', seed.id, seed.data);
  }

  await updateCategoryCount('student', 8);
  await updateCategoryCount('fresh_graduate', 7);
  await updateCategoryCount('professional', 7);
  await updateHomeFeaturedTemplates();
  console.log('Student, fresh graduate, and professional template sets are ready.');
}

seed().catch((error) => {
  console.error('Template seed failed.');
  console.error(error?.message || error);
  process.exit(1);
});
