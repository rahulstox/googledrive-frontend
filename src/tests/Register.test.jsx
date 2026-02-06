import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import Register from "../pages/Register";
import { api } from "../api/client";
import toast from "react-hot-toast";

// Mock dependencies
vi.mock("../api/client", () => ({
  api: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../context/ConfigContext", () => ({
  useConfig: () => ({
    config: { allowRegistration: true },
    loading: false,
  }),
}));

// Mock Router
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe("Register Component - Password Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const fillForm = (email, password) => {
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: email },
    });
    fireEvent.change(screen.getByPlaceholderText("Password (min 8 chars)"), {
      target: { value: password },
    });
  };

  const submitForm = () => {
    // Button text is "Sign up" based on Register.jsx line 288
    const btn = screen.getByRole("button", { name: /sign up/i });
    fireEvent.click(btn);
  };

  it("should reject Weak passwords", () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>,
    );

    fillForm("test@example.com", "weak");
    submitForm();

    expect(toast.error).toHaveBeenCalledWith(
      "Password must be at least Medium strength.",
    );
    expect(api).not.toHaveBeenCalled();
  });

  it("should ACCEPT Medium strength passwords (3 criteria)", async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>,
    );

    // Meets 3 criteria: length, lowercase, number (Medium)
    fillForm("test@example.com", "mediumpass1");
    api.mockResolvedValueOnce({ message: "Success" });

    submitForm();

    await waitFor(() => {
      expect(api).toHaveBeenCalled();
    });
  });

  it("should ACCEPT Strong strength passwords (5 criteria)", async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>,
    );

    // Meets all criteria: length, upper, lower, number, special (Strong)
    fillForm("test@example.com", "StrongPass1!");
    api.mockResolvedValueOnce({ message: "Success" });

    submitForm();

    await waitFor(() => {
      expect(api).toHaveBeenCalled();
    });
  });
});
