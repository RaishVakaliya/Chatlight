import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    // Get unread message counts and last message time for each user
    const usersWithUnreadCounts = await Promise.all(
      filteredUsers.map(async (user) => {
        const unreadCount = await Message.countDocuments({
          senderId: user._id,
          receiverId: loggedInUserId,
          read: false,
        });

        // Get the last message time between current user and this user
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: user._id, receiverId: loggedInUserId },
            { senderId: loggedInUserId, receiverId: user._id },
          ],
        }).sort({ createdAt: -1 });

        return {
          ...user._doc,
          unreadCount,
          lastMessageTime: lastMessage ? lastMessage.createdAt : user.createdAt,
        };
      })
    );

    // Sort users by last message time (most recent first)
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
    });

    // Mark messages sent to current user as read
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
        }
      );

      // Notify the sender that their messages have been read
      const senderSocketId = getReceiverSocketId(userToChatId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesRead", {
          receiverId: myId,
          messageIds: unreadMessages.map(msg => msg._id),
        });
      }
    }

    // Update messages with read status
    const updatedMessages = messages.map((message) => {
      if (message.senderId.toString() === myId.toString()) {
        // For sent messages, check if they're read
        return {
          ...message.toObject(),
          read: message.read,
        };
      } else {
        // For received messages, they're now read
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
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { senderId } = req.params;
    const receiverId = req.user._id;

    // Mark all messages from this sender as read
    await Message.updateMany(
      {
        senderId: senderId,
        receiverId: receiverId,
        read: false,
      },
      {
        $set: { read: true },
      }
    );

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.log("Error in markMessagesAsRead Controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUnreadMessagesCount = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Count all unread messages sent to the current user
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

    // Find users whose name contains the query (case insensitive)
    const users = await User.find({
      _id: { $ne: loggedInUserId },
      fullName: { $regex: query, $options: "i" },
    }).select("-password");

    // Get unread message counts for each user
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
      })
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

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is part of this conversation
    const isParticipant = 
      message.senderId.toString() === userId.toString() || 
      message.receiverId.toString() === userId.toString();

    if (!isParticipant) {
      return res.status(403).json({ message: "Not authorized to pin this message" });
    }

    // Update message to pinned
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      {
        pinned: true,
        pinnedBy: userId,
        pinnedAt: new Date(),
      },
      { new: true }
    );

    // Emit socket event to both users
    const otherUserId = message.senderId.toString() === userId.toString() 
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

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is part of this conversation
    const isParticipant = 
      message.senderId.toString() === userId.toString() || 
      message.receiverId.toString() === userId.toString();

    if (!isParticipant) {
      return res.status(403).json({ message: "Not authorized to unpin this message" });
    }

    // Update message to unpinned
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      {
        pinned: false,
        pinnedBy: null,
        pinnedAt: null,
      },
      { new: true }
    );

    // Emit socket event to both users
    const otherUserId = message.senderId.toString() === userId.toString() 
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
    console.error("Error in getPinnedMessages Controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
