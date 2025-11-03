import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { signInWithGoogle } from "../services/authService.js";

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  isGoogleLoading: false,
  isVerifying: false,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  loginWithGoogle: async () => {
    set({ isGoogleLoading: true });
    try {
      const result = await signInWithGoogle();
      
      if (!result.success) {
        toast.error(result.error || "Google sign-in failed");
        return;
      }

      // Send the Firebase ID token to our backend
      const res = await axiosInstance.post("/auth/firebase-auth", {
        idToken: result.idToken
      });

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
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  deleteAccount: async (confirmationText) => {
    try {
      await axiosInstance.delete("/auth/delete-account", {
        data: { confirmationText }
      });
      set({ authUser: null });
      get().disconnectSocket();
      toast.success("Account deleted successfully");
      return { success: true };
    } catch (error) {
      console.log("error in delete account:", error);
      toast.error(error.response?.data?.message || "Failed to delete account");
      return { success: false, error: error.response?.data?.message };
    }
  },

  sendVerificationCode: async (data) => {
    try {
      await axiosInstance.post("/auth/send-verification", data);
      return { success: true };
    } catch (error) {
      console.log("error in send verification:", error);
      throw new Error(error.response?.data?.message || "Failed to send verification code");
    }
  },

  verifyEmail: async (email, code) => {
    set({ isVerifying: true });
    try {
      const res = await axiosInstance.post("/auth/verify-email", { email, code });
      return { success: true };
    } catch (error) {
      console.log("error in verify email:", error);
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
      console.log("error in resend verification:", error);
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
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
