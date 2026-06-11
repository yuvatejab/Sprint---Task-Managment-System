import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { readFileSync } from 'fs';
import path from 'path';

// Read configuration from the workspace root safely
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(readFileSync(configPath, 'utf-8'));

export const app = initializeApp(firebaseConfig);
// Initialize Firestore with the targeted database ID specified by AI Studio
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
