import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import AdminSettings from "../pages/AdminSettings";
import { useAuth } from "../context/useAuth";
import { api } from "../api/client";

// Mocks
vi.mock("../context/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../api/client", () => ({
  api: vi.fn(),
}));

// Mock Lucide icons to avoid rendering issues
vi.mock("lucide-react", () => ({
  Users: () => <div data-testid="icon-users" />,
  HardDrive: () => <div data-testid="icon-hard-drive" />,
  FileText: () => <div data-testid="icon-file-text" />,
  Activity: () => <div data-testid="icon-activity" />,
  ShieldAlert: () => <div data-testid="icon-shield-alert" />,
  Clock: () => <div data-testid="icon-clock" />,
}));

describe("AdminSettings Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Access Denied for non-admin user", () => {
    useAuth.mockReturnValue({
      user: { role: "user", email: "user@test.com" },
    });

    render(<AdminSettings />);

    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(
      screen.getByText("You do not have permission to view this page."),
    ).toBeInTheDocument();
  });

  it("renders Dashboard with stats and logs for admin user", async () => {
    useAuth.mockReturnValue({
      user: { role: "admin", email: "admin@test.com" },
    });

    const mockStats = {
      totalUsers: 10,
      activeUsers: 8,
      totalStorageUsed: 1024 * 1024 * 500, // 500 MB
      totalFiles: 100,
    };

    const mockAuditLogs = {
      logs: [
        {
          user: "user@test.com",
          action: "Login",
          ip: "127.0.0.1",
          details: "Chrome on Windows",
          timestamp: new Date().toISOString(),
        },
      ],
    };

    api.mockImplementation((url) => {
      if (url === "/settings/admin/stats") return Promise.resolve(mockStats);
      if (url === "/settings/admin/audit")
        return Promise.resolve(mockAuditLogs);
      return Promise.reject(new Error("Unknown URL"));
    });

    render(<AdminSettings />);

    // Should show loading initially (optional check, but might be too fast)
    // await waitFor(() => expect(screen.getByText("Admin Dashboard")).toBeInTheDocument());

    await waitFor(() => {
      expect(screen.getByText("Total Users")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument(); // Total Users count
      expect(screen.getByText("500 MB")).toBeInTheDocument(); // Formatted storage
      expect(screen.getByText("Recent Activity (Logins)")).toBeInTheDocument();
      expect(screen.getByText("user@test.com")).toBeInTheDocument();
    });
  });

  it("handles API errors gracefully", async () => {
    useAuth.mockReturnValue({
      user: { role: "admin", email: "admin@test.com" },
    });

    api.mockRejectedValue(new Error("API Error"));

    render(<AdminSettings />);

    await waitFor(() => {
      // It should still render the dashboard shell, but maybe empty stats/logs
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    });
    // Stats will be 0/undefined, so there should be multiple "0"s (Total Users, Total Files)
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThanOrEqual(2);
  });
});
