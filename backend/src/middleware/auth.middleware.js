import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No Token Provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user || user.deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure user always has a profile picture
    console.log("Profile Picture Debug:", {
      userId: user._id,
      originalProfilePic: user.profilePic,
      profilePicType: typeof user.profilePic,
      profilePicLength: user.profilePic?.length,
      isEmpty: !user.profilePic,
      isEmptyString: user.profilePic === "",
    });

    if (!user.profilePic || user.profilePic.trim() === "") {
      console.log("Setting default profile picture for user:", user._id);
      user.profilePic = process.env.CLOUDINARY_DEFAULT_AVATAR || "/avatar.png";
    }

    console.log("Final profilePic being sent:", user.profilePic);
    req.user = user;

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
