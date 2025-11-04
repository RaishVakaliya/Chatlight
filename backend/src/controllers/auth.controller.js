import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";
import { verifyFirebaseToken } from "../middleware/firebase-auth.middleware.js";
import { generateVerificationCode, sendVerificationEmail, sendWelcomeEmail } from "../lib/email.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find verified user
    const user = await User.findOne({ 
      email, 
      emailVerified: true,
      verificationCode: { $exists: false }
    });

    if (!user) {
      return res.status(400).json({ message: "Please verify your email first" });
    }

    // Generate token and complete signup
    generateToken(user._id, res);

    // Send welcome email
    try {
      await sendWelcomeEmail(email, user.fullName);
    } catch (emailError) {
      console.log("Welcome email failed:", emailError.message);
      // Don't fail signup if welcome email fails
    }

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic || process.env.CLOUDINARY_DEFAULT_AVATAR || "/avatar.png",
      description: user.description,
    });
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic || process.env.CLOUDINARY_DEFAULT_AVATAR || "/avatar.png",
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const firebaseAuth = async (req, res) => {
  const { idToken } = req.body;
  
  try {
    if (!idToken) {
      return res.status(400).json({ message: "Firebase ID token is required" });
    }

    // Verify the Firebase ID token
    const result = await verifyFirebaseToken(idToken);
    
    if (!result.success) {
      return res.status(401).json({ message: "Invalid Firebase token" });
    }

    const { decodedToken } = result;
    const { uid, email, name, picture, email_verified } = decodedToken;

    // Check if user already exists by Firebase UID
    let user = await User.findOne({ firebaseUid: uid });
    
    if (!user) {
      // Check if user exists by email (for migration from email/password)
      user = await User.findOne({ email: email });
      
      if (user) {
        // Update existing user with Firebase data
        user.firebaseUid = uid;
        user.emailVerified = email_verified;
        user.authProvider = 'google';
        // Set profile picture from Google or use default
        if (!user.profilePic) {
          user.profilePic = picture || process.env.CLOUDINARY_DEFAULT_AVATAR || "/avatar.png";
        }
        await user.save();
      } else {
        // Create new user
        user = new User({
          firebaseUid: uid,
          email: email,
          fullName: name || email.split('@')[0],
          profilePic: picture || process.env.CLOUDINARY_DEFAULT_AVATAR || "/avatar.png",
          emailVerified: email_verified,
          authProvider: 'google'
        });
        await user.save();
      }
    }

    // Generate JWT token for our app
    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic || process.env.CLOUDINARY_DEFAULT_AVATAR || "/avatar.png",
      description: user.description,
    });
  } catch (error) {
    console.log("Error in Firebase auth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, description } = req.body;
    const userId = req.user._id;

    const updateData = {};

    if (profilePic) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        updateData.profilePic = uploadResponse.secure_url;
      } catch (cloudinaryError) {
        console.log("Cloudinary upload error:", cloudinaryError);
        // Check if it's a file size error
        if (cloudinaryError.message && cloudinaryError.message.includes('File size too large')) {
          return res.status(400).json({ message: "File size too large. Please select an image smaller than 10MB." });
        }
        return res.status(400).json({ message: "Failed to upload image. Please try again." });
      }
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    // Emit socket event to all connected users about profile update
    if (updateData.profilePic || updateData.description !== undefined) {
      io.emit("profileUpdated", {
        userId: userId,
        profilePic: updatedUser.profilePic,
        fullName: updatedUser.fullName,
        description: updatedUser.description,
      });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    // Check if it's a payload too large error from Express
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ message: "File size too large. Please select an image smaller than 10MB." });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { confirmationText } = req.body;
    const userId = req.user._id;
    const user = req.user;

    // Validate confirmation text (should be "FullName Delete")
    const expectedText = `${user.fullName} Delete`;
    if (confirmationText !== expectedText) {
      return res.status(400).json({
        message: `Please type "${expectedText}" to confirm account deletion`,
      });
    }

    // Soft delete the user account (preserve messages)
    await User.findByIdAndUpdate(userId, {
      $set: {
        deleted: true,
        deletedAt: new Date(),
        // Clear sensitive data but keep basic info for message history
        email: `deleted_${userId}@deleted.com`,
        password: null,
        profilePic: process.env.CLOUDINARY_DEFAULT_AVATAR || "/avatar.png", // Default avatar
        description: "",
      },
    });

    // Clear the JWT cookie
    res.cookie("jwt", "", { maxAge: 0 });

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.log("Error in deleteAccount controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const sendVerificationCode = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.emailVerified) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (existingUser && !existingUser.emailVerified) {
      // Update existing unverified user
      existingUser.fullName = fullName;
      existingUser.password = await bcrypt.hash(password, 10);
      existingUser.verificationCode = verificationCode;
      existingUser.verificationCodeExpires = verificationCodeExpires;
      await existingUser.save();
    } else {
      // Create new user
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

    // Send verification email
    await sendVerificationEmail(email, verificationCode, fullName);

    res.status(200).json({ 
      message: "Verification code sent to your email",
      email: email 
    });
  } catch (error) {
    console.log("Error in sendVerificationCode controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  try {
    if (!email || !code) {
      return res.status(400).json({ message: "Email and verification code are required" });
    }

    const user = await User.findOne({ 
      email,
      verificationCode: code,
      verificationCodeExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    // Mark email as verified and clear verification code
    user.emailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.log("Error in verifyEmail controller", error.message);
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
      return res.status(400).json({ message: "User not found or already verified" });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    // Send verification email
    await sendVerificationEmail(email, verificationCode, user.fullName);

    res.status(200).json({ message: "Verification code resent successfully" });
  } catch (error) {
    console.log("Error in resendVerificationCode controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
