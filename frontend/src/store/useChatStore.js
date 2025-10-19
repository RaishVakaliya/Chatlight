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

      // Refresh users list to get updated unread counts
      get().getUsers();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
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

      // Update the selected user's last message time and re-sort users
      const updatedUsers = users.map((user) => {
        if (user._id === selectedUser._id) {
          return {
            ...user,
            lastMessageTime: res.data.createdAt,
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

      set({
        messages: [...get().messages, newMessage],
      });
    });

    // Listen for new messages from other users to update unread counts and sort
    socket.on("newMessage", (newMessage) => {
      const isMessageSentToCurrentUser =
        newMessage.receiverId === useAuthStore.getState().authUser._id;
      if (isMessageSentToCurrentUser) {
        // Update the specific user's last message time and re-sort
        const { users } = get();
        const updatedUsers = users.map((user) => {
          if (user._id === newMessage.senderId) {
            return {
              ...user,
              unreadCount: (user.unreadCount || 0) + 1,
              lastMessageTime: newMessage.createdAt,
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
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messagesRead");
    socket.off("messagePinned");
    socket.off("messageUnpinned");
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

  setReplyingTo: (message) => set({ replyingTo: message }),
  
  clearReplyingTo: () => set({ replyingTo: null }),
}));
