import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Validate required environment variables
if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
    throw new Error('Missing FIREBASE_ADMIN_PROJECT_ID environment variable');
}
if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
    throw new Error('Missing FIREBASE_ADMIN_CLIENT_EMAIL environment variable');
}
if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    throw new Error('Missing FIREBASE_ADMIN_PRIVATE_KEY environment variable');
}

const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

let adminApp;
let adminDb;
let adminAuth;

try {
    // Initialize Firebase Admin (singleton pattern to prevent hot-reload errors)
    adminApp = !getApps().length ? initializeApp({
        credential: cert(serviceAccount),
    }) : getApp();
    
    adminDb = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);
} catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
}

export { adminApp, adminDb, adminAuth };
