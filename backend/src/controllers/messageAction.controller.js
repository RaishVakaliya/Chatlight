import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Message text is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this message" });
    }

    if (message.deleted) {
      return res.status(400).json({ message: "Cannot edit deleted message" });
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      {
        $set: {
          text: text.trim(),
          edited: true,
          editedAt: new Date(),
        },
      },
      { new: true },
    ).populate({
      path: "replyTo",
      select: "text image senderId createdAt",
      populate: {
        path: "senderId",
        select: "fullName profilePic",
      },
    });

    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", updatedMessage);
    }

    const senderSocketId = getReceiverSocketId(message.senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageEdited", updatedMessage);
    }

    res.status(200).json(updatedMessage);
  } catch (error) {
    console.log("Error in editMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this message" });
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      {
        $set: {
          deleted: true,
          deletedAt: new Date(),
          text: null,
          image: null,
        },
      },
      { new: true },
    ).populate({
      path: "replyTo",
      select: "text image senderId createdAt",
      populate: {
        path: "senderId",
        select: "fullName profilePic",
      },
    });

    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", updatedMessage);
    }

    const senderSocketId = getReceiverSocketId(message.senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDeleted", updatedMessage);
    }

    res.status(200).json(updatedMessage);
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
