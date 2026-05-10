import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const isDev = process.env.NODE_ENV === "development";

  const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    path: "/",
    sameSite: isDev ? "lax" : "none",
    secure: !isDev,
    partitioned: !isDev,
  };

  console.log("Setting JWT cookie with options:", {
    ...cookieOptions,
    token: token.substring(0, 20) + "...",
  });

  res.cookie("jwt", token, cookieOptions);

  return token;
};
