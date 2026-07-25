import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import {
  signInWithGoogle,
  checkGoogleRedirect,
} from "../services/authService.js";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : import.meta.env.VITE_BACKEND_URL || "";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  isGoogleLoading: false,
  isVerifying: false,
  isSendingVerification: false,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const redirectResult = await checkGoogleRedirect();
      if (redirectResult) {
        if (redirectResult.success) {
          set({ isGoogleLoading: true });
          const res = await axiosInstance.post("/auth/firebase-auth", {
            idToken: redirectResult.idToken,
          });
          if (res.data.token) localStorage.setItem("jwt", res.data.token);
          set({ authUser: res.data });
          toast.success("Signed in with Google successfully");
          get().connectSocket();
          return;
        } else if (redirectResult.error) {
          console.error("Google redirect sign-in error:", redirectResult.error);
          toast.error(redirectResult.error);
        }
      }

      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error("Error in checkAuth:", error);
      }
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
      set({ isGoogleLoading: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      if (res.data.token) localStorage.setItem("jwt", res.data.token);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      if (res.data.token) localStorage.setItem("jwt", res.data.token);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  loginWithGoogle: async () => {
    try {
      const googlePromise = signInWithGoogle();
      set({ isGoogleLoading: true });
      const result = await googlePromise;

      if (!result.success) {
        // If redirect flow has started, don't show an error toast
        if (result.redirecting) return;
        toast.error(result.error || "Google sign-in failed");
        return;
      }

      const res = await axiosInstance.post("/auth/firebase-auth", {
        idToken: result.idToken,
      });

      if (res.data.token) localStorage.setItem("jwt", res.data.token);
      set({ authUser: res.data });
      toast.success("Signed in with Google successfully");
      get().connectSocket();
    } catch (error) {
      console.error("Google login error:", error);
      toast.error(error.response?.data?.message || "Google sign-in failed");
    } finally {
      set({ isGoogleLoading: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      localStorage.removeItem("jwt");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("error in update profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  deleteAccount: async (confirmationText) => {
    try {
      await axiosInstance.delete("/auth/delete-account", {
        data: { confirmationText },
      });
      localStorage.removeItem("jwt");
      set({ authUser: null });
      get().disconnectSocket();
      toast.success("Account deleted successfully");
      return { success: true };
    } catch (error) {
      console.error("error in delete account:", error);
      toast.error(error.response?.data?.message || "Failed to delete account");
      return { success: false, error: error.response?.data?.message };
    }
  },

  sendVerificationCode: async (data) => {
    set({ isSendingVerification: true });
    try {
      await axiosInstance.post("/auth/send-verification", data);
      return { success: true };
    } catch (error) {
      console.error("error in send verification:", error);
      throw new Error(
        error.response?.data?.message || "Failed to send verification code",
      );
    } finally {
      set({ isSendingVerification: false });
    }
  },

  verifyEmail: async (email, code) => {
    set({ isVerifying: true });
    try {
      const res = await axiosInstance.post("/auth/verify-email", {
        email,
        code,
      });
      return { success: true };
    } catch (error) {
      console.error("error in verify email:", error);
      throw new Error(error.response?.data?.message || "Verification failed");
    } finally {
      set({ isVerifying: false });
    }
  },

  resendVerificationCode: async (email) => {
    try {
      await axiosInstance.post("/auth/resend-verification", { email });
      return { success: true };
    } catch (error) {
      console.error("error in resend verification:", error);
      throw new Error(error.response?.data?.message || "Failed to resend code");
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
      transports: ["websocket", "polling"], // Support both transports
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      withCredentials: true,
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
