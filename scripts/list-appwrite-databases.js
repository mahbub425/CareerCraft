import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const result = await databases.list();

console.log(JSON.stringify(
  result.databases.map((database) => ({
    id: database.$id,
    name: database.name,
  })),
  null,
  2,
));
