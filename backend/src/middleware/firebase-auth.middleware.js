import admin from "../lib/firebase-admin.js";

export const verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      success: true,
      decodedToken,
    };
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
