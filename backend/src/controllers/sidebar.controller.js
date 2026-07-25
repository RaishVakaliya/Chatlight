import User from "../models/user.model.js";
import Message from "../models/message.model.js";

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
