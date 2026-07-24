import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const [activeUsers, [usersWithChatHistory, usersWithChatHistory2]] =
      await Promise.all([
        User.find({
          _id: { $ne: loggedInUserId },
          deleted: { $ne: true },
        })
          .select("-password")
          .lean(),
        Promise.all([
          Message.distinct("senderId", { receiverId: loggedInUserId }),
          Message.distinct("receiverId", { senderId: loggedInUserId }),
        ]),
      ]);

    const chatPartnerIds = [
      ...new Set([...usersWithChatHistory, ...usersWithChatHistory2]),
    ].filter((id) => id.toString() !== loggedInUserId.toString());

    const deletedUsersWithHistory = await User.find({
      _id: { $in: chatPartnerIds },
      deleted: true,
    })
      .select("-password")
      .lean();

    const filteredUsers = [...activeUsers, ...deletedUsersWithHistory];

    const usersWithUnreadCounts = await Promise.all(
      filteredUsers.map(async (user) => {
        const [unreadCount, lastMessage] = await Promise.all([
          Message.countDocuments({
            senderId: user._id,
            receiverId: loggedInUserId,
            read: false,
          }),
          Message.findOne({
            $or: [
              { senderId: user._id, receiverId: loggedInUserId },
              { senderId: loggedInUserId, receiverId: user._id },
            ],
          })
            .sort({ createdAt: -1 })
            .lean(),
        ]);

        const userData = user.deleted
          ? {
              ...user,
              fullName: "Chatlight User",
              profilePic:
                process.env.CLOUDINARY_DEFAULT_AVATAR || "/avatar.png",
              description: "",
            }
          : user;

        return {
          ...userData,
          unreadCount,
          lastMessageTime: lastMessage ? lastMessage.createdAt : user.createdAt,
          lastMessage: lastMessage
            ? {
                text: lastMessage.text,
                image: lastMessage.image,
                senderId: lastMessage.senderId,
                createdAt: lastMessage.createdAt,
                deleted: lastMessage.deleted,
              }
            : null,
        };
      }),
    );

    const sortedUsers = usersWithUnreadCounts.sort((a, b) => {
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });

    res.status(200).json(sortedUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).populate({
      path: "replyTo",
      select: "text image senderId createdAt",
      populate: {
        path: "senderId",
        select: "fullName profilePic",
      },
    });

    const unreadMessages = await Message.find({
      senderId: userToChatId,
      receiverId: myId,
      read: false,
    });

    if (unreadMessages.length > 0) {
      await Message.updateMany(
        {
          senderId: userToChatId,
          receiverId: myId,
          read: false,
        },
        {
          $set: { read: true },
        },
      );

      const senderSocketId = getReceiverSocketId(userToChatId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesRead", {
          receiverId: myId,
          messageIds: unreadMessages.map((msg) => msg._id),
        });
      }
    }

    const updatedMessages = messages.map((message) => {
      if (message.senderId.toString() === myId.toString()) {
        return {
          ...message.toObject(),
          read: message.read,
        };
      } else {
        return {
          ...message.toObject(),
          read: true,
        };
      }
    });

    res.status(200).json(updatedMessages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: image ? "uploading..." : null,
      replyTo: replyTo || null,
    });

    await newMessage.save();

    await newMessage.populate({
      path: "replyTo",
      select: "text image senderId createdAt",
      populate: {
        path: "senderId",
        select: "fullName profilePic",
      },
    });

    const responseMessage = {
      ...newMessage.toObject(),
      image: image || null,
      isUploading: !!image,
    };

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", responseMessage);
    }

    res.status(201).json(responseMessage);

    if (image) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          resource_type: "auto",
          quality: "auto:good",
          fetch_format: "auto",
        });

        const updatedMessage = await Message.findByIdAndUpdate(
          newMessage._id,
          { image: uploadResponse.secure_url },
          { new: true },
        ).populate({
          path: "replyTo",
          select: "text image senderId createdAt",
          populate: {
            path: "senderId",
            select: "fullName profilePic",
          },
        });

        const finalMessage = {
          ...updatedMessage.toObject(),
          isUploading: false,
        };

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("messageUpdated", finalMessage);
        }

        const senderSocketId = getReceiverSocketId(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageUpdated", finalMessage);
        }
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);

        await Message.findByIdAndUpdate(newMessage._id, { image: null });

        const failedMessage = {
          ...newMessage.toObject(),
          image: null,
          isUploading: false,
          uploadFailed: true,
        };

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("messageUpdated", failedMessage);
        }

        const senderSocketId = getReceiverSocketId(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageUpdated", failedMessage);
        }
      }
    }
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { senderId } = req.params;
    const receiverId = req.user._id;

    const unreadMessages = await Message.find({
      senderId: senderId,
      receiverId: receiverId,
      read: false,
    });

    await Message.updateMany(
      {
        senderId: senderId,
        receiverId: receiverId,
        read: false,
      },
      {
        $set: { read: true },
      },
    );

    if (unreadMessages.length > 0) {
      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesRead", {
          receiverId: receiverId,
          messageIds: unreadMessages.map((msg) => msg._id),
        });
      }
    }

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.log("Error in markMessagesAsRead Controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUnreadMessagesCount = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const totalUnreadCount = await Message.countDocuments({
      receiverId: loggedInUserId,
      read: false,
    });

    res.status(200).json({ totalUnreadCount });
  } catch (error) {
    console.log("Error in getUnreadMessagesCount Controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const loggedInUserId = req.user._id;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const users = await User.find({
      _id: { $ne: loggedInUserId },
      fullName: { $regex: query, $options: "i" },
      deleted: { $ne: true },
    }).select("-password");

    const usersWithUnreadCounts = await Promise.all(
      users.map(async (user) => {
        const unreadCount = await Message.countDocuments({
          senderId: user._id,
          receiverId: loggedInUserId,
          read: false,
        });

        return {
          ...user._doc,
          unreadCount,
        };
      }),
    );

    res.status(200).json(usersWithUnreadCounts);
  } catch (error) {
    console.error("Error in searchUsers Controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

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
