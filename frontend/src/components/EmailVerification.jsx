import { useState, useRef, useEffect } from "react";
import { X, Mail } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const EmailVerification = ({ email, onClose, onVerificationSuccess }) => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);
  const { verifyEmail, resendVerificationCode, isVerifying } = useAuthStore();

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Countdown timer for resend button
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleInputChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Handle paste
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, "").slice(0, 6);
        const newCode = [...code];
        for (let i = 0; i < 6; i++) {
          newCode[i] = digits[i] || "";
        }
        setCode(newCode);
        // Focus the last filled input or first empty one
        const lastIndex = Math.min(digits.length, 5);
        inputRefs.current[lastIndex]?.focus();
      });
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join("");
    if (verificationCode.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    try {
      await verifyEmail(email, verificationCode);
      toast.success("Email verified successfully!");
      onVerificationSuccess();
    } catch (error) {
      toast.error(error.message || "Verification failed");
      // Clear the code on error
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    try {
      await resendVerificationCode(email);
      toast.success("Verification code sent!");
      setCountdown(60); // 60 second cooldown
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error) {
      toast.error(error.message || "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  const isCodeComplete = code.every(digit => digit !== "");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-base-100 rounded-2xl p-8 w-full max-w-md relative shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-base-content/60 hover:text-base-content transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Email Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Mail className="h-8 w-8 text-white" />
            </div>
            {/* Location pin decoration */}
            <div className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            {/* Password dots decoration */}
            <div className="absolute -bottom-1 right-2 bg-white rounded px-2 py-1 shadow-md">
              <div className="flex gap-1">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-gray-400 rounded-full"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-base-content mb-2">
          Verify Your Email Address
        </h2>

        {/* Description */}
        <p className="text-center text-base-content/70 mb-8 text-sm leading-relaxed">
          We've sent a 6-digit verification code to your email address. Please enter the code below to verify your account and complete your registration. The code will expire in 10 minutes for security purposes.
        </p>

        {/* Code Input */}
        <div className="flex gap-3 justify-center mb-6">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-12 h-12 text-center text-xl font-semibold border-2 rounded-lg transition-all duration-200 ${
                digit
                  ? "border-orange-400 bg-orange-50 text-orange-600"
                  : "border-base-300 bg-base-200 text-base-content focus:border-orange-400 focus:bg-orange-50"
              } focus:outline-none`}
            />
          ))}
        </div>

        {/* Change Email */}
        <div className="text-center mb-6">
          <p className="text-sm text-base-content/70">
            Want to Change Your Email Address?{" "}
            <button
              onClick={onClose}
              className="text-orange-500 hover:text-orange-600 font-medium underline"
            >
              Change Here
            </button>
          </p>
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={!isCodeComplete || isVerifying}
          className={`w-full py-3 rounded-full font-semibold text-white transition-all duration-200 ${
            isCodeComplete && !isVerifying
              ? "bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 shadow-lg hover:shadow-xl"
              : "bg-gray-500 cursor-not-allowed"
          }`}
        >
          {isVerifying ? "Verifying..." : "Verify Email"}
        </button>

        {/* Resend Code */}
        <div className="text-center mt-4">
          <button
            onClick={handleResendCode}
            disabled={countdown > 0 || isResending}
            className="text-base-content/70 hover:text-base-content text-sm font-medium transition-colors disabled:cursor-not-allowed"
          >
            {isResending
              ? "Sending..."
              : countdown > 0
              ? `Resend Code (${countdown}s)`
              : "Resend Code"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
