import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const isDev = process.env.NODE_ENV === "development";

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // MS
    httpOnly: true, // prevent XSS attacks cross-site scripting attacks
    // In production we're on a different domain (Vercel ↔ Render), so we need SameSite=None + Secure
    sameSite: isDev ? "lax" : "none",
    secure: !isDev,
  });

  return token;
};
