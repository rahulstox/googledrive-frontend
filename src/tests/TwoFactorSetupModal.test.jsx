import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import TwoFactorSetupModal from "../components/TwoFactorSetupModal";
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

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe("TwoFactorSetupModal", () => {
  const mockOnClose = vi.fn();
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <TwoFactorSetupModal
        isOpen={false}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />,
    );
    expect(screen.queryByText("Enable 2FA")).not.toBeInTheDocument();
  });

  it("renders and fetches secret when open", async () => {
    api.mockResolvedValueOnce({
      secret: "MOCKSECRET",
      qrCode: "data:image/png;base64,mock",
    });

    render(
      <TwoFactorSetupModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />,
    );

    expect(screen.getByText("Enable 2FA")).toBeInTheDocument();

    await waitFor(() => {
      expect(api).toHaveBeenCalledWith("/auth/2fa/generate", {
        method: "POST",
      });
    });

    expect(screen.getByAltText("2FA QR Code")).toBeInTheDocument();
    expect(screen.getByText("MOCKSECRET")).toBeInTheDocument();
  });

  it("verifies token successfully", async () => {
    api.mockResolvedValueOnce({
      secret: "MOCKSECRET",
      qrCode: "data:image/png;base64,mock",
    });

    // Mock verify call success
    api.mockResolvedValueOnce({ success: true });

    render(
      <TwoFactorSetupModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />,
    );

    // Wait for secret to load
    await waitFor(() =>
      expect(screen.getByText("MOCKSECRET")).toBeInTheDocument(),
    );

    const input = screen.getByPlaceholderText("000000");
    fireEvent.change(input, { target: { value: "123456" } });

    const button = screen.getByText("Verify & Enable");
    fireEvent.click(button);

    await waitFor(() => {
      expect(api).toHaveBeenCalledWith(
        "/auth/2fa/verify",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ token: "123456" }),
        }),
      );
      expect(toast.success).toHaveBeenCalled();
      expect(mockOnComplete).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("handles verification failure", async () => {
    api.mockResolvedValueOnce({
      secret: "MOCKSECRET",
      qrCode: "data:image/png;base64,mock",
    });

    // Mock verify call failure
    api.mockRejectedValueOnce(new Error("Invalid token"));

    render(
      <TwoFactorSetupModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("MOCKSECRET")).toBeInTheDocument(),
    );

    const input = screen.getByPlaceholderText("000000");
    fireEvent.change(input, { target: { value: "000000" } });

    const button = screen.getByText("Verify & Enable");
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });
});
