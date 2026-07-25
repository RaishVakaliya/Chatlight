import User from "../models/user.model.js";
import Message from "../models/message.model.js";

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
