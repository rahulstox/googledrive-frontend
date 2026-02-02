import { Link, NavLink } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { LogOut, HardDrive, Home } from "lucide-react";

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "#0a0a0c", minHeight: "100vh" }}
    >
      <aside className="hidden sm:flex w-56 lg:w-64 flex-shrink-0 flex-col border-r border-drive-border bg-drive-card/50">
        <Link
          to="/"
          className="flex items-center gap-2 px-4 h-14 border-b border-drive-border text-white font-semibold hover:bg-drive-border/50 transition-colors"
        >
          <span className="p-1.5 rounded-lg bg-drive-accent/20">
            <HardDrive className="w-5 h-5 text-drive-accent" aria-hidden />
          </span>
          <span>Drive</span>
        </Link>
        <nav className="flex-1 py-3 px-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-drive-accent/20 text-drive-accent"
                  : "text-drive-muted hover:bg-drive-border/50 hover:text-white"
              }`
            }
          >
            <Home className="w-5 h-5 flex-shrink-0" aria-hidden />
            My Drive
          </NavLink>
        </nav>
        <div className="p-3 border-t border-drive-border">
          <div className="px-3 py-2 rounded-lg bg-drive-dark/80 border border-drive-border">
            <p className="text-xs text-drive-muted font-medium">Storage</p>
            <p className="text-sm text-white mt-0.5">Cloud storage</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-50 flex items-center gap-4 px-4 sm:px-6 h-14 border-b border-drive-border glass">
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <input
                type="search"
                placeholder="Search in Drive"
                aria-label="Search in Drive"
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-drive-dark border border-drive-border text-white placeholder-drive-muted text-sm focus:outline-none focus:ring-2 focus:ring-drive-accent focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-drive-muted"
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-drive-muted hidden md:inline truncate max-w-[140px]">
              {user?.firstName} {user?.lastName}
            </span>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-drive-muted hover:bg-drive-border hover:text-white transition-colors duration-200"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" aria-hidden />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </header>
        <main className="flex-1 min-h-0 overflow-auto" style={{ minHeight: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
