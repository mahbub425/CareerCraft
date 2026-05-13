import { Client, Databases, Permission, Role } from 'node-appwrite'
import dotenv from 'dotenv'

dotenv.config()

const {
  VITE_APPWRITE_ENDPOINT,
  VITE_APPWRITE_PROJECT_ID,
  VITE_APPWRITE_DATABASE_ID,
  VITE_APPWRITE_CVS_COLLECTION_ID = 'cvs',
  APPWRITE_API_KEY,
} = process.env

if (!VITE_APPWRITE_ENDPOINT || !VITE_APPWRITE_PROJECT_ID || !VITE_APPWRITE_DATABASE_ID || !APPWRITE_API_KEY) {
  console.error('Missing Appwrite env values. Check .env before running this script.')
  process.exit(1)
}

const client = new Client()
  .setEndpoint(VITE_APPWRITE_ENDPOINT)
  .setProject(VITE_APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY)

const databases = new Databases(client)

const collectionPermissions = [
  Permission.read(Role.users()),
  Permission.create(Role.users()),
]

async function fixPermissions() {
  const collection = await databases.getCollection(
    VITE_APPWRITE_DATABASE_ID,
    VITE_APPWRITE_CVS_COLLECTION_ID,
  )

  await databases.updateCollection(
    VITE_APPWRITE_DATABASE_ID,
    VITE_APPWRITE_CVS_COLLECTION_ID,
    collection.name,
    collectionPermissions,
    true,
    collection.enabled,
  )

  console.log(`Updated "${VITE_APPWRITE_CVS_COLLECTION_ID}" collection permissions for authenticated users.`)
}

fixPermissions().catch((error) => {
  console.error('Failed to update Appwrite permissions:', error.message)
  process.exit(1)
})
