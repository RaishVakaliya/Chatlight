export function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function getProfilePicture(profilePic) {
  const defaultAvatar = import.meta.env.VITE_CLOUDINARY_DEFAULT_AVATAR || "/avatar.png";
  return profilePic && profilePic.trim() !== "" ? profilePic : defaultAvatar;
}

export function truncateText(text, maxLength = 30) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function formatLastMessage(lastMessage, currentUserId) {
  if (!lastMessage) return "No messages yet";

  // If the message is deleted
  if (lastMessage.deleted) {
    return "Message was deleted";
  }

  // If it's an image message
  if (lastMessage.image && !lastMessage.text) {
    const sender = lastMessage.senderId === currentUserId ? "You" : "";
    return `${sender ? "You: " : ""}📷 Photo`;
  }

  // If it has text
  if (lastMessage.text) {
    const sender = lastMessage.senderId === currentUserId ? "You" : "";
    const truncatedText = truncateText(lastMessage.text, 25);
    return `${sender ? "You: " : ""}${truncatedText}`;
  }

  return "No messages yet";
}
