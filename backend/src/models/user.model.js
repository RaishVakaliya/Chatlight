import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.firebaseUid;
      },
      minlength: 6,
    },
    firebaseUid: {
      type: String,
      sparse: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    profilePic: {
      type: String,
      default: process.env.CLOUDINARY_DEFAULT_AVATAR || "/avatar.png",
    },
    description: {
      type: String,
      default: "",
    },
    verificationCode: {
      type: String,
    },
    verificationCodeExpires: {
      type: Date,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

userSchema.index({ deleted: 1 });

const User = mongoose.model("User", userSchema);

export default User;
