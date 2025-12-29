import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const isDev = process.env.NODE_ENV === "development";

  const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true, // prevent XSS attacks
    path: "/", // Ensure cookie is available for all paths
    // In production we're on a different domain (Vercel ↔ Render), so we need SameSite=None + Secure
    sameSite: isDev ? "lax" : "none",
    secure: !isDev, // Must be true in production for SameSite=None
  };

  console.log("Setting JWT cookie with options:", {
    ...cookieOptions,
    token: token.substring(0, 20) + "...", // Log only first 20 chars for security
  });

  res.cookie("jwt", token, cookieOptions);

  return token;
};
