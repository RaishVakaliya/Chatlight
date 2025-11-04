import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  searchResults: [],
  pinnedMessages: [],
  replyingTo: null,
  unreadChatCount: 0,
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSearching: false,
  isPinnedMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });

      // Calculate number of chats with unread messages
      const unreadChatCount = res.data.filter(
        (user) => (user.unreadCount || 0) > 0
      ).length;
      set({ unreadChatCount: unreadChatCount });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });

      // Mark messages as read in the database
      await axiosInstance.put(`/messages/read/${userId}`);

      // Update only the specific user's unread count instead of refreshing all users
      get().updateUserUnreadCount(userId, 0);
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  updateUserUnreadCount: (userId, newCount) => {
    const { users } = get();
    const updatedUsers = users.map((user) => {
      if (user._id === userId) {
        return { ...user, unreadCount: newCount };
      }
      return user;
    });

    // Recalculate total unread chat count
    const unreadChatCount = updatedUsers.filter(
      (user) => (user.unreadCount || 0) > 0
    ).length;

    set({
      users: updatedUsers,
      unreadChatCount: unreadChatCount,
    });
  },

  refreshUnreadCount: async () => {
    try {
      // Refresh users to get updated unread chat count
      get().getUsers();
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages, users } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      // Update messages
      set({ messages: [...messages, res.data] });

      // Update the selected user's last message time and last message data, then re-sort users
      const updatedUsers = users.map((user) => {
        if (user._id === selectedUser._id) {
          return {
            ...user,
            lastMessageTime: res.data.createdAt,
            lastMessage: {
              text: res.data.text,
              image: res.data.image,
              senderId: res.data.senderId,
              createdAt: res.data.createdAt,
              deleted: res.data.deleted,
            },
          };
        }
        return user;
      });

      // Sort users by last message time (most recent first)
      const sortedUsers = updatedUsers.sort((a, b) => {
        return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
      });

      set({ users: sortedUsers });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      // Add message to current chat and mark as read immediately
      const messageWithReadStatus = { ...newMessage, read: true };
      set({
        messages: [...get().messages, messageWithReadStatus],
      });

      // Automatically mark message as read in backend since chat is active
      // This will trigger the backend to notify the sender
      try {
        axiosInstance.put(`/messages/read/${newMessage.senderId}`);
      } catch (error) {
        console.error("Failed to mark message as read:", error);
      }
    });

    // Listen for new messages from other users to update unread counts and sort
    socket.on("newMessage", (newMessage) => {
      const isMessageSentToCurrentUser =
        newMessage.receiverId === useAuthStore.getState().authUser._id;
      if (isMessageSentToCurrentUser) {
        // Use the selective update function instead of full users array manipulation
        const { users, selectedUser } = get();
        const senderUser = users.find(
          (user) => user._id === newMessage.senderId
        );

        if (senderUser) {
          // Only increment unread count if this chat is not currently selected
          const shouldIncrementUnread =
            !selectedUser || selectedUser._id !== newMessage.senderId;
          const newUnreadCount = shouldIncrementUnread
            ? (senderUser.unreadCount || 0) + 1
            : senderUser.unreadCount || 0;

          // Update the specific user with new unread count, last message time, and last message data
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

          // Sort users by last message time (most recent first)
          const sortedUsers = updatedUsers.sort((a, b) => {
            return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
          });

          // Update unread chat count
          const unreadChatCount = sortedUsers.filter(
            (user) => (user.unreadCount || 0) > 0
          ).length;

          set({
            users: sortedUsers,
            unreadChatCount: unreadChatCount,
          });
        }
      }
    });

    // Listen for messages read events
    socket.on("messagesRead", (data) => {
      const { messageIds } = data;
      const { messages } = get();

      // Update read status for the specified messages
      const updatedMessages = messages.map((message) => {
        if (messageIds.includes(message._id)) {
          return { ...message, read: true };
        }
        return message;
      });

      set({ messages: updatedMessages });
    });

    // Listen for message pinned events
    socket.on("messagePinned", (pinnedMessage) => {
      const { messages, pinnedMessages } = get();

      // Update message in current messages
      const updatedMessages = messages.map((msg) =>
        msg._id === pinnedMessage._id ? pinnedMessage : msg
      );

      // Add to pinned messages if not already there
      const isAlreadyPinned = pinnedMessages.some(
        (msg) => msg._id === pinnedMessage._id
      );
      const updatedPinnedMessages = isAlreadyPinned
        ? pinnedMessages
        : [pinnedMessage, ...pinnedMessages];

      set({
        messages: updatedMessages,
        pinnedMessages: updatedPinnedMessages,
      });
    });

    // Listen for message unpinned events
    socket.on("messageUnpinned", (unpinnedMessage) => {
      const { messages, pinnedMessages } = get();

      // Update message in current messages
      const updatedMessages = messages.map((msg) =>
        msg._id === unpinnedMessage._id ? unpinnedMessage : msg
      );

      // Remove from pinned messages
      const updatedPinnedMessages = pinnedMessages.filter(
        (msg) => msg._id !== unpinnedMessage._id
      );

      set({
        messages: updatedMessages,
        pinnedMessages: updatedPinnedMessages,
      });
    });

    // Listen for message updates (image upload completion)
    socket.on("messageUpdated", (updatedMessage) => {
      const { messages } = get();

      // Update the message in current messages
      const updatedMessages = messages.map((msg) =>
        msg._id === updatedMessage._id ? updatedMessage : msg
      );

      set({ messages: updatedMessages });
    });

    // Listen for message deletion events
    socket.on("messageDeleted", (deletedMessage) => {
      const { messages, pinnedMessages, users } = get();

      // Update the message in current messages
      const updatedMessages = messages.map((msg) =>
        msg._id === deletedMessage._id ? deletedMessage : msg
      );

      // Remove from pinned messages if it was pinned
      const updatedPinnedMessages = pinnedMessages.filter(
        (msg) => msg._id !== deletedMessage._id
      );

      // Update sidebar if this was the last message
      const currentUserId = useAuthStore.getState().authUser._id;
      const updatedUsers = users.map((user) => {
        // Check if this deleted message was the last message for this conversation
        // The deleted message could be from current user to this user, or from this user to current user
        const isLastMessageMatch =
          user.lastMessage &&
          ((user.lastMessage.senderId === deletedMessage.senderId &&
            user.lastMessage.createdAt === deletedMessage.createdAt) ||
            // Additional check: if the conversation involves this user and the deleted message
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

    // Listen for message edit events
    socket.on("messageEdited", (editedMessage) => {
      const { messages } = get();

      // Update the message in current messages
      const updatedMessages = messages.map((msg) =>
        msg._id === editedMessage._id ? editedMessage : msg
      );

      set({ messages: updatedMessages });
    });
  },

  subscribeToGlobalEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Listen for profile updates from any user
    socket.on("profileUpdated", (profileData) => {
      const { users, selectedUser } = get();

      // Update users list in sidebar
      const updatedUsers = users.map((user) =>
        user._id === profileData.userId
          ? {
              ...user,
              profilePic: profileData.profilePic,
              description: profileData.description,
            }
          : user
      );

      // Update selected user if it's the one that got updated (for chat header and contact info)
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
  },

  unsubscribeFromGlobalEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("profileUpdated");
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messagesRead");
    socket.off("messagePinned");
    socket.off("messageUnpinned");
    socket.off("messageUpdated");
    socket.off("messageEdited");
    socket.off("messageDeleted");
  },

  searchUsers: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }

    set({ isSearching: true });
    try {
      const res = await axiosInstance.get(`/messages/search?query=${query}`);
      set({ searchResults: res.data });
    } catch (error) {
      toast.error(error.response.data.message || "Failed to search users");
    } finally {
      set({ isSearching: false });
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  clearSelectedUser: () => set({ selectedUser: null, messages: [] }),

  clearSearchResults: () => set({ searchResults: [] }),

  getPinnedMessages: async (userId) => {
    set({ isPinnedMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/pinned/${userId}`);
      set({ pinnedMessages: res.data });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch pinned messages"
      );
    } finally {
      set({ isPinnedMessagesLoading: false });
    }
  },

  pinMessage: async (messageId) => {
    try {
      const res = await axiosInstance.put(`/messages/pin/${messageId}`);

      // Update the message in current messages
      const { messages } = get();
      const updatedMessages = messages.map((msg) =>
        msg._id === messageId
          ? {
              ...msg,
              pinned: true,
              pinnedBy: res.data.pinnedBy,
              pinnedAt: res.data.pinnedAt,
            }
          : msg
      );
      set({ messages: updatedMessages });

      // Add to pinned messages if not already there
      const { pinnedMessages } = get();
      const isAlreadyPinned = pinnedMessages.some(
        (msg) => msg._id === messageId
      );
      if (!isAlreadyPinned) {
        set({ pinnedMessages: [res.data, ...pinnedMessages] });
      }

      toast.success("Message pinned");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to pin message");
    }
  },

  unpinMessage: async (messageId) => {
    try {
      const res = await axiosInstance.put(`/messages/unpin/${messageId}`);

      // Update the message in current messages
      const { messages } = get();
      const updatedMessages = messages.map((msg) =>
        msg._id === messageId
          ? { ...msg, pinned: false, pinnedBy: null, pinnedAt: null }
          : msg
      );
      set({ messages: updatedMessages });

      // Remove from pinned messages
      const { pinnedMessages } = get();
      const updatedPinnedMessages = pinnedMessages.filter(
        (msg) => msg._id !== messageId
      );
      set({ pinnedMessages: updatedPinnedMessages });

      toast.success("Message unpinned");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to unpin message");
    }
  },

  editMessage: async (messageId, newText) => {
    try {
      const res = await axiosInstance.put(`/messages/edit/${messageId}`, {
        text: newText,
      });

      // Update the message in current messages
      const { messages } = get();
      const updatedMessages = messages.map((msg) =>
        msg._id === messageId ? res.data : msg
      );
      set({ messages: updatedMessages });

      toast.success("Message edited");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to edit message");
    }
  },

  deleteMessage: async (messageId) => {
    try {
      const res = await axiosInstance.delete(`/messages/delete/${messageId}`);

      // Update the message in current messages
      const { messages, users, selectedUser } = get();
      const updatedMessages = messages.map((msg) =>
        msg._id === messageId ? res.data : msg
      );

      // Remove from pinned messages if it was pinned
      const { pinnedMessages } = get();
      const updatedPinnedMessages = pinnedMessages.filter(
        (msg) => msg._id !== messageId
      );

      // Update sidebar if this was the last message
      const currentUserId = useAuthStore.getState().authUser._id;
      const updatedUsers = users.map((user) => {
        // Check if this deleted message was the last message for this conversation
        if (
          selectedUser &&
          user._id === selectedUser._id &&
          user.lastMessage &&
          user.lastMessage.createdAt === res.data.createdAt
        ) {
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

      toast.success("Message deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  setReplyingTo: (message) => set({ replyingTo: message }),

  clearReplyingTo: () => set({ replyingTo: null }),
}));
