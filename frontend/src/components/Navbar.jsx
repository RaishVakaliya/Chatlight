import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { LogOut, Settings, User, Search, X, Bell, Menu } from "lucide-react";
import logo from "../assets/app_logo.png";
import LogoutConfirmationModal from "./LogoutConfirmationModal";
import SearchOverlay from "./SearchOverlay";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const navigate = useNavigate();

  const {
    searchUsers,
    searchResults,
    setSelectedUser,
    unreadChatCount,
    clearSearchResults,
    getMessages,
    selectedUser,
  } = useChatStore();

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const mobileMenuRef = useRef(null);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    searchUsers(e.target.value);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutModal(false);
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const handleSelectUser = (user) => {
    if (!selectedUser || user._id !== selectedUser._id) {
      setSelectedUser(user);
      getMessages(user._id);
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
              className="flex items-center gap-2.5 transition-all select-none"
            >
              <div className="size-16 rounded-lg flex items-center justify-center">
                <img src={logo} alt="Chatlight Logo" />
              </div>
              <h1 className="text-lg font-bold">Chatlight</h1>
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-3">
            {authUser && (
              <div className="flex items-center">
                <button
                  onClick={() => {
                    setShowSearch(!showSearch);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`btn btn-sm btn-ghost ${
                    showSearch ? "text-primary" : ""
                  }`}
                >
                  <Search className="size-5" />
                </button>

                <div className="relative">
                  <button className="btn btn-sm btn-ghost">
                    <Bell className="size-5" />
                    {unreadChatCount > 0 && (
                      <span className="absolute -top-1 right-1 size-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                        {unreadChatCount > 99 ? "99+" : unreadChatCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}
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
                    {unreadChatCount > 0 && (
                      <span className="absolute -top-1 right-1 size-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                        {unreadChatCount > 99 ? "99+" : unreadChatCount}
                      </span>
                    )}
                  </button>
                </div>
              </>
            )}

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

                <button
                  className="btn btn-sm gap-2"
                  onClick={handleLogoutClick}
                >
                  <LogOut className="size-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden absolute top-16 right-0 w-1/2 bg-base-100 border-b border-l border-base-300 shadow-lg z-50 rounded-bl-lg"
        >
          <div className="flex flex-col p-4 space-y-3">
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
                  onClick={handleLogoutClick}
                >
                  <LogOut className="size-5" />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showSearch && (
        <SearchOverlay
          searchQuery={searchQuery}
          handleSearch={handleSearch}
          handleCloseSearch={handleCloseSearch}
          searchResults={searchResults}
          handleSelectUser={handleSelectUser}
        />
      )}

      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
      />
    </header>
  );
};
export default Navbar;
