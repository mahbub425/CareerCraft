import { Client, Databases, Storage } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const {
    VITE_APPWRITE_ENDPOINT,
    VITE_APPWRITE_PROJECT_ID,
    VITE_APPWRITE_DATABASE_ID,
    APPWRITE_API_KEY
} = process.env;

if (!APPWRITE_API_KEY) {
    console.error('Error: APPWRITE_API_KEY is missing in .env');
    process.exit(1);
}

const client = new Client()
    .setEndpoint(VITE_APPWRITE_ENDPOINT)
    .setProject(VITE_APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

async function setup() {
    try {
        const dbId = VITE_APPWRITE_DATABASE_ID;
        console.log(`Using Database ID: ${dbId}`);

        // 1. Update 'cvs' collection attributes if needed
        // (Checking/Adding missing fields like section_order if not present)
        
        // 2. Create 'cv_photos' bucket
        console.log('Creating "cv_photos" storage bucket...');
        try {
            await storage.createBucket('cv_photos', 'CV Photos', ['read("any")', 'create("users")', 'update("users")', 'delete("users")'], false, true, 2097152, ['jpg', 'png', 'jpeg']);
            console.log('✓ "cv_photos" bucket created.');
        } catch (e) {
            console.log('Note: "cv_photos" bucket might already exist.');
        }

        console.log('\nAppwrite setup script execution finished.');
    } catch (error) {
        console.error('Setup failed:', error.message);
    }
}

setup();
