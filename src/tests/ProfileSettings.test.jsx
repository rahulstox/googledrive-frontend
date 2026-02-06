import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProfileSettings from "../pages/ProfileSettings";
import { useAuth } from "../context/useAuth";
import { api } from "../api/client";

// Mock dependencies
vi.mock("../context/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../api/client", () => ({
  api: vi.fn(),
}));

// Mock lucide-react icons to avoid rendering issues
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Shield: () => <div data-testid="icon-shield" />,
    History: () => <div data-testid="icon-history" />,
    Smartphone: () => <div data-testid="icon-smartphone" />,
    Monitor: () => <div data-testid="icon-monitor" />,
    Laptop: () => <div data-testid="icon-laptop" />,
  };
});

describe("ProfileSettings Component", () => {
  const mockUser = {
    _id: "user123",
    username: "testuser",
    email: "test@example.com",
    twoFactorEnabled: false,
  };

  const mockHistory = [
    {
      device:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      ip: "10.0.0.1",
      timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    },
    {
      device:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ip: "192.168.1.1",
      timestamp: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: mockUser,
      refreshUser: vi.fn(),
      logout: vi.fn(),
    });
    // Default api mock
    api.mockResolvedValue({});
  });

  it("should render Login History in Security tab", async () => {
    api.mockImplementation((url) => {
      if (url === "/auth/history") {
        return Promise.resolve({ history: mockHistory });
      }
      return Promise.resolve({});
    });

    render(<ProfileSettings />);

    // Switch to Security tab
    const securityTab = screen.getByText("Security");
    fireEvent.click(securityTab);

    // Check if Login History header is present
    await waitFor(() => {
      expect(screen.getByText("Login History")).toBeInTheDocument();
    });

    // Check for "Latest" badge on first item
    expect(screen.getByText("Latest")).toBeInTheDocument();

    // Check for device names
    expect(screen.getByText(/Chrome on Windows/)).toBeInTheDocument();
    expect(screen.getByText(/Safari on iOS/)).toBeInTheDocument();

    // Check for IP
    expect(screen.getByText("192.168.1.1")).toBeInTheDocument();

    // Check for relative time (approximate check since time moves)
    expect(screen.getByText("Just now")).toBeInTheDocument();
  });
});
