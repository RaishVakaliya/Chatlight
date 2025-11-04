import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

export const signInWithGoogle = async () => {
  try {
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
    return {
      success: false,
      error: error.message,
    };
  }
};
