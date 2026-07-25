import { X } from "lucide-react";
import { getProfilePicture } from "../lib/utils";

const SearchOverlay = ({
  searchQuery,
  handleSearch,
  handleCloseSearch,
  searchResults,
  handleSelectUser,
}) => {
  return (
    <div className="absolute top-16 left-0 w-full py-3 px-4 bg-base-100 border-b border-base-300 shadow-lg z-30">
      <div className="relative max-w-xl mx-auto">
        <input
          type="text"
          placeholder="Search users..."
          className="input input-bordered w-full pr-10"
          value={searchQuery}
          onChange={handleSearch}
          autoFocus
        />
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2"
          onClick={handleCloseSearch}
        >
          <X className="size-5" />
        </button>

        {searchResults.length > 0 && (
          <div className="absolute w-full mt-1 bg-base-100 rounded-lg shadow-lg border border-base-300 max-h-72 overflow-y-auto z-50">
            {searchResults.map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-2 p-3 hover:bg-base-200 cursor-pointer"
                onClick={() => handleSelectUser(user)}
              >
                <div className="avatar">
                  <div className="w-10 h-10 rounded-full">
                    <img
                      src={getProfilePicture(user.profilePic)}
                      alt={user.fullName}
                    />
                  </div>
                </div>
                <div>
                  <div className="font-medium">{user.fullName}</div>
                  <div className="text-sm text-base-content/60">
                    {user.unreadCount > 0 && (
                      <span className="text-primary">
                        {user.unreadCount} unread messages
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;
