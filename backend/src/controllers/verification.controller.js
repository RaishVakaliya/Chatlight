import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import {
  generateVerificationCode,
  sendVerificationEmail,
} from "../lib/email.js";

export const sendVerificationCode = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.emailVerified) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    if (existingUser && !existingUser.emailVerified) {
      existingUser.fullName = fullName;
      existingUser.password = await bcrypt.hash(password, 10);
      existingUser.verificationCode = verificationCode;
      existingUser.verificationCodeExpires = verificationCodeExpires;
      await existingUser.save();
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        fullName,
        email,
        password: hashedPassword,
        verificationCode,
        verificationCodeExpires,
        emailVerified: false,
      });
      await newUser.save();
    }

    await sendVerificationEmail(email, verificationCode, fullName);

    res.status(200).json({
      message: "Verification code sent to your email",
      email: email,
    });
  } catch (error) {
    console.error("Error in sendVerificationCode controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  try {
    if (!email || !code) {
      return res
        .status(400)
        .json({ message: "Email and verification code are required" });
    }

    const user = await User.findOne({
      email,
      verificationCode: code,
      verificationCodeExpires: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code" });
    }

    user.emailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Error in verifyEmail controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const resendVerificationCode = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email, emailVerified: false });
    if (!user) {
      return res
        .status(400)
        .json({ message: "User not found or already verified" });
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    await sendVerificationEmail(email, verificationCode, user.fullName);

    res.status(200).json({ message: "Verification code resent successfully" });
  } catch (error) {
    console.error("Error in resendVerificationCode controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
