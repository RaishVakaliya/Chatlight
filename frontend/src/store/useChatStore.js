import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import {
  setupMessageSocketListeners,
  setupGlobalSocketListeners,
} from "./chatSocketListeners";

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
    if (get().isUsersLoading) return;
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });

      const unreadChatCount = res.data.filter(
        (user) => (user.unreadCount || 0) > 0,
      ).length;
      set({ unreadChatCount });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      if (get().selectedUser?._id !== userId) return;

      set({ messages: res.data });

      axiosInstance
        .put(`/messages/read/${userId}`)
        .catch((err) => console.error("Failed to mark messages as read:", err));

      get().updateUserUnreadCount(userId, 0);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      if (get().selectedUser?._id === userId) {
        set({ isMessagesLoading: false });
      }
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

    const unreadChatCount = updatedUsers.filter(
      (user) => (user.unreadCount || 0) > 0,
    ).length;

    set({
      users: updatedUsers,
      unreadChatCount,
    });
  },

  refreshUnreadCount: async () => {
    try {
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
        messageData,
      );

      set({ messages: [...messages, res.data] });

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

      const sortedUsers = updatedUsers.sort(
        (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime),
      );

      set({ users: sortedUsers });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    setupMessageSocketListeners(get, set);
  },

  subscribeToGlobalEvents: () => {
    setupGlobalSocketListeners(get, set);
  },

  unsubscribeFromGlobalEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("profileUpdated");
    socket.off("newMessage");
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
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
      toast.error(error.response?.data?.message || "Failed to search users");
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
        error.response?.data?.message || "Failed to fetch pinned messages",
      );
    } finally {
      set({ isPinnedMessagesLoading: false });
    }
  },

  pinMessage: async (messageId) => {
    try {
      const res = await axiosInstance.put(`/messages/pin/${messageId}`);
      const { messages } = get();
      const updatedMessages = messages.map((msg) =>
        msg._id === messageId
          ? {
              ...msg,
              pinned: true,
              pinnedBy: res.data.pinnedBy,
              pinnedAt: res.data.pinnedAt,
            }
          : msg,
      );
      set({ messages: updatedMessages });

      const { pinnedMessages } = get();
      const isAlreadyPinned = pinnedMessages.some(
        (msg) => msg._id === messageId,
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
      const { messages } = get();
      const updatedMessages = messages.map((msg) =>
        msg._id === messageId
          ? { ...msg, pinned: false, pinnedBy: null, pinnedAt: null }
          : msg,
      );
      set({ messages: updatedMessages });

      const { pinnedMessages } = get();
      const updatedPinnedMessages = pinnedMessages.filter(
        (msg) => msg._id !== messageId,
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

      const { messages } = get();
      const updatedMessages = messages.map((msg) =>
        msg._id === messageId ? res.data : msg,
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
      const { messages, users, selectedUser } = get();
      const updatedMessages = messages.map((msg) =>
        msg._id === messageId ? res.data : msg,
      );

      const { pinnedMessages } = get();
      const updatedPinnedMessages = pinnedMessages.filter(
        (msg) => msg._id !== messageId,
      );

      const updatedUsers = users.map((user) => {
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
