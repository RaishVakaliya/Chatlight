import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

export const signInWithGoogle = async () => {
  try {
    // First, check if we're returning from a redirect flow
    const redirectResult = await getRedirectResult(auth);
    if (redirectResult) {
      const user = redirectResult.user;
      const idToken = await user.getIdToken();
      return {
        success: true,
        idToken,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
        },
      };
    }

    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Get the ID token from Firebase
    const idToken = await user.getIdToken();

    return {
      success: true,
      idToken,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
      },
    };
  } catch (error) {
    console.error("Google sign-in error:", error);
    // Fallback to redirect for popup-related errors
    const popupErrors = [
      "auth/popup-closed-by-user",
      "auth/cancelled-popup-request",
      "auth/popup-blocked",
    ];
    if (popupErrors.includes(error?.code)) {
      // Start redirect flow (page will navigate)
      await signInWithRedirect(auth, googleProvider);
      return { success: false, redirecting: true };
    }
    return {
      success: false,
      error: error.message,
    };
  }
};
