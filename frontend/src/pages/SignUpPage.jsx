import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../assets/app_logo.png";

import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";
import GoogleSignInButton from "../components/GoogleSignInButton";
import EmailVerification from "../components/EmailVerification";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const {
    signup,
    sendVerificationCode,
    isSigningUp,
    loginWithGoogle,
    isGoogleLoading,
    isSendingVerification,
  } = useAuthStore();

  const validateForm = () => {
    if (!formData.fullName.trim()) return toast.error("Full name is required");
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(formData.email))
      return toast.error("Invalid email format");
    if (!formData.password) return toast.error("Password is required");
    if (formData.password.length < 6)
      return toast.error("Password must be at least 6 characters");

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const success = validateForm();

    if (success === true) {
      try {
        await sendVerificationCode(formData);
        setShowVerification(true);
        toast.success("Verification code sent to your email!");
      } catch (error) {
        toast.error(error.message || "Failed to send verification code");
      }
    }
  };

  const handleVerificationSuccess = async () => {
    try {
      await signup(formData);
      setShowVerification(false);
    } catch (error) {
      toast.error(error.message || "Signup failed");
    }
  };

  const handleCloseVerification = () => {
    setShowVerification(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* left side */}
      <div className="flex flex-col justify-center items-center pt-16 px-6 sm:px-16 sm:pt-16 sm:pb-2">
        <div className="w-full max-w-md space-y-8">
          {/* LOGO */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="size-12 rounded-xl flex items-center justify-center transition-colors">
                {/* <MessageSquare className="size-6 text-primary" /> */}
                <img src={logo} alt="Chatlight Logo" />
              </div>
              <h1 className="text-2xl font-bold mt-0">Create Account</h1>
              <p className="text-base-content/60">
                Get started with your free account
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Full Name</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="size-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  className={`input input-bordered w-full pl-10`}
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="size-5 text-base-content/40" />
                </div>
                <input
                  type="email"
                  className={`input input-bordered w-full pl-10`}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="size-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`input input-bordered w-full pl-10`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-5 text-base-content/40" />
                  ) : (
                    <Eye className="size-5 text-base-content/40" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isSendingVerification || isSigningUp}
            >
              {isSendingVerification ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Sending Code...
                </>
              ) : isSigningUp ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-base-300"></div>
            <span className="text-base-content/60 text-sm">OR</span>
            <div className="flex-1 h-px bg-base-300"></div>
          </div>

          {/* Google Sign-In Button */}
          <GoogleSignInButton
            onClick={loginWithGoogle}
            isLoading={isGoogleLoading}
            text="Continue with Google"
          />

          <div className="text-center">
            <p className="text-base-content/60">
              Already have an account?{" "}
              <Link to="/login" className="link link-primary">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* right side */}
      <div className="pt-14">
        <AuthImagePattern
          title="Join our community"
          subtitle="Connect with friends, share moments, and stay in touch with your loved ones."
        />
      </div>

      {/* Email Verification Modal */}
      {showVerification && (
        <EmailVerification
          email={formData.email}
          onClose={handleCloseVerification}
          onVerificationSuccess={handleVerificationSuccess}
        />
      )}
    </div>
  );
};
export default SignUpPage;
