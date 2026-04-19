const admin = require("firebase-admin");

const serviceAccount = require("../lifeshield-6f587-firebase-adminsdk-fbsvc-e8d9d685e9.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
