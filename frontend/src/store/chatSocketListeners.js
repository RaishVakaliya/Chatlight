import { useAuthStore } from "./useAuthStore";
import { axiosInstance } from "../lib/axios";

export const setupMessageSocketListeners = (get, set) => {
  const socket = useAuthStore.getState().socket;
  if (!socket) return;

  socket.on("messagesRead", (data) => {
    const { messageIds } = data;
    const { messages } = get();

    const updatedMessages = messages.map((message) => {
      if (messageIds.includes(message._id)) {
        return { ...message, read: true };
      }
      return message;
    });

    set({ messages: updatedMessages });
  });

  socket.on("messagePinned", (pinnedMessage) => {
    const { messages, pinnedMessages } = get();
    const updatedMessages = messages.map((msg) =>
      msg._id === pinnedMessage._id ? pinnedMessage : msg,
    );
    const isAlreadyPinned = pinnedMessages.some(
      (msg) => msg._id === pinnedMessage._id,
    );
    const updatedPinnedMessages = isAlreadyPinned
      ? pinnedMessages
      : [pinnedMessage, ...pinnedMessages];

    set({
      messages: updatedMessages,
      pinnedMessages: updatedPinnedMessages,
    });
  });

  socket.on("messageUnpinned", (unpinnedMessage) => {
    const { messages, pinnedMessages } = get();
    const updatedMessages = messages.map((msg) =>
      msg._id === unpinnedMessage._id ? unpinnedMessage : msg,
    );
    const updatedPinnedMessages = pinnedMessages.filter(
      (msg) => msg._id !== unpinnedMessage._id,
    );

    set({
      messages: updatedMessages,
      pinnedMessages: updatedPinnedMessages,
    });
  });

  socket.on("messageUpdated", (updatedMessage) => {
    const { messages } = get();
    const updatedMessages = messages.map((msg) =>
      msg._id === updatedMessage._id ? updatedMessage : msg,
    );

    set({ messages: updatedMessages });
  });

  socket.on("messageDeleted", (deletedMessage) => {
    const { messages, pinnedMessages, users } = get();
    const updatedMessages = messages.map((msg) =>
      msg._id === deletedMessage._id ? deletedMessage : msg,
    );
    const updatedPinnedMessages = pinnedMessages.filter(
      (msg) => msg._id !== deletedMessage._id,
    );

    const currentUserId = useAuthStore.getState().authUser._id;
    const updatedUsers = users.map((user) => {
      const isLastMessageMatch =
        user.lastMessage &&
        ((user.lastMessage.senderId === deletedMessage.senderId &&
          user.lastMessage.createdAt === deletedMessage.createdAt) ||
          (((deletedMessage.senderId === currentUserId &&
            deletedMessage.receiverId === user._id) ||
            (deletedMessage.senderId === user._id &&
              deletedMessage.receiverId === currentUserId)) &&
            user.lastMessage.createdAt === deletedMessage.createdAt));

      if (isLastMessageMatch) {
        return {
          ...user,
          lastMessage: {
            ...user.lastMessage,
            deleted: true,
            text: null,
            image: null,
          },
        };
      }
      return user;
    });

    set({
      messages: updatedMessages,
      pinnedMessages: updatedPinnedMessages,
      users: updatedUsers,
    });
  });

  socket.on("messageEdited", (editedMessage) => {
    const { messages } = get();
    const updatedMessages = messages.map((msg) =>
      msg._id === editedMessage._id ? editedMessage : msg,
    );

    set({ messages: updatedMessages });
  });
};

export const setupGlobalSocketListeners = (get, set) => {
  const socket = useAuthStore.getState().socket;
  if (!socket) return;

  socket.off("profileUpdated");
  socket.off("newMessage");

  socket.on("profileUpdated", (profileData) => {
    const { users, selectedUser } = get();
    const updatedUsers = users.map((user) =>
      user._id === profileData.userId
        ? {
            ...user,
            profilePic: profileData.profilePic,
            description: profileData.description,
          }
        : user,
    );

    const updatedSelectedUser =
      selectedUser && selectedUser._id === profileData.userId
        ? {
            ...selectedUser,
            profilePic: profileData.profilePic,
            description: profileData.description,
          }
        : selectedUser;

    set({
      users: updatedUsers,
      selectedUser: updatedSelectedUser,
    });
  });

  socket.on("newMessage", (newMessage) => {
    const authUser = useAuthStore.getState().authUser;
    if (!authUser) return;

    const { users, selectedUser } = get();

    if (newMessage.receiverId === authUser._id) {
      const isFromSelectedUser =
        selectedUser && selectedUser._id === newMessage.senderId;

      if (isFromSelectedUser) {
        const messageWithReadStatus = { ...newMessage, read: true };
        set({
          messages: [...get().messages, messageWithReadStatus],
        });
        axiosInstance
          .put(`/messages/read/${newMessage.senderId}`)
          .catch((err) =>
            console.error("Failed to mark message as read:", err),
          );
      }

      const senderUser = users.find((user) => user._id === newMessage.senderId);

      if (!senderUser) {
        get().getUsers();
      } else {
        const newUnreadCount = isFromSelectedUser
          ? 0
          : (senderUser.unreadCount || 0) + 1;

        const updatedUsers = users.map((user) => {
          if (user._id === newMessage.senderId) {
            return {
              ...user,
              unreadCount: newUnreadCount,
              lastMessageTime: newMessage.createdAt,
              lastMessage: {
                text: newMessage.text,
                image: newMessage.image,
                senderId: newMessage.senderId,
                createdAt: newMessage.createdAt,
                deleted: newMessage.deleted,
              },
            };
          }
          return user;
        });

        const sortedUsers = updatedUsers.sort(
          (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime),
        );

        const unreadChatCount = sortedUsers.filter(
          (user) => (user.unreadCount || 0) > 0,
        ).length;

        set({
          users: sortedUsers,
          unreadChatCount,
        });
      }
    }
  });
};
