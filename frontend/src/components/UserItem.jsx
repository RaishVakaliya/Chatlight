import { memo } from "react";

const UserItem = memo(({ 
  user, 
  selectedUser, 
  onlineUsers, 
  onSelectUser 
}) => {
  const isSelected = selectedUser?._id === user._id;
  const isOnline = onlineUsers.includes(user._id);

  return (
    <button
      onClick={() => onSelectUser(user)}
      className={`
        w-full p-3 flex items-center gap-3
        hover:bg-base-300 transition-colors
        ${isSelected ? "bg-base-300 ring-1 ring-base-300" : ""}
      `}
    >
      <div className="relative mx-auto lg:mx-0 select-none">
        <img
          src={user.profilePic || "/avatar.png"}
          alt={user.name}
          className="size-12 object-cover rounded-full"
        />
        {isOnline && (
          <span
            className="absolute bottom-0 right-0 size-3 bg-green-500 
            rounded-full ring-2 ring-zinc-900"
          />
        )}
        {user.unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 size-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold ring-2 ring-base-100">
            {user.unreadCount > 9 ? "9+" : user.unreadCount}
          </div>
        )}
      </div>

      {/* User info - only visible on larger screens */}
      <div className="hidden lg:block text-left min-w-0">
        <div className="font-medium truncate">{user.fullName}</div>
        <div className="text-sm text-zinc-400">
          {isOnline ? "Online" : "Offline"}
        </div>
      </div>
    </button>
  );
});

UserItem.displayName = "UserItem";

export default UserItem;
