import { useState, useEffect, useCallback, useMemo } from "react";
import {
  useParams,
  useNavigate,
  useOutletContext,
  useLocation,
} from "react-router-dom";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import {
  FolderPlus,
  Folder,
  File as FileIcon,
  Download,
  Trash2,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  ExternalLink,
  Star,
  MoreVertical,
  RotateCcw,
  Edit2,
  FolderOpen,
  X,
  UserPlus,
  FolderInput,
  Link as LinkIcon,
  Settings,
} from "lucide-react";
import { api, getStreamUrl, downloadFile, uploadFile } from "../api/client";
import ContextMenu from "../components/ContextMenu";
import FilePreviewModal from "../components/FilePreviewModal";
import CreateFolderModal from "../components/CreateFolderModal";
import SettingsModal from "../components/SettingsModal";
import UploadProgress from "../components/UploadProgress";
import SelectionToolbar from "../components/SelectionToolbar";
import FileThumbnail from "../components/FileThumbnail";
import ConfirmationModal from "../components/ConfirmationModal";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSize(bytes) {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function Dashboard() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { searchQuery } = useOutletContext();

  const [items, setItems] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [lastSelectedId, setLastSelectedId] = useState(null);

  const [previewFile, setPreviewFile] = useState(null);

  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [createFolderName, setCreateFolderName] = useState("");

  const [uploadQueue, setUploadQueue] = useState([]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [contextMenu, setContextMenu] = useState(null);

  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    item: null,
    count: 0,
    isPermanent: false,
  });

  const isStarredView = location.pathname === "/starred";
  const isTrashView = location.pathname === "/trash";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint;
      if (searchQuery && searchQuery.trim()) {
        endpoint = `/files/search?q=${encodeURIComponent(searchQuery)}`;
      } else if (isStarredView) endpoint = "/files/starred";
      else if (isTrashView) endpoint = "/files/trash";
      else endpoint = folderId ? `/files/folder/${folderId}` : "/files";

      const res = await api(endpoint);
      setItems(res.items || []);
      // Only set breadcrumbs if we are in normal folder view
      if (!isStarredView && !isTrashView && !searchQuery) {
        setBreadcrumbs(res.breadcrumbs || []);
      } else {
        setBreadcrumbs([]);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [folderId, isStarredView, isTrashView, searchQuery]);

  useEffect(() => {
    loadData();
    // Close context menu on route change
    setContextMenu(null);
  }, [loadData]);

  // Stats Calculation (Only relevant for normal view, but harmless to keep)
  const stats = useMemo(() => {
    const s = {
      images: { count: 0, size: 0 },
      videos: { count: 0, size: 0 },
      docs: { count: 0, size: 0 },
    };
    const totalSize = items.reduce((acc, item) => acc + (item.size || 0), 0);

    items.forEach((item) => {
      if (item.type === "folder") return;
      const type = item.mimeType || "";
      if (type.startsWith("image/")) {
        s.images.count++;
        s.images.size += item.size || 0;
      } else if (type.startsWith("video/")) {
        s.videos.count++;
        s.videos.size += item.size || 0;
      } else if (
        type.includes("pdf") ||
        type.includes("document") ||
        type.includes("word") ||
        type.includes("text")
      ) {
        s.docs.count++;
        s.docs.size += item.size || 0;
      }
    });
    return { ...s, totalSize: totalSize || 1 };
  }, [items]);

  // Filter and Sort
  const processedItems = useMemo(() => {
    let res = [...items];

    // 1. Search Filter - Handled by Backend now
    // if (searchQuery) {
    //   const lower = searchQuery.toLowerCase();
    //   res = res.filter((item) => item.name.toLowerCase().includes(lower));
    // }

    // 2. Category Filter
    if (activeFilter) {
      res = res.filter((item) => {
        if (item.type === "folder") return false;
        const type = item.mimeType || "";
        if (activeFilter === "image") return type.startsWith("image/");
        if (activeFilter === "video") return type.startsWith("video/");
        if (activeFilter === "document") {
          return (
            type.includes("pdf") ||
            type.includes("document") ||
            type.includes("word") ||
            type.includes("text")
          );
        }
        return true;
      });
    }

    // 3. Sorting
    res.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "size") cmp = (a.size || 0) - (b.size || 0);
      else if (sortBy === "type") {
        if (a.type === "folder" && b.type !== "folder") return -1;
        if (a.type !== "folder" && b.type === "folder") return 1;
        cmp = (a.mimeType || "").localeCompare(b.mimeType || "");
      } else {
        // Date sort depends on view
        const dateA = isTrashView
          ? new Date(a.trashedAt)
          : new Date(a.createdAt);
        const dateB = isTrashView
          ? new Date(b.trashedAt)
          : new Date(b.createdAt);
        cmp = dateA - dateB;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return res;
  }, [items, searchQuery, sortBy, sortOrder, isTrashView, activeFilter]);

  // Dropzone
  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (isTrashView || isStarredView) {
        toast.error("Cannot upload here");
        return;
      }

      const newUploads = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        status: "uploading",
        progress: 0,
        file,
      }));

      setUploadQueue((prev) => [...prev, ...newUploads]);

      // Process uploads in parallel
      await Promise.all(
        newUploads.map(async (uploadItem) => {
          try {
            const formData = new FormData();
            if (folderId) formData.append("parentId", folderId);
            formData.append("file", uploadItem.file);

            // Support folder structure upload
            const relativePath =
              uploadItem.file.webkitRelativePath || uploadItem.file.path;
            if (relativePath) {
              formData.append("relativePath", relativePath);
            }

            await uploadFile("/files/upload", formData, (progress) => {
              setUploadQueue((prev) =>
                prev.map((item) =>
                  item.id === uploadItem.id ? { ...item, progress } : item,
                ),
              );
            });

            setUploadQueue((prev) =>
              prev.map((item) =>
                item.id === uploadItem.id
                  ? { ...item, status: "completed", progress: 100 }
                  : item,
              ),
            );
          } catch (err) {
            setUploadQueue((prev) =>
              prev.map((item) =>
                item.id === uploadItem.id ? { ...item, status: "error" } : item,
              ),
            );
            toast.error(`Failed to upload ${uploadItem.name}: ${err.message}`);
          }
        }),
      );
      loadData();
    },
    [folderId, loadData, isTrashView, isStarredView],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    disabled: isTrashView || isStarredView,
  });

  // Actions
  const handleCreateFolder = () => {
    setCreateFolderName("");
    setIsCreateFolderModalOpen(true);
  };

  const submitCreateFolder = async (e) => {
    e.preventDefault();
    if (!createFolderName || createFolderName.trim() === "") {
      toast.error("Folder name cannot be empty");
      return;
    }
    // Check for duplicates
    if (
      items.some(
        (i) =>
          i.name.toLowerCase() === createFolderName.toLowerCase() &&
          i.type === "folder",
      )
    ) {
      toast.error("A folder with this name already exists");
      return;
    }

    try {
      await api("/files/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createFolderName, parentId: folderId }),
      });
      toast.success("Folder created");
      setIsCreateFolderModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to create folder");
    }
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    if (!selectedIds.has(item._id)) {
      setSelectedIds(new Set([item._id]));
      setLastSelectedId(item._id);
    }
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const handleRenameSubmit = async (item) => {
    if (!renameValue || renameValue.trim() === "") {
      toast.error("Name cannot be empty");
      return;
    }
    if (renameValue === item.name) {
      setRenamingId(null);
      return;
    }
    // Check for duplicates
    if (
      items.some(
        (i) =>
          i.name.toLowerCase() === renameValue.toLowerCase() &&
          i._id !== item._id,
      )
    ) {
      toast.error("A file with this name already exists");
      return;
    }

    try {
      await api(`/files/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue }),
      });
      toast.success("Renamed");
      loadData();
    } catch (err) {
      toast.error(err.message || "Rename failed");
    } finally {
      setRenamingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    const { item, type } = deleteConfirmation;
    try {
      if (type === "empty_trash") {
        const res = await api("/files/trash/empty", {
          method: "DELETE",
        });
        toast.success(res.message || "Trash emptied");
      } else if (item) {
        // Single delete
        await api(`/files/${item._id}`, { method: "DELETE" });
        toast.success("Deleted forever");
      } else {
        // Bulk delete
        await api("/files/trash/bulk-permanent", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: Array.from(selectedIds) }),
        });
        toast.success("Deleted forever");
        setSelectedIds(new Set());
      }
      loadData();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleteConfirmation({
        isOpen: false,
        item: null,
        count: 0,
        isPermanent: false,
        type: null,
      });
    }
  };

  const handleAction = async (action, item) => {
    setContextMenu(null);
    try {
      if (action === "open") {
        if (item.type === "folder") navigate(`/folder/${item._id}`);
        else window.open(getStreamUrl(item._id), "_blank");
      } else if (action === "download") {
        try {
          // Use the dedicated download endpoint to get a direct S3 link
          // This offloads bandwidth from our server
          const { url } = await api(`/files/download/${item._id}`);
          downloadFile(url, item.name);
        } catch (err) {
          console.error(
            "Failed to get download link, falling back to stream",
            err,
          );
          downloadFile(getStreamUrl(item._id), item.name);
        }
      } else if (action === "star") {
        await api(`/files/${item._id}/star`, { method: "PATCH" });
        toast.success(
          item.isStarred ? "Removed from Starred" : "Added to Starred",
        );
        loadData();
      } else if (action === "trash") {
        await api(`/files/${item._id}/trash`, { method: "PATCH" });
        toast.success("Moved to Trash");
        loadData();
      } else if (action === "restore") {
        await api(`/files/${item._id}/trash`, { method: "PATCH" });
        toast.success("Restored");
        loadData();
      } else if (action === "delete") {
        setDeleteConfirmation({
          isOpen: true,
          item: item,
          count: 1,
          isPermanent: true,
        });
      } else if (action === "rename") {
        setRenamingId(item._id);
        setRenameValue(item.name);
      } else if (action === "move") {
        toast("Move to folder feature coming soon!", { icon: "🚧" });
      }
    } catch (err) {
      toast.error(err.message || "Action failed");
    }
  };

  const handleFileClick = (e, item) => {
    if (contextMenu) {
      setContextMenu(null);
      // Don't return here, we might want to select the item that was under the menu?
      // Actually if menu was open, clicking elsewhere usually closes it.
      // If clicking an item, we probably want to select it.
    }

    const id = item._id;
    let newSelected = new Set(selectedIds);

    if (e.ctrlKey || e.metaKey) {
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
        setLastSelectedId(id);
      }
    } else if (e.shiftKey && lastSelectedId) {
      const currentIndex = processedItems.findIndex((i) => i._id === id);
      const lastIndex = processedItems.findIndex(
        (i) => i._id === lastSelectedId,
      );

      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);

        // Reset selection to just this range (Google Drive behavior)
        newSelected = new Set();
        for (let i = start; i <= end; i++) {
          newSelected.add(processedItems[i]._id);
        }
      }
    } else {
      // If clicking an item that is already selected, and no modifiers,
      // we usually don't deselect others immediately on mousedown, but on mouseup.
      // But for simplicity, let's just select this one.
      // Exception: Right click usually selects if not selected.
      newSelected = new Set([id]);
      setLastSelectedId(id);
    }

    setSelectedIds(newSelected);
  };

  const handleFileDoubleClick = (item) => {
    if (isTrashView) return;
    if (item.type === "folder") {
      navigate(`/folder/${item._id}`);
    } else {
      setPreviewFile(item);
    }
  };

  // Clear selection when clicking background
  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      setSelectedIds(new Set());
      setContextMenu(null);
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleBulkAction = async (action) => {
    try {
      if (action === "download") {
        const files = items.filter(
          (i) => selectedIds.has(i._id) && i.type === "file",
        );
        // Sequential download to avoid browser popup blocking
        for (const file of files) {
          try {
            const { url } = await api(`/files/download/${file._id}`);
            downloadFile(url, file.name);
          } catch (err) {
            console.error(
              "Failed to get download link, falling back to stream",
              err,
            );
            downloadFile(getStreamUrl(file._id), file.name);
          }
          // Small delay to help browser handle multiple downloads
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        setSelectedIds(new Set());
      } else if (action === "delete") {
        setDeleteConfirmation({
          isOpen: true,
          item: null,
          count: selectedIds.size,
          isPermanent: true,
        });
      } else if (action === "trash") {
        await api("/files/bulk-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: Array.from(selectedIds) }),
        });
        toast.success("Moved to Trash");
        setSelectedIds(new Set());
        loadData();
      } else if (action === "restore") {
        await api("/files/trash/bulk-restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: Array.from(selectedIds) }),
        });
        toast.success("Restored");
        setSelectedIds(new Set());
        loadData();
      } else if (action === "star") {
        const res = await api("/files/bulk-star", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: Array.from(selectedIds) }),
        });
        toast.success(res.message);
        loadData();
      }
    } catch (err) {
      toast.error("Bulk action failed: " + err.message);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      if (e.key === "Delete") {
        if (selectedIds.size > 0) {
          handleBulkAction(isTrashView ? "delete" : "trash");
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        setSelectedIds(new Set(processedItems.map((i) => i._id)));
      } else if (e.key === "Escape") {
        setSelectedIds(new Set());
        setContextMenu(null);
        setRenamingId(null);
      } else if (e.key === "F2") {
        if (selectedIds.size === 1) {
          const id = Array.from(selectedIds)[0];
          const item = items.find((i) => i._id === id);
          if (item) {
            e.preventDefault();
            setRenamingId(id);
            setRenameValue(item.name);
          }
        }
      } else if (e.key === "Enter") {
        if (selectedIds.size === 1) {
          const id = Array.from(selectedIds)[0];
          const item = items.find((i) => i._id === id);
          if (item) handleFileDoubleClick(item);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, processedItems, isTrashView, items]);

  // Drag Selection State
  const [isDragging, setIsDragging] = useState(false);
  const [selectionBox, setSelectionBox] = useState(null);
  const [dragStart, setDragStart] = useState(null);

  const handleMouseDown = (e) => {
    // Ignore if clicking on interactive elements or right click
    if (
      e.target.closest("button") ||
      e.target.closest("input") ||
      e.target.closest("a") ||
      e.button !== 0
    ) {
      return;
    }

    // If clicking a file row (but not checkbox), we might be starting a drag-and-drop of the file, not selection box
    // But for now, let's assume we want selection box if clicking on empty space OR if we implement file D&D later.
    // The user wants "Click + hold + drag to draw a selection rectangle".
    // Usually this starts on empty space. If it starts on a file, it's file-drag.
    // Let's verify if we clicked a file row.
    if (e.target.closest("tr")) {
      // If clicking a file, standard click handler handles selection.
      // We only start selection box if we are NOT on a file, OR if we handle file D&D separately.
      // For now, let's enable box selection only when clicking background/empty areas of the table.
      // However, Google Drive allows starting selection box slightly outside text.
      // Let's restrict to background for safety.
      return;
    }

    setIsDragging(true);
    // Get coordinates relative to the scrollable container or viewport
    // We'll use clientX/Y and fixed positioning for the box
    setDragStart({ x: e.clientX, y: e.clientY });
    setSelectionBox({ x: e.clientX, y: e.clientY, width: 0, height: 0 });

    // Clear selection if not holding Ctrl/Shift (standard behavior)
    if (!e.ctrlKey && !e.shiftKey) {
      setSelectedIds(new Set());
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !dragStart) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const width = Math.abs(currentX - dragStart.x);
    const height = Math.abs(currentY - dragStart.y);
    const x = Math.min(currentX, dragStart.x);
    const y = Math.min(currentY, dragStart.y);

    setSelectionBox({ x, y, width, height });

    // Selection Logic (Throttle this if performance is bad)
    // We need to check intersection with all rows.
    // This is the heavy part. For 1000 items, we might need optimization.
    // For now, let's try direct DOM check.
    const rows = document.querySelectorAll("tr[data-id]");
    const newSelected = new Set(e.ctrlKey ? selectedIds : []);

    rows.forEach((row) => {
      const rect = row.getBoundingClientRect();
      // Check intersection
      if (
        x < rect.right &&
        x + width > rect.left &&
        y < rect.bottom &&
        y + height > rect.top
      ) {
        newSelected.add(row.getAttribute("data-id"));
      }
    });
    setSelectedIds(newSelected);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setSelectionBox(null);
    setDragStart(null);
  };

  const getPageTitle = () => {
    if (searchQuery) return `Search results for "${searchQuery}"`;
    if (isStarredView) return "Starred";
    if (isTrashView) return "Trash";
    if (folderId) {
      if (breadcrumbs.length > 0) {
        return breadcrumbs[breadcrumbs.length - 1].name;
      }
      return "Folder";
    }
    return "My Drive";
  };

  return (
    <div
      {...getRootProps()}
      className="h-full flex flex-col bg-drive-dark/50 overflow-hidden relative select-none"
      onContextMenu={(e) => {
        // Prevent default context menu on empty space if we want, or just let it be
      }}
      onClick={handleBackgroundClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <input {...getInputProps()} />

      {/* Header & Breadcrumbs & Toolbar - Sticky/Fixed Top */}
      <div className="flex-none px-6 sm:px-8 pt-6 sm:pt-8 pb-4 z-20 bg-drive-dark/50 backdrop-blur-md sticky top-0">
        {selectedIds.size > 0 ? (
          <SelectionToolbar
            selectedCount={selectedIds.size}
            onClearSelection={() => setSelectedIds(new Set())}
            onBulkAction={handleBulkAction}
            isTrashView={isTrashView}
          />
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-drive-muted overflow-x-auto">
              {!isStarredView && !isTrashView && (
                <>
                  <button
                    onClick={() => navigate("/")}
                    className="hover:text-drive-accent transition-colors whitespace-nowrap"
                  >
                    Drive
                  </button>
                  {breadcrumbs.map((crumb) => (
                    <div
                      key={crumb._id}
                      className="flex items-center gap-2 whitespace-nowrap"
                    >
                      <ChevronRight className="w-4 h-4" />
                      <button
                        onClick={() =>
                          navigate(
                            crumb._id === "root" ? "/" : `/folder/${crumb._id}`,
                          )
                        }
                        className="hover:text-drive-accent transition-colors"
                      >
                        {crumb.name}
                      </button>
                    </div>
                  ))}
                </>
              )}
              {(isStarredView || isTrashView) && (
                <div className="flex items-center gap-4">
                  <span className="font-bold text-xl text-drive-text">
                    {getPageTitle()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isTrashView && (
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 rounded-xl bg-white dark:bg-drive-card border border-drive-border text-drive-muted hover:text-drive-text hover:bg-drive-dark transition-all shadow-sm"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center bg-white dark:bg-drive-card rounded-xl border border-drive-border p-1 mr-2">
                <button
                  onClick={() => toggleSort("date")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${sortBy === "date" ? "bg-drive-accent text-white" : "text-drive-muted hover:bg-drive-dark"}`}
                >
                  Date
                </button>
                <button
                  onClick={() => toggleSort("name")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${sortBy === "name" ? "bg-drive-accent text-white" : "text-drive-muted hover:bg-drive-dark"}`}
                >
                  Name
                </button>
                <button
                  onClick={() => toggleSort("size")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${sortBy === "size" ? "bg-drive-accent text-white" : "text-drive-muted hover:bg-drive-dark"}`}
                >
                  Size
                </button>
              </div>

              {!isTrashView && !isStarredView && (
                <>
                  <button
                    onClick={handleCreateFolder}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-drive-card border border-drive-border text-drive-text hover:bg-drive-dark transition-all shadow-sm"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">New Folder</span>
                  </button>
                  <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-drive-accent text-white hover:bg-drive-accentHover transition-all shadow-lg shadow-drive-accent/25 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span className="hidden sm:inline">Upload</span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        if (files.length) onDrop(files);
                      }}
                    />
                  </label>
                </>
              )}
              {isTrashView && (
                <button
                  onClick={() => {
                    setDeleteConfirmation({
                      isOpen: true,
                      item: null,
                      count: 0,
                      isPermanent: true,
                      type: "empty_trash",
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/25"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Empty Trash</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick Access Cards - Inside the fixed header area */}
        {!isStarredView && !isTrashView && !folderId && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div
              onClick={() =>
                setActiveFilter(activeFilter === "image" ? null : "image")
              }
              className={`bg-white dark:bg-drive-card p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${
                activeFilter === "image"
                  ? "border-purple-500 ring-2 ring-purple-500/20"
                  : "border-drive-border"
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-drive-text">Image Files</h3>
                  <p className="text-xs text-drive-muted">
                    {stats.images.count} items
                  </p>
                </div>
              </div>
              <div className="w-full bg-gray-100 dark:bg-drive-border h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-purple-500 h-full rounded-full"
                  style={{
                    width: `${(stats.images.size / stats.totalSize) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-drive-muted">
                {formatSize(stats.images.size)} used
              </p>
            </div>

            <div
              onClick={() =>
                setActiveFilter(activeFilter === "video" ? null : "video")
              }
              className={`bg-white dark:bg-drive-card p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${
                activeFilter === "video"
                  ? "border-pink-500 ring-2 ring-pink-500/20"
                  : "border-drive-border"
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-2xl">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-drive-text">Video Files</h3>
                  <p className="text-xs text-drive-muted">
                    {stats.videos.count} items
                  </p>
                </div>
              </div>
              <div className="w-full bg-gray-100 dark:bg-drive-border h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-pink-500 h-full rounded-full"
                  style={{
                    width: `${(stats.videos.size / stats.totalSize) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-drive-muted">
                {formatSize(stats.videos.size)} used
              </p>
            </div>

            <div
              onClick={() =>
                setActiveFilter(activeFilter === "document" ? null : "document")
              }
              className={`bg-white dark:bg-drive-card p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${
                activeFilter === "document"
                  ? "border-blue-500 ring-2 ring-blue-500/20"
                  : "border-drive-border"
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-drive-text">Document Files</h3>
                  <p className="text-xs text-drive-muted">
                    {stats.docs.count} items
                  </p>
                </div>
              </div>
              <div className="w-full bg-gray-100 dark:bg-drive-border h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{
                    width: `${(stats.docs.size / stats.totalSize) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-drive-muted">
                {formatSize(stats.docs.size)} used
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable File List */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-6">
        <div className="bg-white dark:bg-drive-card rounded-3xl border border-drive-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-drive-border flex items-center justify-between">
            <h2 className="text-lg font-bold text-drive-text">
              {getPageTitle()}
            </h2>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full">
              <thead className="bg-drive-dark/50 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="w-10 px-6 py-4">
                    <input
                      type="checkbox"
                      checked={
                        processedItems.length > 0 &&
                        selectedIds.size === processedItems.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(
                            new Set(processedItems.map((i) => i._id)),
                          );
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                      className="rounded border-drive-border text-drive-accent focus:ring-drive-accent w-4 h-4"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-drive-muted uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-drive-muted uppercase tracking-wider hidden sm:table-cell">
                    Date Uploaded
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-drive-muted uppercase tracking-wider hidden md:table-cell">
                    Last Update
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-drive-muted uppercase tracking-wider hidden sm:table-cell">
                    Size
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-drive-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-drive-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr
                      key={i}
                      className="animate-pulse border-b border-drive-border"
                    >
                      <td className="px-6 py-4">
                        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  ))
                ) : processedItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-drive-muted"
                    >
                      <div className="flex flex-col items-center justify-center opacity-50">
                        <FolderOpen className="w-16 h-16 mb-4 text-drive-muted" />
                        <p className="text-lg">
                          {isTrashView
                            ? "Trash is empty"
                            : isStarredView
                              ? "No starred files"
                              : activeFilter
                                ? `No ${activeFilter} files found`
                                : "No files found"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  processedItems.map((item) => (
                    <tr
                      key={item._id}
                      data-id={item._id}
                      onClick={(e) => handleFileClick(e, item)}
                      onDoubleClick={() => handleFileDoubleClick(item)}
                      onContextMenu={(e) => handleContextMenu(e, item)}
                      className={`transition-colors cursor-pointer group border-b border-drive-border last:border-0 ${
                        selectedIds.has(item._id)
                          ? "bg-blue-100/50 dark:bg-blue-900/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/40"
                          : item.isTrash
                            ? "opacity-60 grayscale hover:grayscale-0"
                            : "hover:bg-drive-dark/30"
                      }`}
                    >
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item._id)}
                          onChange={(e) => {
                            handleFileClick({ ctrlKey: true }, item);
                          }}
                          className="rounded border-drive-border text-drive-accent focus:ring-drive-accent w-4 h-4"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <FileThumbnail
                            item={item}
                            isTrashView={isTrashView}
                            onPreview={setPreviewFile}
                          />
                          {renamingId === item._id ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleRenameSubmit(item);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 min-w-0"
                            >
                              <input
                                autoFocus
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={() => handleRenameSubmit(item)}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") setRenamingId(null);
                                }}
                                className="w-full bg-white dark:bg-drive-dark border border-drive-accent rounded px-2 py-1 text-drive-text text-sm focus:outline-none focus:ring-2 focus:ring-drive-accent"
                              />
                            </form>
                          ) : (
                            <span className="font-medium text-drive-text truncate max-w-[150px] sm:max-w-xs">
                              {item.name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-drive-muted hidden sm:table-cell">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-drive-muted hidden md:table-cell">
                        {formatDate(item.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-drive-muted hidden sm:table-cell">
                        {item.type === "folder" ? "—" : formatSize(item.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!item.isTrash && (
                            <>
                              {item.type !== "folder" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAction("download", item);
                                  }}
                                  className="p-2 rounded-full hover:bg-drive-border text-drive-muted hover:text-drive-text transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction("star", item);
                                }}
                                className="p-2 rounded-full hover:bg-drive-border text-drive-muted hover:text-drive-text transition-colors"
                                title={
                                  item.isStarred
                                    ? "Remove from Starred"
                                    : "Add to Starred"
                                }
                              >
                                <Star
                                  className={`w-4 h-4 ${item.isStarred ? "text-yellow-400 fill-current" : ""}`}
                                />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction("rename", item);
                                }}
                                className="p-2 rounded-full hover:bg-drive-border text-drive-muted hover:text-drive-text transition-colors"
                                title="Rename"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction("trash", item);
                                }}
                                className="p-2 rounded-full hover:bg-drive-border text-drive-muted hover:text-red-500 transition-colors"
                                title="Move to Trash"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {item.isTrash && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction("restore", item);
                                }}
                                className="p-2 rounded-full hover:bg-drive-border text-drive-muted hover:text-green-500 transition-colors"
                                title="Restore"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction("delete", item);
                                }}
                                className="p-2 rounded-full hover:bg-drive-border text-drive-muted hover:text-red-500 transition-colors"
                                title="Delete Forever"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContextMenu(e, item);
                            }}
                            className="p-2 rounded-full hover:bg-drive-border text-drive-muted hover:text-drive-text transition-colors"
                            title="More actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectionBox && (
        <div
          className="absolute border border-blue-500 bg-blue-500/20 z-50 pointer-events-none"
          style={{
            left: selectionBox.x,
            top: selectionBox.y,
            width: selectionBox.width,
            height: selectionBox.height,
          }}
        />
      )}

      {isDragActive && (
        <div className="absolute inset-0 bg-drive-accent/10 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-drive-accent border-dashed m-4 rounded-3xl">
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center transform scale-110 transition-transform">
            <div className="w-20 h-20 bg-drive-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-10 h-10 text-drive-accent animate-bounce" />
            </div>
            <h3 className="text-xl font-bold text-drive-text">
              Drop files to upload
            </h3>
          </div>
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          onClose={() => setContextMenu(null)}
          onAction={handleAction}
        />
      )}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        onSubmit={submitCreateFolder}
        value={createFolderName}
        onChange={(e) => setCreateFolderName(e.target.value)}
      />

      <UploadProgress queue={uploadQueue} onClose={() => setUploadQueue([])} />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() =>
          setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })
        }
        onConfirm={handleConfirmDelete}
        title={deleteConfirmation.isPermanent ? "Delete Forever?" : "Delete?"}
        message={
          deleteConfirmation.type === "empty_trash"
            ? "Are you sure you want to empty the trash? All items will be permanently deleted. This action cannot be undone."
            : deleteConfirmation.item
              ? `Are you sure you want to permanently delete "${deleteConfirmation.item.name}"? This action cannot be undone.`
              : `Are you sure you want to permanently delete ${deleteConfirmation.count} items? This action cannot be undone.`
        }
        confirmText="Delete Forever"
        isDangerous={true}
      />
    </div>
  );
}
