import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  searchUsers,
  getUnreadMessagesCount,
  markMessagesAsRead,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/search", protectRoute, searchUsers);
router.get("/unread", protectRoute, getUnreadMessagesCount);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.put("/read/:senderId", protectRoute, markMessagesAsRead);

export default router;
