// const admin = require("firebase-admin");

// const serviceAccount = require("../lifeshield-6f587-firebase-adminsdk-fbsvc-e8d9d685e9.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// module.exports = admin;

const admin = require("firebase-admin");

// 1. Prevent 'duplicate app' errors in Vercel's serverless environment
if (!admin.apps.length) {
  
  // 2. Use Environment Variables instead of a static JSON file
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel sometimes escapes newlines in the private key, so we must re-format them
      privateKey: process.env.FIREBASE_PRIVATE_KEY 
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
        : undefined,
    }),
  });
}

module.exports = admin;
