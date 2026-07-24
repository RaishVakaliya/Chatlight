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
  editMessage,
  deleteMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/users", getUsersForSidebar);
router.get("/search", searchUsers);
router.get("/unread", getUnreadMessagesCount);
router.get("/pinned/:id", getPinnedMessages);
router.get("/:id", getMessages);
router.post("/send/:id", sendMessage);
router.put("/pin/:messageId", pinMessage);
router.put("/unpin/:messageId", unpinMessage);
router.put("/read/:senderId", markMessagesAsRead);
router.put("/edit/:messageId", editMessage);
router.delete("/delete/:messageId", deleteMessage);

export default router;
