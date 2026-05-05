import admin from "firebase-admin";
import { getErrorMessage } from "@/utils/errorHandler";

// Initialize Firebase Admin
const initializeFirebase = () => {
  try {
    if (!admin.apps.length) {
      // Option 1: Using service account file
      // const serviceAccount = require("../../firebase-service-account.json");

      // Option 2: Using environment variable (Recommended for production)
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}",
      );

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log("✅ Firebase Admin initialized successfully");
    }
  } catch (error) {
    console.error(
      "❌ Failed to initialize Firebase Admin:",
      getErrorMessage(error),
    );
  }
};

initializeFirebase();

export default admin;
