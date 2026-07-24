import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import cors from "cors";

import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

const __dirname = path.resolve();

const PORT = process.env.PORT || 5001;

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) =>
      url.trim().replace(/\/$/, ""),
    )
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const isAllowed = allowedOrigins.some((allowedOrigin) => {
        if (allowedOrigin === origin) return true;

        if (allowedOrigin.includes("*")) {
          const parts = allowedOrigin.split("*");
          if (parts.length === 2) {
            const matches =
              origin.startsWith(parts[0]) && origin.endsWith(parts[1]);
            if (matches) return true;
          }

          const pattern = allowedOrigin
            .replace(/[.+^${}()|[\]\\]/g, "\\$&")
            .replace(/\*/g, ".*");
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(origin);
        }
        return false;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        console.error("CORS blocked origin:", origin);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/", (req, res) => {
  res.send("Chatlight backend is running");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Your API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});
