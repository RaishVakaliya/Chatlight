import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import {
  LogOut,
  MessageSquare,
  Settings,
  User,
  Search,
  Moon,
  X,
  Bell,
  Menu,
} from "lucide-react";
import logo from "../assets/app_logo.png";
import { useChatStore } from "../store/useChatStore";
import { useState } from "react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const {
    searchUsers,
    searchResults,
    setSelectedUser,
    totalUnreadCount,
    clearSearchResults,
    getUsers,
    getMessages,
    selectedUser,
  } = useChatStore();

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    searchUsers(e.target.value);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSelectUser = (user) => {
    if (!selectedUser || user._id !== selectedUser._id) {
      setSelectedUser(user);
      getMessages(user._id);

      // Navigate to home page if not already there
      navigate("/");
    }
    setShowSearch(false);
    clearSearchResults();
    setSearchQuery("");
  };

  const handleCloseSearch = () => {
    setShowSearch(false);
    clearSearchResults();
    setSearchQuery("");
  };

  return (
    <header
      className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 
    backdrop-blur-lg bg-base-100/80"
    >
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-all"
            >
              <div className="size-16 rounded-lg flex items-center justify-center">
                <img src={logo} alt="Chatlight Logo" />
              </div>
              <h1 className="text-lg font-bold">Chatlight</h1>
            </Link>
          </div>

          {/* Mobile hamburger menu */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="size-6" />
              ) : (
                <Menu className="size-6" />
              )}
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-3">
            {authUser && (
              <>
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className={`btn btn-sm btn-ghost ${
                    showSearch ? "text-primary" : ""
                  }`}
                >
                  <Search className="size-5" />
                </button>

                <div className="relative">
                  <button className="btn btn-sm btn-ghost">
                    <Bell className="size-5" />
                    {totalUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 size-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                        {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                      </span>
                    )}
                  </button>
                </div>
              </>
            )}

            <button className="btn btn-sm btn-ghost" onClick={toggleTheme}>
              {theme === "dark" ? (
                <Sun className="size-5" />
              ) : (
                <Moon className="size-5" />
              )}
            </button>

            <Link
              to={"/settings"}
              className="btn btn-sm gap-2 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>

            {authUser && (
              <>
                <Link to={"/profile"} className="btn btn-sm gap-2">
                  <User className="size-5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                <button className="btn btn-sm gap-2" onClick={logout}>
                  <LogOut className="size-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-base-100 border-b border-base-300 shadow-lg z-50">
          <div className="flex flex-col p-4 space-y-3">
            {authUser && (
              <>
                <button
                  className="flex items-center gap-2 p-2"
                  onClick={() => {
                    setShowSearch(!showSearch);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Search className="size-5" />
                  <span>Search</span>
                </button>
                <button className="flex items-center gap-2 p-2">
                  <Bell className="size-5" />
                  <span>Notifications</span>
                  {totalUnreadCount > 0 && (
                    <span className="ml-auto size-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                      {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                    </span>
                  )}
                </button>
              </>
            )}

            <button
              className="flex items-center gap-2 p-2"
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <Sun className="size-5" />
              ) : (
                <Moon className="size-5" />
              )}
              <span>Theme</span>
            </button>

            <Link to={"/settings"} className="flex items-center gap-2 p-2">
              <Settings className="size-5" />
              <span>Settings</span>
            </Link>

            {authUser && (
              <>
                <Link to={"/profile"} className="flex items-center gap-2 p-2">
                  <User className="size-5" />
                  <span>Profile</span>
                </Link>
                <button
                  className="flex items-center gap-2 p-2"
                  onClick={logout}
                >
                  <LogOut className="size-5" />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Search overlay - conditionally rendered */}
      {showSearch && (
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

            {/* Search results */}
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
                          src={user.profilePic || "/avatar.png"}
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
      )}
    </header>
  );
};
export default Navbar;
