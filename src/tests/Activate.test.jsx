import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Activate from "../pages/Activate";
import { api } from "../api/client";
import { useAuth } from "../context/useAuth";

// Mock dependencies
vi.mock("../api/client");
vi.mock("../context/useAuth");
vi.mock("react-hot-toast");

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Activate Component", () => {
  const mockRefreshUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ refreshUser: mockRefreshUser, user: null });
    localStorage.clear();
  });

  it("shows loading state initially", () => {
    api.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <MemoryRouter initialEntries={["/activate?token=123"]}>
        <Routes>
          <Route path="/activate" element={<Activate />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Activating...")).toBeInTheDocument();
  });

  it("shows error state and correct links on failure", async () => {
    api.mockRejectedValue(new Error("Invalid token"));

    render(
      <MemoryRouter initialEntries={["/activate?token=invalid"]}>
        <Routes>
          <Route path="/activate" element={<Activate />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Activation failed")).toBeInTheDocument();
    });

    // Check Links
    const registerLink = screen.getByRole("link", { name: /sign up again/i });
    expect(registerLink).toHaveAttribute("href", "/register");

    const loginLink = screen.getByRole("link", { name: /back to sign in/i });
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("shows success state and auto-logs in with valid token", async () => {
    const mockLogin = vi.fn();
    useAuth.mockReturnValue({ login: mockLogin, user: null });

    api.mockResolvedValue({ token: "fake-jwt-token", user: { id: "123" } });

    render(
      <MemoryRouter initialEntries={["/activate?token=valid"]}>
        <Routes>
          <Route path="/activate" element={<Activate />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Your account is activated/i),
      ).toBeInTheDocument();
    });

    expect(mockLogin).toHaveBeenCalledWith("fake-jwt-token", { id: "123" });

    // Wait for the timeout to trigger navigation
    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      },
      { timeout: 3500 },
    );
  });
});
