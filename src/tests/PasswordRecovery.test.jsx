import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
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

// Mock Router hooks
const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
  };
});

describe("Password Recovery Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  describe("ForgotPassword Component", () => {
    it("should validate email and submit successfully", async () => {
      api.mockResolvedValueOnce({});
      
      render(
        <BrowserRouter>
          <ForgotPassword />
        </BrowserRouter>
      );

      const emailInput = screen.getByPlaceholderText("Email");
      const submitBtn = screen.getByRole("button", { name: /send reset link/i });

      // Test invalid email
      fireEvent.change(emailInput, { target: { value: "invalid-email" } });
      fireEvent.blur(emailInput);
      expect(screen.getByText("Please enter a valid email address.")).toBeDefined();
      expect(submitBtn).toBeDisabled();

      // Test valid email
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      expect(submitBtn).not.toBeDisabled();

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(api).toHaveBeenCalledWith("/auth/forgot-password", expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com" })
        }));
        expect(toast.success).toHaveBeenCalled();
        expect(screen.getByText(/check your email/i)).toBeDefined();
      });
    });
  });

  describe("ResetPassword Component", () => {
    it("should verify token and allow password reset", async () => {
      // Setup URL params
      const token = "valid-token";
      const email = "test@example.com";
      const encodedEmail = btoa(email).replace(/\+/g, "-").replace(/\//g, "_");
      mockSearchParams.set("token", token);
      mockSearchParams.set("email", encodedEmail);

      // Mock verify token call
      api.mockResolvedValueOnce({ message: "Token is valid." });

      render(
        <BrowserRouter>
          <ResetPassword />
        </BrowserRouter>
      );

      // Should show loading initially then form
      await waitFor(() => {
        expect(screen.getByPlaceholderText("New password")).toBeDefined();
      });

      const passInput = screen.getByPlaceholderText("New password");
      const confirmInput = screen.getByPlaceholderText("Confirm password");
      const submitBtn = screen.getByRole("button", { name: /reset password/i });

      // Enter matching strong password
      const newPass = "StrongPass1!";
      fireEvent.change(passInput, { target: { value: newPass } });
      fireEvent.change(confirmInput, { target: { value: newPass } });

      // Mock reset password call
      api.mockResolvedValueOnce({});

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(api).toHaveBeenCalledWith("/auth/reset-password", expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ token, email, newPassword: newPass })
        }));
        expect(toast.success).toHaveBeenCalled();
        expect(screen.getByText(/password updated successfully/i)).toBeDefined();
      });
    });

    it("should handle invalid token", async () => {
      mockSearchParams.set("token", "invalid");
      mockSearchParams.set("email", "test");
      
      api.mockRejectedValueOnce(new Error("Invalid link"));

      render(
        <BrowserRouter>
          <ResetPassword />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Link Expired or Invalid")).toBeDefined();
      });
    });
  });
});
