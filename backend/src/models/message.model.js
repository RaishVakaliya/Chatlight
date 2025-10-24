import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    pinnedAt: {
      type: Date,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    edited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
