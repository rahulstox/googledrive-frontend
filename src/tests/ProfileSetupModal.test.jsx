import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import ProfileSetupModal from "../components/ProfileSetupModal";
import { useAuth } from "../context/useAuth";
import { api } from "../api/client";
import toast from "react-hot-toast";

// Mocks
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../api/client", () => ({
  api: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../context/useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("ProfileSetupModal", () => {
  const mockRefreshUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render if user has username", () => {
    useAuth.mockReturnValue({
      user: {
        _id: "1",
        email: "test@example.com",
        username: "testuser",
      },
      refreshUser: mockRefreshUser,
    });
    render(<ProfileSetupModal />);
    expect(screen.queryByText("Complete your profile")).not.toBeInTheDocument();
  });

  it("renders if user has no username", () => {
    useAuth.mockReturnValue({
      user: { _id: "1", email: "test@example.com" }, // No username
      refreshUser: mockRefreshUser,
    });
    render(<ProfileSetupModal />);
    expect(screen.getByText("Complete your profile")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByText("Skip")).toBeInTheDocument();
  });

  it("validates invalid username format", async () => {
    useAuth.mockReturnValue({
      user: { _id: "1", email: "test@example.com" },
      refreshUser: mockRefreshUser,
    });
    render(<ProfileSetupModal />);

    const input = screen.getByLabelText("Username");
    fireEvent.change(input, { target: { value: "ab" } }); // Too short

    // Wait for debounce
    await waitFor(() => {
      expect(
        screen.getByText(/Username must be 3-20 characters/),
      ).toBeInTheDocument();
    });
  });

  it("checks availability and handles taken username", async () => {
    useAuth.mockReturnValue({
      user: { _id: "1", email: "test@example.com" },
      refreshUser: mockRefreshUser,
    });
    api.mockResolvedValueOnce({ exists: true }); // Mock taken

    render(<ProfileSetupModal />);

    const input = screen.getByLabelText("Username");
    fireEvent.change(input, { target: { value: "takenuser" } });

    await waitFor(() => {
      expect(api).toHaveBeenCalledWith(
        expect.stringContaining("/auth/check-username?u=takenuser"),
      );
      expect(
        screen.getByText("This username is already taken"),
      ).toBeInTheDocument();
    });
  });

  it("submits valid username", async () => {
    useAuth.mockReturnValue({
      user: { _id: "1", email: "test@example.com" },
      refreshUser: mockRefreshUser,
    });
    api.mockImplementation((url) => {
      if (url.includes("check-username"))
        return Promise.resolve({ exists: false });
      if (url === "/auth/me") return Promise.resolve({});
      return Promise.reject(new Error("Unknown URL"));
    });

    render(<ProfileSetupModal />);

    const input = screen.getByLabelText("Username");
    fireEvent.change(input, { target: { value: "newuser" } });

    // Wait for availability check to pass
    await waitFor(() => {
      expect(
        screen.queryByText("This username is already taken"),
      ).not.toBeInTheDocument();
    });

    // Check if button is enabled
    const button = screen.getByRole("button", { name: "Save & Continue" });
    await waitFor(() => expect(button).not.toBeDisabled());

    fireEvent.click(button);

    await waitFor(() => {
      expect(api).toHaveBeenCalledWith(
        "/auth/me",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            username: "newuser",
          }),
        }),
      );
      expect(mockRefreshUser).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Welcome back, newuser!");
    });
  });

  it("skips setup and assigns random username", async () => {
    useAuth.mockReturnValue({
      user: { _id: "1", email: "test@example.com" },
      refreshUser: mockRefreshUser,
    });
    api.mockImplementation((url) => {
      if (url === "/auth/me") return Promise.resolve({});
      return Promise.reject(new Error("Unknown URL"));
    });

    render(<ProfileSetupModal />);

    const skipButton = screen.getByText("Skip");
    fireEvent.click(skipButton);

    await waitFor(() => {
      expect(api).toHaveBeenCalledWith(
        "/auth/me",
        expect.objectContaining({
          method: "PUT",
          body: expect.stringMatching(/{"username":"user_[0-9a-f]{8}"}/),
        }),
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Setup skipped—you can update profile later.",
      );
      expect(
        screen.queryByText("Complete your profile"),
      ).not.toBeInTheDocument();
    });
  });
});
