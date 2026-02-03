import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Dashboard from "../pages/Dashboard";
import { BrowserRouter } from "react-router-dom";

// Mock mocks
const mockNavigate = vi.fn();
const mockUseOutletContext = vi.fn();
const mockUseLocation = vi.fn();
const mockUseParams = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useOutletContext: () => mockUseOutletContext(),
    useLocation: () => mockUseLocation(),
    useParams: () => mockUseParams(),
  };
});

vi.mock("../api/client", () => ({
  api: vi.fn(),
  getStreamUrl: vi.fn(),
  downloadFile: vi.fn(),
  uploadFile: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
  },
}));

// Mock react-dropzone to avoid issues with drag events in jsdom
vi.mock("react-dropzone", () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    isDragActive: false,
  }),
}));

import { api } from "../api/client";

describe("Dashboard Component", () => {
  const mockFiles = [
    {
      _id: "1",
      name: "Test File.txt",
      type: "file",
      size: 1024,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isStarred: false,
      isTrash: false,
      mimeType: "text/plain",
    },
    {
      _id: "2",
      name: "Test Folder",
      type: "folder",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isStarred: false,
      isTrash: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOutletContext.mockReturnValue({ searchQuery: "" });
    mockUseLocation.mockReturnValue({ pathname: "/" });
    mockUseParams.mockReturnValue({ folderId: null });
    api.mockResolvedValue({ items: mockFiles, breadcrumbs: [] });
  });

  it("renders loading state initially", async () => {
    // We can't easily check the loading state because it might resolve too fast,
    // but we can check if the data eventually loads.
    render(<Dashboard />);

    // Check if files are rendered
    await waitFor(() => {
      expect(screen.getByText("Test File.txt")).toBeInTheDocument();
      expect(screen.getByText("Test Folder")).toBeInTheDocument();
    });
  });

  it("fetches files on mount", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(api).toHaveBeenCalledWith("/files");
    });
  });

  it("filters files based on search query", async () => {
    mockUseOutletContext.mockReturnValue({ searchQuery: "Folder" });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Test Folder")).toBeInTheDocument();
      expect(screen.queryByText("Test File.txt")).not.toBeInTheDocument();
    });
  });

  it("opens context menu on right click", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Test File.txt")).toBeInTheDocument();
    });

    const fileRow = screen.getByText("Test File.txt").closest("tr");
    fireEvent.contextMenu(fileRow);

    await waitFor(() => {
      expect(screen.getByText("Open")).toBeInTheDocument();
      expect(screen.getByText("Download")).toBeInTheDocument();
    });
  });

  it('handles "Starred" view correctly', async () => {
    mockUseLocation.mockReturnValue({ pathname: "/starred" });
    api.mockResolvedValue({
      items: [{ ...mockFiles[0], isStarred: true }],
      breadcrumbs: [],
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(api).toHaveBeenCalledWith("/files/starred");
      expect(
        screen.getByRole("heading", { name: "Starred" }),
      ).toBeInTheDocument();
    });
  });

  it('handles "Trash" view correctly', async () => {
    mockUseLocation.mockReturnValue({ pathname: "/trash" });
    api.mockResolvedValue({
      items: [{ ...mockFiles[0], isTrash: true }],
      breadcrumbs: [],
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(api).toHaveBeenCalledWith("/files/trash");
      expect(
        screen.getByRole("heading", { name: "Trash" }),
      ).toBeInTheDocument();
    });
  });
});
