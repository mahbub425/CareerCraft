import { Account, Client, Databases, Storage } from 'appwrite'

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '69f865fd000396a3c0f8'
const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || '69f870ce00189cd905dc'
const assetsBucketId = import.meta.env.VITE_APPWRITE_ASSETS_BUCKET_ID || 'cv_photos'
const paymentProofsBucketId = import.meta.env.VITE_APPWRITE_PAYMENT_PROOFS_BUCKET_ID || 'payment_proofs'

const collections = {
  userProfiles: 'user_profiles',
  cvs: import.meta.env.VITE_APPWRITE_CVS_COLLECTION_ID || 'cvs',
  templates: import.meta.env.VITE_APPWRITE_TEMPLATES_COLLECTION_ID || 'templates',
  categories: import.meta.env.VITE_APPWRITE_CATEGORIES_COLLECTION_ID || 'categories',
  downloads: import.meta.env.VITE_APPWRITE_DOWNLOADS_COLLECTION_ID || 'download_history',
  cvActivity: 'cv_activity',
  siteContent: 'site_content',
  aboutDeveloper: 'about_developer',
  reportsCache: 'reports_cache',
  plans: 'plans',
  subscriptions: 'subscriptions',
  paymentRequests: 'payment_requests',
  billingSettings: 'billing_settings',
}

const isAppwriteConfigured = Boolean(endpoint && projectId)

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)

const account = new Account(client)
const databases = new Databases(client)
const storage = new Storage(client)

const pingAppwriteBackend = async () => {
  return client.ping()
}

export {
  account,
  assetsBucketId,
  client,
  collections,
  databaseId,
  databases,
  isAppwriteConfigured,
  paymentProofsBucketId,
  pingAppwriteBackend,
  storage,
}
