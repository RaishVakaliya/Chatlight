import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

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
