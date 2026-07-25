import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const pinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const isParticipant =
      message.senderId.toString() === userId.toString() ||
      message.receiverId.toString() === userId.toString();

    if (!isParticipant) {
      return res
        .status(403)
        .json({ message: "Not authorized to pin this message" });
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      {
        pinned: true,
        pinnedBy: userId,
        pinnedAt: new Date(),
      },
      { new: true },
    );

    const otherUserId =
      message.senderId.toString() === userId.toString()
        ? message.receiverId
        : message.senderId;

    const receiverSocketId = getReceiverSocketId(otherUserId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messagePinned", updatedMessage);
    }

    res.status(200).json(updatedMessage);
  } catch (error) {
    console.error("Error in pinMessage Controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const unpinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const isParticipant =
      message.senderId.toString() === userId.toString() ||
      message.receiverId.toString() === userId.toString();

    if (!isParticipant) {
      return res
        .status(403)
        .json({ message: "Not authorized to unpin this message" });
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      {
        pinned: false,
        pinnedBy: null,
        pinnedAt: null,
      },
      { new: true },
    );

    const otherUserId =
      message.senderId.toString() === userId.toString()
        ? message.receiverId
        : message.senderId;

    const receiverSocketId = getReceiverSocketId(otherUserId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageUnpinned", updatedMessage);
    }

    res.status(200).json(updatedMessage);
  } catch (error) {
    console.error("Error in unpinMessage Controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getPinnedMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const pinnedMessages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
      pinned: true,
    }).sort({ pinnedAt: -1 });

    res.status(200).json(pinnedMessages);
  } catch (error) {
    console.log("Error in getPinnedMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
