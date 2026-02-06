import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import CheckEmail from "../pages/CheckEmail";
import { api } from "../api/client";
import toast from "react-hot-toast";

// Extend Vitest's expect with jest-axe
expect.extend(toHaveNoViolations);

// Mock API
vi.mock("../api/client", () => ({
  api: vi.fn(),
}));

// Mock Toast
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock ConfigContext
vi.mock("../context/ConfigContext", () => ({
  useConfig: () => ({
    config: { appName: "Krypton Drive" },
    loading: false,
  }),
}));

// Mock AuthContext
vi.mock("../context/useAuth", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
  }),
}));

// Mock Router Hooks
const mockNavigate = vi.fn();
const mockUseLocation = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockUseLocation(),
  };
});

describe("CheckEmail Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocation.mockReturnValue({ state: { email: "test@example.com" } });
  });

  it("renders correctly with email from state", () => {
    render(
      <BrowserRouter>
        <CheckEmail />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(/Please go activate your account/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/inbox/i)).toHaveClass("text-green-600");
    expect(screen.getByText(/spam folder/i)).toHaveClass("text-red-600");
    expect(screen.getByText(/Resend e-mail/i)).toBeInTheDocument();
  });

  it("should have no accessibility violations", async () => {
    const { container } = render(
      <BrowserRouter>
        <CheckEmail />
      </BrowserRouter>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("handles resend click correctly", async () => {
    api.mockResolvedValueOnce({ message: "Activation email sent." });

    render(
      <BrowserRouter>
        <CheckEmail />
      </BrowserRouter>,
    );

    const resendBtn = screen.getByText(/Resend e-mail/i);
    fireEvent.click(resendBtn);

    expect(api).toHaveBeenCalledWith(
      "/auth/resend-activation",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "test@example.com" }),
      }),
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Activation email resent!");
    });
  });

  it("shows error if email is missing", async () => {
    mockUseLocation.mockReturnValue({ state: null });

    render(
      <BrowserRouter>
        <CheckEmail />
      </BrowserRouter>,
    );

    const resendBtn = screen.getByText(/Resend e-mail/i);
    fireEvent.click(resendBtn);

    expect(api).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("Email address missing"),
    );
  });
});
