import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Disable2FAModal from "../components/Disable2FAModal";
import { api } from "../api/client";
import toast from "react-hot-toast";

// Mocks
vi.mock("../api/client", () => ({
  api: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Disable2FAModal", () => {
  const mockOnClose = vi.fn();
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <Disable2FAModal
        isOpen={false}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />,
    );
    expect(screen.queryByText("Disable 2FA")).not.toBeInTheDocument();
  });

  it("renders correctly when open", () => {
    render(
      <Disable2FAModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Disable 2FA" }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter your password"),
    ).toBeInTheDocument();
  });

  it("handles successful disable", async () => {
    api.mockResolvedValueOnce({ success: true });

    render(
      <Disable2FAModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />,
    );

    const input = screen.getByPlaceholderText("Enter your password");
    fireEvent.change(input, { target: { value: "password123" } });

    const button = screen.getByRole("button", { name: "Disable 2FA" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(api).toHaveBeenCalledWith(
        "/auth/2fa/disable",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ password: "password123" }),
        }),
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Two-Factor Authentication disabled.",
      );
      expect(mockOnComplete).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("handles disable failure", async () => {
    api.mockRejectedValueOnce(new Error("Incorrect password"));

    render(
      <Disable2FAModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />,
    );

    const input = screen.getByPlaceholderText("Enter your password");
    fireEvent.change(input, { target: { value: "wrongpassword" } });

    const button = screen.getByRole("button", { name: "Disable 2FA" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Incorrect password");
      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });
});
