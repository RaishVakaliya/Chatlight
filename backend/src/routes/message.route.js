import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  searchUsers,
  getUnreadMessagesCount,
  markMessagesAsRead,
  pinMessage,
  unpinMessage,
  getPinnedMessages,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/search", protectRoute, searchUsers);
router.get("/unread", protectRoute, getUnreadMessagesCount);
router.get("/pinned/:id", protectRoute, getPinnedMessages);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.put("/pin/:messageId", protectRoute, pinMessage);
router.put("/unpin/:messageId", protectRoute, unpinMessage);
router.put("/read/:senderId", protectRoute, markMessagesAsRead);

export default router;
