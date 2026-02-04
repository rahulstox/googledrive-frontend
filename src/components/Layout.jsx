import { Link, NavLink, useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  LogOut,
  HardDrive,
  Home,
  Star,
  Trash2,
  User,
  ChevronDown,
  Settings,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import DeleteAccountModal from "./DeleteAccountModal";
import ProfileSetupModal from "./ProfileSetupModal";
import { api } from "../api/client";
import toast from "react-hot-toast";

export default function Layout() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDeleteAccount = () => {
    setIsProfileOpen(false);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAccount = async (password) => {
    setIsDeletingAccount(true);
    try {
      await api("/auth/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      toast.success("Account deleted successfully.");
      setIsDeleteModalOpen(false);
      logout();
    } catch (err) {
      toast.error(err.message || "Failed to delete account.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex bg-drive-dark text-drive-text transition-colors duration-300">
      <aside className="hidden sm:flex w-64 flex-shrink-0 flex-col bg-drive-card border-r border-drive-border transition-colors duration-300">
        <Link
          to="/"
          className="flex items-center gap-3 px-6 h-20 border-b border-drive-border/50"
        >
          <div className="p-2 rounded-xl bg-gradient-to-br from-drive-accent to-drive-accentHover shadow-lg shadow-drive-accent/20">
            <HardDrive className="w-6 h-6 text-white" aria-hidden />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-drive-text to-drive-muted">
            Krypton Drive
          </span>
        </Link>
        <nav className="flex-1 py-6 px-4 space-y-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-drive-accent text-white shadow-lg shadow-drive-accent/25"
                  : "text-drive-muted hover:bg-drive-dark hover:text-drive-text"
              }`
            }
          >
            <Home className="w-5 h-5" aria-hidden />
            Overview
          </NavLink>
          <NavLink
            to="/starred"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-drive-accent text-white shadow-lg shadow-drive-accent/25"
                  : "text-drive-muted hover:bg-drive-dark hover:text-drive-text"
              }`
            }
          >
            <Star className="w-5 h-5" aria-hidden />
            Starred
          </NavLink>
          <NavLink
            to="/trash"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-drive-accent text-white shadow-lg shadow-drive-accent/25"
                  : "text-drive-muted hover:bg-drive-dark hover:text-drive-text"
              }`
            }
          >
            <Trash2 className="w-5 h-5" aria-hidden />
            Trash
          </NavLink>
        </nav>
        <div className="p-3 border-t border-drive-border">
          <div className="px-3 py-2 rounded-lg bg-drive-dark/50 border border-drive-border">
            <p className="text-xs text-drive-muted font-medium">Storage</p>
            <p className="text-sm mt-0.5">Cloud storage</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-drive-dark/50">
        <header className="sticky top-0 z-50 flex items-center justify-between px-8 h-20 glass border-b border-drive-border/50">
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <input
                type="search"
                placeholder="Search documents, files..."
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full bg-drive-dark border-none ring-1 ring-drive-border focus:ring-2 focus:ring-drive-accent text-sm text-drive-text placeholder-drive-muted transition-all duration-200 shadow-sm"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-drive-muted group-focus-within:text-drive-accent transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-4 pl-4">
            <ThemeToggle />
            <div className="h-8 w-px bg-drive-border" />

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 pl-2 hover:bg-drive-border/10 rounded-xl p-1 transition-colors outline-none"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-drive-accent to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-drive-accent/20">
                  {user?.firstName?.[0]}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-bold text-drive-text leading-tight">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-drive-muted">Free Plan</p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-drive-muted transition-transform ${isProfileOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-drive-card rounded-2xl shadow-xl border border-drive-border py-2 z-50 animate-fade-in-up">
                  <div className="px-4 py-3 border-b border-drive-border/50">
                    <p className="text-sm font-bold text-drive-text">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-drive-muted truncate">
                      {user?.email}
                    </p>
                  </div>

                  <div className="py-2">
                    <button
                      className="w-full px-4 py-2.5 text-sm text-drive-text hover:bg-drive-dark flex items-center gap-3 transition-colors"
                      onClick={() => {
                        setIsProfileOpen(false);
                        toast("Profile settings coming soon!", { icon: "⚙️" });
                      }}
                    >
                      <User className="w-4 h-4" />
                      Profile Settings
                    </button>
                    <button
                      className="w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleDeleteAccount();
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </button>
                  </div>

                  <div className="border-t border-drive-border/50 pt-2">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="w-full px-4 py-2.5 text-sm text-drive-muted hover:text-drive-text hover:bg-drive-dark flex items-center gap-3 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 min-h-0 overflow-auto" style={{ minHeight: 0 }}>
          <Outlet context={{ searchQuery, setSearchQuery }} />
        </main>

        <DeleteAccountModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDeleteAccount}
          loading={isDeletingAccount}
          isOAuth={user?.authProvider !== "email"}
        />
        <ProfileSetupModal />
      </div>
    </div>
  );
}
