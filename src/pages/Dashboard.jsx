import { useState, useEffect, useCallback, memo, useRef, useMemo } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import {
  FolderPlus,
  Folder,
  File as FileIcon,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Upload,
  HardDrive,
  Calendar,
  X,
  LayoutGrid,
  List,
  ChevronDown,
  ExternalLink,
  Printer,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Link2,
  Lock,
} from "lucide-react";
import { api, getStreamUrl, downloadFile } from "../api/client";
import { useAuth } from "../context/useAuth";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    hour: "2-digit",
    minute: "2-digit",
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

function isImage(mimeType) {
  return mimeType && mimeType.toLowerCase().startsWith("image/");
}

function isPdf(mimeType) {
  return mimeType === "application/pdf" || mimeType === "application/x-pdf";
}

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

function isDocx(mimeType, name) {
  if (mimeType === DOCX_MIME) return true;
  return name && /\.docx?$/i.test(name);
}

function isXlsx(mimeType, name) {
  if (mimeType === XLSX_MIME) return true;
  return name && /\.xlsx?$/i.test(name);
}

function isPptx(mimeType, name) {
  if (mimeType === PPTX_MIME) return true;
  return name && /\.pptx?$/i.test(name);
}

function isOfficeDoc(mimeType, name) {
  return (
    isDocx(mimeType, name) || isXlsx(mimeType, name) || isPptx(mimeType, name)
  );
}

function getOpenWithLabel(item) {
  if (!item) return "Open with";
  const m = (item.mimeType || "").toLowerCase();
  const name = item.name || "";
  if (isDocx(m, name)) return "Open with Google Docs";
  if (isXlsx(m, name)) return "Open with Google Sheets";
  if (isPptx(m, name)) return "Open with Google Slides";
  if (isImage(m)) return "Open with Photos";
  if (isPdf(m)) return "Open with PDF viewer";
  return "Open with default app";
}

function getGoogleDocsViewerUrl(fileUrl) {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(
    fileUrl
  )}&embedded=true`;
}

function isViewableInBrowser(mimeType, name) {
  if (!mimeType && !name) return false;
  const m = (mimeType || "").toLowerCase();
  if (isOfficeDoc(m, name)) return true;
  return (
    m.startsWith("image/") ||
    m === "application/pdf" ||
    m === "application/x-pdf" ||
    m.startsWith("text/") ||
    m === "application/json" ||
    m === "application/xml" ||
    m.startsWith("video/") ||
    m.startsWith("audio/")
  );
}

const ImageThumbnail = memo(function ImageThumbnail({
  fileId,
  mimeType,
  alt,
  className,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const src = fileId && isImage(mimeType) ? getStreamUrl(fileId) : null;
  if (error || !isImage(mimeType) || !src)
    return <FileIcon className={className} aria-hidden />;
  return (
    <div
      className={`${className} relative overflow-hidden rounded bg-drive-dark/80`}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-drive-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt || "Thumbnail"}
        className="w-full h-full object-cover rounded"
        loading="lazy"
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
    </div>
  );
});

const FileItem = memo(function FileItem({
  item,
  onDownload,
  onDelete,
  onRename,
  onView,
  onDragStart,
  onDragOver,
  onDrop,
  onDragLeave,
  onDragEnd,
  isDropTarget,
}) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [saving, setSaving] = useState(false);
  const openTimeoutRef = useRef(null);

  useEffect(() => {
    if (!editing) setEditName(item.name);
  }, [item.name, editing]);

  useEffect(
    () => () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    },
    []
  );

  const handleOpen = useCallback(() => {
    if (item.type === "folder") {
      navigate(`/folder/${item._id}`);
    } else {
      onView?.(item);
    }
  }, [item, navigate, onView]);

  const handleNameClick = useCallback(() => {
    if (openTimeoutRef.current) {
      return;
    }
    openTimeoutRef.current = setTimeout(() => {
      openTimeoutRef.current = null;
      handleOpen();
    }, 400);
  }, [handleOpen]);

  const handleDoubleClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
        openTimeoutRef.current = null;
      }
      setEditName(item.name);
      setEditing(true);
    },
    [item.name]
  );

  const saveRename = useCallback(async () => {
    if (editName.trim() === item.name || !editName.trim()) {
      setEditing(false);
      setEditName(item.name);
      return;
    }
    setSaving(true);
    try {
      await api(`/files/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      toast.success("Renamed.");
      onRename?.();
      setEditing(false);
    } catch (err) {
      toast.error(err.message || "Rename failed.");
    } finally {
      setSaving(false);
    }
  }, [editName, item._id, item.name, onRename]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveRename();
    }
    if (e.key === "Escape") {
      setEditName(item.name);
      setEditing(false);
    }
  };

  const showThumbnail = item.type === "file" && isImage(item.mimeType);

  return (
    <div
      className={`item-3d group grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_1fr_12rem_auto] gap-3 sm:gap-4 items-center p-3 sm:p-4 rounded-xl bg-drive-card/90 border animate-slide-up min-h-[72px] ${
        isDropTarget
          ? "border-drive-accent ring-2 ring-drive-accent/50"
          : "border-drive-border hover:border-drive-accent/40"
      }`}
      style={{ animationFillMode: "backwards" }}
      onDragOver={item.type === "folder" ? onDragOver : undefined}
      onDrop={item.type === "folder" ? onDrop : undefined}
      onDragLeave={onDragLeave}
      onDragEnd={onDragEnd}
      draggable={!!onDragStart}
      onDragStart={onDragStart}
    >
      <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-drive-dark/80 overflow-hidden flex items-center justify-center">
        {item.type === "folder" ? (
          <Folder className="w-7 h-7 text-amber-400" aria-hidden />
        ) : showThumbnail ? (
          <ImageThumbnail
            fileId={item._id}
            mimeType={item.mimeType}
            alt={item.name}
            className="w-full h-full"
          />
        ) : (
          <FileIcon className="w-7 h-7 text-drive-muted" aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex flex-col justify-center">
        {editing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={saveRename}
            onKeyDown={handleKeyDown}
            disabled={saving}
            className="w-full px-2 py-1 rounded bg-drive-dark border border-drive-accent text-white text-sm font-medium focus:outline-none focus:ring-1 focus:ring-drive-accent"
            autoFocus
            aria-label="Rename"
          />
        ) : (
          <button
            type="button"
            onClick={handleNameClick}
            onDoubleClick={handleDoubleClick}
            className="text-white font-medium truncate text-left hover:text-drive-accent transition-colors text-sm sm:text-base"
          >
            {item.name}
          </button>
        )}
        <span className="text-drive-muted text-xs sm:text-sm mt-0.5 flex items-center gap-1">
          <Calendar className="w-3 h-3 flex-shrink-0" aria-hidden />
          {formatDate(item.createdAt)}
        </span>
      </div>

      <div className="text-drive-muted text-xs sm:text-sm text-right w-16 sm:w-20">
        {item.type === "file" ? formatSize(item.size) : "—"}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {item.type === "file" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(item);
            }}
            className="p-2 rounded-lg hover:bg-drive-border text-drive-muted hover:text-white transition-colors"
            title="Download"
            type="button"
          >
            <Download className="w-4 h-4" aria-hidden />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item);
          }}
          className="p-2 rounded-lg hover:bg-red-500/20 text-drive-muted hover:text-red-400 transition-colors"
          title="Delete"
          type="button"
        >
          <Trash2 className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </div>
  );
});

const GridItem = memo(function GridItem({
  item,
  onDownload,
  onDelete,
  onRename,
  onView,
  onDragStart,
  onDragOver,
  onDrop,
  onDragLeave,
  onDragEnd,
  isDropTarget,
}) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [saving, setSaving] = useState(false);
  const openTimeoutRef = useRef(null);

  useEffect(() => {
    if (!editing) setEditName(item.name);
  }, [item.name, editing]);

  useEffect(
    () => () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    },
    []
  );

  const handleOpen = useCallback(() => {
    if (item.type === "folder") navigate(`/folder/${item._id}`);
    else onView?.(item);
  }, [item, navigate, onView]);

  const handleNameClick = useCallback(() => {
    if (openTimeoutRef.current) return;
    openTimeoutRef.current = setTimeout(() => {
      openTimeoutRef.current = null;
      handleOpen();
    }, 400);
  }, [handleOpen]);

  const handleDoubleClickName = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
        openTimeoutRef.current = null;
      }
      setEditName(item.name);
      setEditing(true);
    },
    [item.name]
  );

  const saveRename = useCallback(async () => {
    if (editName.trim() === item.name || !editName.trim()) {
      setEditing(false);
      setEditName(item.name);
      return;
    }
    setSaving(true);
    try {
      await api(`/files/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      toast.success("Renamed.");
      onRename?.();
      setEditing(false);
    } catch (err) {
      toast.error(err.message || "Rename failed.");
    } finally {
      setSaving(false);
    }
  }, [editName, item._id, item.name, onRename]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveRename();
    }
    if (e.key === "Escape") {
      setEditName(item.name);
      setEditing(false);
    }
  };

  const showThumbnail = item.type === "file" && isImage(item.mimeType);

  return (
    <div
      className={`item-3d group relative rounded-xl bg-drive-card/90 border p-3 ${
        isDropTarget
          ? "border-drive-accent ring-2 ring-drive-accent/50"
          : "border-drive-border hover:border-drive-accent/40"
      }`}
      onDragOver={item.type === "folder" ? onDragOver : undefined}
      onDrop={item.type === "folder" ? onDrop : undefined}
      onDragLeave={onDragLeave}
      onDragEnd={onDragEnd}
      draggable={!!onDragStart}
      onDragStart={onDragStart}
    >
      <div
        className="rounded-lg bg-drive-dark/70 overflow-hidden aspect-square flex items-center justify-center cursor-pointer relative"
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" ? handleOpen() : null)}
      >
        {item.type === "folder" ? (
          <Folder className="w-10 h-10 text-amber-400" aria-hidden />
        ) : showThumbnail ? (
          <ImageThumbnail
            fileId={item._id}
            mimeType={item.mimeType}
            alt={item.name}
            className="w-full h-full"
          />
        ) : (
          <FileIcon className="w-10 h-10 text-drive-muted" aria-hidden />
        )}
      </div>

      <div className="mt-3 min-w-0">
        {editing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={saveRename}
            onKeyDown={handleKeyDown}
            disabled={saving}
            className="w-full px-2 py-1 rounded bg-drive-dark border border-drive-accent text-white text-sm font-medium focus:outline-none focus:ring-1 focus:ring-drive-accent"
            autoFocus
            aria-label="Rename"
          />
        ) : (
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={handleNameClick}
              onDoubleClick={handleDoubleClickName}
              className="text-white font-medium text-sm truncate text-left hover:text-drive-accent transition-colors"
              title={item.name}
            >
              {item.name}
            </button>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.type === "file" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(item);
                  }}
                  className="p-2 rounded-lg hover:bg-drive-border text-drive-muted hover:text-white transition-colors"
                  aria-label="Download"
                >
                  <Download className="w-4 h-4" aria-hidden />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item);
                }}
                className="p-2 rounded-lg hover:bg-red-500/20 text-drive-muted hover:text-red-400 transition-colors"
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
        <div className="mt-1 flex items-center justify-between text-xs text-drive-muted">
          <span className="truncate">{formatDate(item.createdAt)}</span>
          <span>{item.type === "file" ? formatSize(item.size) : ""}</span>
        </div>
      </div>
    </div>
  );
});

export default function Dashboard() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { searchQuery } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creating, setCreating] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [breadcrumbs, setBreadcrumbs] = useState([
    { name: "My Drive", id: null },
  ]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadMenuOpen, setUploadMenuOpen] = useState(false);
  const [openOptionsItem, setOpenOptionsItem] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [dropTargetId, setDropTargetId] = useState(null);
  const [moving, setMoving] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [shareModalItem, setShareModalItem] = useState(null);
  const [openWithDropdownOpen, setOpenWithDropdownOpen] = useState(false);

  const { user: authUser } = useAuth();
  const filePickerRef = useRef(null);
  const folderPickerRef = useRef(null);
  const uploadMenuRef = useRef(null);

  const parentId = folderId && folderId !== "root" ? folderId : null;

  const sortedItems = useMemo(() => {
    let arr = [...items];
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      arr = arr.filter((item) => item.name.toLowerCase().includes(q));
    }
    const cmp = (a, b) => {
      let v = 0;
      if (sortBy === "name")
        v = (a.name || "").localeCompare(b.name || "", undefined, {
          sensitivity: "base",
        });
      else if (sortBy === "size") v = (a.size ?? 0) - (b.size ?? 0);
      else if (sortBy === "type")
        v =
          (a.type || "").localeCompare(b.type || "") ||
          (a.mimeType || "").localeCompare(b.mimeType || "");
      else if (sortBy === "date")
        v =
          new Date(a.updatedAt || a.createdAt || 0) -
          new Date(b.updatedAt || b.createdAt || 0);
      return sortOrder === "asc" ? v : -v;
    };
    arr.sort((a, b) =>
      a.type !== b.type ? (a.type === "folder" ? -1 : 1) : cmp(a, b)
    );
    return arr;
  }, [items, sortBy, sortOrder, searchQuery]);

  const viewableFiles = useMemo(
    () =>
      sortedItems.filter(
        (i) => i.type === "file" && isViewableInBrowser(i.mimeType, i.name)
      ),
    [sortedItems]
  );

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { items: data } = await api(
        `/files?parentId=${parentId || "root"}`
      );
      setItems(data);
    } catch (err) {
      toast.error(err.message || "Failed to load files.");
    } finally {
      setLoading(false);
    }
  }, [parentId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (!uploadMenuOpen) return;
    const close = (e) => {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(e.target))
        setUploadMenuOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [uploadMenuOpen]);

  useEffect(() => {
    let cancelled = false;
    async function buildCrumbs() {
      if (!folderId) {
        if (!cancelled) setBreadcrumbs([{ name: "My Drive", id: null }]);
        return;
      }
      const chain = [];
      let current = folderId;
      let guard = 0;
      while (current && guard < 25) {
        guard++;
        const { item } = await api(`/files/meta/${current}`);
        chain.push({
          id: item._id,
          name: item.name,
          parentId: item.parentId || null,
        });
        current = item.parentId || null;
      }
      chain.reverse();
      const crumbs = [{ name: "My Drive", id: null }];
      for (const c of chain)
        crumbs.push({ name: c.name, id: c.id, parentId: c.parentId });
      if (!cancelled) setBreadcrumbs(crumbs);
    }
    buildCrumbs().catch(() => {
      if (!cancelled) setBreadcrumbs([{ name: "My Drive", id: null }]);
    });
    return () => {
      cancelled = true;
    };
  }, [folderId]);

  const onDrop = useCallback(
    async (acceptedFiles, options = {}) => {
      const skipRelativePath = options.skipRelativePath === true;
      if (!acceptedFiles.length) return;
      setUploading(true);
      let done = 0;
      const zipFiles = acceptedFiles.filter((f) =>
        f.name.toLowerCase().endsWith(".zip")
      );
      const otherFiles = acceptedFiles.filter(
        (f) => !f.name.toLowerCase().endsWith(".zip")
      );

      for (const file of zipFiles) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          if (parentId) formData.append("parentId", parentId);
          const res = await api("/files/upload-zip", {
            method: "POST",
            body: formData,
          });
          done += res.created || 0;
          toast.success(
            `Zip extracted: ${res.created || 0} items from ${file.name}`
          );
        } catch (err) {
          toast.error(`${file.name}: ${err.message}`);
        }
      }
      for (const file of otherFiles) {
        try {
          const relativePath = skipRelativePath
            ? ""
            : (typeof file.webkitRelativePath === "string" &&
                file.webkitRelativePath) ||
              (typeof file.path === "string" && file.path.includes("/")
                ? file.path
                : "");
          const formData = new FormData();
          formData.append("file", file);
          if (parentId) formData.append("parentId", parentId);
          if (relativePath) formData.append("relativePath", relativePath);
          await api("/files/upload", { method: "POST", body: formData });
          done++;
          toast.success(`Uploaded: ${file.name}`);
        } catch (err) {
          toast.error(`${file.name}: ${err.message}`);
        }
      }
      setUploading(false);
      if (done) fetchItems();
    },
    [parentId, fetchItems]
  );

  const handlePickFiles = () => filePickerRef.current?.click();
  const handlePickFolder = () => folderPickerRef.current?.click();

  const handleFolderPicked = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    let done = 0;
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        if (parentId) formData.append("parentId", parentId);
        if (file.webkitRelativePath)
          formData.append("relativePath", file.webkitRelativePath);
        await api("/files/upload", { method: "POST", body: formData });
        done++;
      } catch (err) {
        toast.error(`${file.name}: ${err.message}`);
      }
    }
    setUploading(false);
    if (done) {
      toast.success(`Uploaded folder: ${done} file${done !== 1 ? "s" : ""}`);
      fetchItems();
    }
    e.target.value = "";
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    disabled: uploading,
    accept: {
      "application/zip": [".zip"],
      "application/x-zip-compressed": [".zip"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"],
      "application/pdf": [".pdf"],
      "*/*": [],
    },
  });

  const createFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      toast.error("Enter a folder name.");
      return;
    }
    setCreating(true);
    try {
      await api("/files/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim(), parentId }),
      });
      toast.success("Folder created.");
      setShowNewFolder(false);
      setNewFolderName("");
      fetchItems();
    } catch (err) {
      toast.error(err.message || "Failed to create folder.");
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = useCallback(async (item) => {
    if (item.type !== "file") return;
    try {
      const url =
        getStreamUrl(item._id) +
        (getStreamUrl(item._id).includes("?") ? "&" : "?") +
        "download=1";
      await downloadFile(url, item.name);
      toast.success("Download started.");
    } catch {
      toast.error("Download failed.");
    }
  }, []);

  const handleView = useCallback((item) => {
    if (item.type !== "file") return;
    setOpenOptionsItem(item);
  }, []);

  const handleDeleteClick = useCallback((item) => {
    setDeleteTarget(item);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    const idToDelete = deleteTarget._id;
    setDeleteTarget(null);
    setItems((prev) => prev.filter((i) => i._id !== idToDelete));
    if (previewItem?._id === idToDelete) {
      setPreviewItem(null);
      setPreviewUrl(null);
    }
    setDeleting(true);
    try {
      await api(`/files/${idToDelete}`, { method: "DELETE" });
      toast.success("Deleted.");
    } catch (err) {
      toast.error(err.message || "Delete failed.");
      fetchItems();
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, fetchItems, previewItem]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const handleDragStart = useCallback((e, item) => {
    setDragId(item._id);
    e.dataTransfer.setData("text/plain", item._id);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e, folderId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetId(folderId);
  }, []);

  const handleDragLeave = useCallback(() => setDropTargetId(null), []);

  const handleDragEnd = useCallback(() => {
    setDragId(null);
    setDropTargetId(null);
  }, []);

  const handleDrop = useCallback(
    async (e, targetFolderId) => {
      e.preventDefault();
      setDropTargetId(null);
      const id = e.dataTransfer.getData("text/plain");
      if (!id || id === targetFolderId) return;
      const item = items.find((i) => i._id === id);
      if (!item) return;
      if (item.type === "folder" && targetFolderId) {
        const target = items.find((i) => i._id === targetFolderId);
        if (target?.parentId && String(target.parentId) === id) return;
      }
      setMoving(true);
      try {
        await api(`/files/${id}/move`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentId: targetFolderId || null }),
        });
        toast.success(`Moved "${item.name}".`);
        fetchItems();
      } catch (err) {
        toast.error(err.message || "Move failed.");
      } finally {
        setMoving(false);
        setDragId(null);
      }
    },
    [items, fetchItems]
  );

  const goUp = () => {
    if (!folderId) return;
    const parentCrumb =
      breadcrumbs.length >= 2 ? breadcrumbs[breadcrumbs.length - 2] : null;
    if (!parentCrumb || !parentCrumb.id) navigate("/");
    else navigate(`/folder/${parentCrumb.id}`);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-drive-border bg-drive-card/30">
        <div className="flex items-center gap-2 min-w-0">
          {folderId && (
            <button
              onClick={goUp}
              type="button"
              className="p-2 rounded-lg text-drive-muted hover:bg-drive-border hover:text-white transition-colors flex-shrink-0"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden />
            </button>
          )}
          <div className="flex flex-wrap items-center gap-1.5 text-sm min-w-0">
            {breadcrumbs.map((c, idx) => (
              <div
                key={`${c.id || "root"}-${idx}`}
                className="flex items-center gap-1.5"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!c.id) navigate("/");
                    else navigate(`/folder/${c.id}`);
                  }}
                  className="text-drive-muted hover:text-white transition-colors truncate max-w-[180px] py-1"
                >
                  {c.name}
                </button>
                {idx < breadcrumbs.length - 1 && (
                  <span className="text-drive-muted/50 flex-shrink-0">/</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={uploadMenuRef}>
            <button
              type="button"
              onClick={() => setUploadMenuOpen((o) => !o)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-drive-border/60 hover:bg-drive-border text-white transition-colors duration-200"
              aria-expanded={uploadMenuOpen}
              aria-haspopup="true"
            >
              <Upload className="w-4 h-4" aria-hidden />
              Upload
              <ChevronDown className="w-4 h-4" aria-hidden />
            </button>
            {uploadMenuOpen && (
              <div className="absolute top-full left-0 mt-1 py-1 min-w-[180px] rounded-xl bg-drive-card border border-drive-border shadow-xl z-50 animate-fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMenuOpen(false);
                    filePickerRef.current?.click();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-white hover:bg-drive-border/60 transition-colors"
                >
                  <Upload className="w-4 h-4" aria-hidden />
                  Upload files
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMenuOpen(false);
                    folderPickerRef.current?.click();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-white hover:bg-drive-border/60 transition-colors"
                >
                  <Folder className="w-4 h-4" aria-hidden />
                  Upload folder
                </button>
              </div>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-1 px-1 py-1 rounded-xl bg-drive-border/40 border border-drive-border">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split("-");
                setSortBy(by);
                setSortOrder(order);
              }}
              className="bg-drive-dark border border-drive-border rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-drive-accent"
              aria-label="Sort by"
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="size-asc">Size (smallest)</option>
              <option value="size-desc">Size (largest)</option>
              <option value="type-asc">Type A-Z</option>
              <option value="type-desc">Type Z-A</option>
              <option value="date-asc">Date (oldest)</option>
              <option value="date-desc">Date (newest)</option>
            </select>
          </div>
          <div className="hidden sm:flex items-center gap-1 px-1 py-1 rounded-xl bg-drive-border/40 border border-drive-border">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-drive-border text-white"
                  : "text-drive-muted hover:text-white"
              }`}
              aria-label="List view"
            >
              <List className="w-4 h-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-drive-border text-white"
                  : "text-drive-muted hover:text-white"
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" aria-hidden />
            </button>
          </div>
          <button
            onClick={() => setShowNewFolder(true)}
            type="button"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-drive-accent hover:bg-drive-accentHover text-white font-medium shadow-glow transition-all duration-200 hover:shadow-glow-lg"
          >
            <FolderPlus className="w-5 h-5" aria-hidden />
            New folder
          </button>
        </div>
      </div>
      <input
        ref={filePickerRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          onDrop(files, { skipRelativePath: true });
          e.target.value = "";
        }}
      />
      <input
        ref={folderPickerRef}
        type="file"
        multiple
        className="hidden"
        webkitdirectory
        directory
        onChange={handleFolderPicked}
      />

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
        >
          <div
            className="modal-3d glass w-full max-w-md rounded-2xl p-6 border border-drive-border animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="delete-title"
              className="text-lg font-semibold text-white mb-2"
            >
              Delete item?
            </h2>
            <p className="text-drive-muted mb-4">
              &ldquo;{deleteTarget.name ?? "Untitled"}&rdquo; will be
              permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl bg-drive-border/80 hover:bg-drive-border text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium disabled:opacity-50 transition-colors"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewFolder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-folder-title"
        >
          <div
            className="modal-3d glass w-full max-w-md rounded-2xl p-6 border border-drive-border animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="new-folder-title"
              className="text-lg font-semibold text-white mb-4"
            >
              New folder
            </h2>
            <form onSubmit={createFolder} className="space-y-4">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="w-full px-4 py-3 rounded-xl bg-drive-dark border border-drive-border text-white placeholder-drive-muted focus:outline-none focus:ring-2 focus:ring-drive-accent focus:border-transparent transition-shadow"
                autoFocus
                aria-label="Folder name"
              />
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewFolder(false);
                    setNewFolderName("");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-drive-border/80 hover:bg-drive-border text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-drive-accent hover:bg-drive-accentHover text-white font-medium disabled:opacity-50 transition-all"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewUrl && previewItem && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label={
            isImage(previewItem.mimeType) ? "Image preview" : "File preview"
          }
          onClick={() => {
            setPreviewUrl(null);
            setPreviewItem(null);
            setPreviewZoom(1);
            setOpenWithDropdownOpen(false);
          }}
        >
          <div
            className={`w-full max-w-6xl max-h-[95vh] sm:max-h-[92vh] overflow-hidden flex flex-col animate-slide-up ${
              isImage(previewItem.mimeType)
                ? "bg-transparent"
                : "rounded-xl sm:rounded-2xl bg-white shadow-2xl"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 shrink-0 ${
                isImage(previewItem.mimeType)
                  ? "bg-black/70 backdrop-blur-md border-b border-white/10"
                  : "border-b border-gray-200 bg-gray-50"
              }`}
            >
              <p
                className={`text-xs sm:text-sm font-medium truncate max-w-[25%] sm:max-w-[40%] ${
                  isImage(previewItem.mimeType) ? "text-white" : "text-gray-800"
                }`}
              >
                {previewItem.name}
              </p>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenWithDropdownOpen((o) => !o)}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium ${
                      isImage(previewItem.mimeType)
                        ? "bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white"
                        : "bg-white border border-gray-300 hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <span className="hidden sm:inline">
                      {getOpenWithLabel(previewItem)}
                    </span>
                    <span className="sm:hidden">Open</span>
                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  {openWithDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-[110]"
                        onClick={() => setOpenWithDropdownOpen(false)}
                        aria-hidden
                      />
                      <div className="absolute top-full right-0 mt-1 py-2 w-56 rounded-xl bg-white border border-gray-200 shadow-2xl z-[120]">
                        {isOfficeDoc(
                          previewItem.mimeType,
                          previewItem.name
                        ) && (
                          <button
                            type="button"
                            onClick={() => {
                              window.open(
                                getGoogleDocsViewerUrl(previewUrl),
                                "_blank",
                                "noopener,noreferrer"
                              );
                              setOpenWithDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 text-sm"
                          >
                            <ExternalLink className="w-4 h-4 text-gray-500" />
                            {isDocx(previewItem.mimeType, previewItem.name)
                              ? "Open with Google Docs"
                              : isXlsx(previewItem.mimeType, previewItem.name)
                              ? "Open with Google Sheets"
                              : "Open with Google Slides"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setOpenWithDropdownOpen(false)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 text-sm"
                        >
                          <FileIcon className="w-4 h-4 text-gray-500" />
                          View here
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            window.open(
                              previewUrl,
                              "_blank",
                              "noopener,noreferrer"
                            );
                            setOpenWithDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 text-sm"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-500" />
                          Open in new tab
                        </button>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const url =
                                previewUrl +
                                (previewUrl.includes("?") ? "&" : "?") +
                                "download=1";
                              await downloadFile(url, previewItem.name);
                              toast.success("Download started.");
                            } catch {
                              toast.error("Download failed.");
                            }
                            setOpenWithDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 text-sm"
                        >
                          <Download className="w-4 h-4 text-gray-500" />
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const url =
                                previewUrl +
                                (previewUrl.includes("?") ? "&" : "?") +
                                "download=1";
                              await downloadFile(url, previewItem.name);
                              toast.success(
                                "Download started. Open from your device with the default app."
                              );
                            } catch {
                              toast.error("Download failed.");
                            }
                            setOpenWithDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 text-sm"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-500" />
                          Open with default app
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className={`hidden sm:block p-1.5 sm:p-2 rounded-lg ${
                    isImage(previewItem.mimeType)
                      ? "hover:bg-white/10 text-white"
                      : "hover:bg-gray-200 text-gray-600"
                  }`}
                  aria-label="Print"
                >
                  <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const url =
                        previewUrl +
                        (previewUrl.includes("?") ? "&" : "?") +
                        "download=1";
                      await downloadFile(url, previewItem.name);
                      toast.success("Download started.");
                    } catch {
                      toast.error("Download failed.");
                    }
                  }}
                  className={`p-1.5 sm:p-2 rounded-lg ${
                    isImage(previewItem.mimeType)
                      ? "hover:bg-white/10 text-white"
                      : "hover:bg-gray-200 text-gray-600"
                  }`}
                  aria-label="Download"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShareModalItem(previewItem)}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-drive-accent hover:bg-drive-accentHover text-white text-xs sm:text-sm"
                >
                  <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Share</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null);
                    setPreviewItem(null);
                    setPreviewZoom(1);
                    setOpenWithDropdownOpen(false);
                  }}
                  className={`p-1.5 sm:p-2 rounded-lg ${
                    isImage(previewItem.mimeType)
                      ? "hover:bg-white/10 text-white"
                      : "hover:bg-gray-200 text-gray-600"
                  }`}
                  aria-label="Close"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center min-h-0 relative">
              {viewableFiles.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const idx = viewableFiles.findIndex(
                        (f) => f._id === previewItem._id
                      );
                      if (idx <= 0) return;
                      const prev = viewableFiles[idx - 1];
                      setPreviewItem(prev);
                      setPreviewUrl(getStreamUrl(prev._id));
                      setPreviewZoom(1);
                    }}
                    className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                    aria-label="Previous file"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const idx = viewableFiles.findIndex(
                        (f) => f._id === previewItem._id
                      );
                      if (idx < 0 || idx >= viewableFiles.length - 1) return;
                      const next = viewableFiles[idx + 1];
                      setPreviewItem(next);
                      setPreviewUrl(getStreamUrl(next._id));
                      setPreviewZoom(1);
                    }}
                    className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                    aria-label="Next file"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </>
              )}
              <div
                className="flex items-center justify-center w-full h-full p-4 overflow-auto bg-transparent"
                onClick={(e) => e.stopPropagation()}
              >
                {isOfficeDoc(previewItem.mimeType, previewItem.name) ? (
                  <iframe
                    src={getGoogleDocsViewerUrl(previewUrl)}
                    title={previewItem.name}
                    className="w-full flex-1 min-h-[65vh] rounded border-0 bg-white"
                    style={{ minHeight: "65vh" }}
                  />
                ) : isPdf(previewItem.mimeType) ? (
                  <object
                    data={previewUrl}
                    type="application/pdf"
                    title={previewItem.name}
                    className="w-full max-w-4xl flex-1 min-h-[60vh] rounded-lg shadow-2xl bg-white border-0"
                    style={{ minHeight: "60vh" }}
                  >
                    <iframe
                      src={previewUrl}
                      title={previewItem.name}
                      className="w-full max-w-4xl flex-1 min-h-[60vh] rounded-lg shadow-2xl bg-white border-0"
                      style={{ minHeight: "60vh" }}
                    />
                  </object>
                ) : isImage(previewItem.mimeType) ? (
                  <div className="flex items-center justify-center overflow-auto min-h-full">
                    <div
                      style={{
                        transform: `scale(${previewZoom})`,
                        transformOrigin: "center",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      <img
                        src={previewUrl}
                        alt={previewItem.name}
                        loading="eager"
                        className="max-w-full max-h-[calc(92vh-10rem)] w-auto h-auto object-contain select-none"
                        style={{ maxHeight: "calc(92vh - 10rem)" }}
                        draggable={false}
                      />
                    </div>
                  </div>
                ) : (
                  <iframe
                    src={previewUrl}
                    title={previewItem.name}
                    className="w-full max-w-4xl flex-1 min-h-[60vh] rounded-lg shadow-2xl bg-white border-0"
                    style={{ minHeight: "60vh" }}
                  />
                )}
              </div>
            </div>
            <div
              className={`shrink-0 flex items-center justify-center gap-3 sm:gap-6 px-3 sm:px-4 py-2 sm:py-3 border-t ${
                isImage(previewItem.mimeType)
                  ? "border-white/10 bg-black/70 backdrop-blur-md"
                  : "border-gray-200 bg-gray-50 justify-between"
              }`}
            >
              {!isImage(previewItem.mimeType) && (
                <p className="text-gray-500 text-xs truncate max-w-[60%] sm:max-w-[50%]">
                  My Drive
                  {breadcrumbs.length > 1
                    ? ` > ${breadcrumbs
                        .map((b) => b.name)
                        .slice(1)
                        .join(" > ")}`
                    : ""}{" "}
                  &gt; {previewItem.name}
                </p>
              )}
              {isImage(previewItem.mimeType) && (
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewZoom((z) => Math.max(0.25, z - 0.25))
                    }
                    className="p-1.5 sm:p-2.5 rounded-lg hover:bg-white/20 bg-white/5 text-white backdrop-blur-sm"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <span className="text-white text-xs sm:text-sm font-medium px-1 sm:px-2 min-w-[3rem] text-center">
                    {Math.round(previewZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(1)}
                    className="p-1.5 sm:p-2.5 rounded-lg hover:bg-white/20 bg-white/5 text-white backdrop-blur-sm"
                    aria-label="Fit"
                  >
                    <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom((z) => Math.min(3, z + 0.25))}
                    className="p-1.5 sm:p-2.5 rounded-lg hover:bg-white/20 bg-white/5 text-white backdrop-blur-sm"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {openOptionsItem && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="open-options-title"
        >
          <div
            className="modal-3d glass w-full max-w-md rounded-2xl p-6 border border-drive-border animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="open-options-title"
              className="text-lg font-semibold text-white mb-1"
            >
              Open &ldquo;{openOptionsItem.name}&rdquo;
            </h2>
            <p className="text-drive-muted text-sm mb-4">
              Choose how to open this file.
            </p>
            <div className="space-y-2">
              {(isPdf(openOptionsItem.mimeType) ||
                isViewableInBrowser(
                  openOptionsItem.mimeType,
                  openOptionsItem.name
                )) && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewItem(openOptionsItem);
                    setPreviewUrl(getStreamUrl(openOptionsItem._id));
                    setPreviewZoom(1);
                    setOpenOptionsItem(null);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-drive-border/60 hover:bg-drive-border text-white transition-colors text-left"
                >
                  <FileIcon className="w-4 h-4 flex-shrink-0" aria-hidden />
                  View here
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  window.open(
                    getStreamUrl(openOptionsItem._id),
                    "_blank",
                    "noopener,noreferrer"
                  );
                  setOpenOptionsItem(null);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-drive-border/60 hover:bg-drive-border text-white transition-colors text-left"
              >
                <ExternalLink className="w-4 h-4 flex-shrink-0" aria-hidden />
                Open in new tab
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const url =
                      getStreamUrl(openOptionsItem._id) +
                      (getStreamUrl(openOptionsItem._id).includes("?")
                        ? "&"
                        : "?") +
                      "download=1";
                    await downloadFile(url, openOptionsItem.name);
                    toast.success("Download started.");
                  } catch {
                    toast.error("Download failed.");
                  }
                  setOpenOptionsItem(null);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-drive-border/60 hover:bg-drive-border text-white transition-colors text-left"
              >
                <Download className="w-4 h-4 flex-shrink-0" aria-hidden />
                Download
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-drive-border flex justify-end">
              <button
                type="button"
                onClick={() => setOpenOptionsItem(null)}
                className="px-4 py-2 rounded-xl bg-drive-border/80 hover:bg-drive-border text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {shareModalItem && (
        <div
          className="fixed inset-0 z-[101] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-title"
          onClick={() => setShareModalItem(null)}
        >
          <div
            className="modal-3d glass w-full max-w-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-drive-border animate-slide-up bg-drive-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="share-title"
              className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 truncate"
            >
              Share &ldquo;{shareModalItem.name}&rdquo;
            </h2>
            <div className="mb-3 sm:mb-4">
              <input
                type="text"
                placeholder="Add people, groups, spaces and calendar events"
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-drive-dark border border-drive-border text-white placeholder-drive-muted text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-drive-accent focus:border-transparent"
                aria-label="Add people"
              />
            </div>
            <div className="mb-3 sm:mb-4">
              <p className="text-drive-muted text-xs font-medium mb-2">
                People with access
              </p>
              <div className="flex items-center justify-between gap-2 sm:gap-3 py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl bg-drive-dark/80 border border-drive-border">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-drive-accent/30 flex items-center justify-center shrink-0">
                    <span className="text-drive-accent font-semibold text-xs sm:text-sm">
                      {authUser?.firstName?.[0] || authUser?.email?.[0] || "?"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-xs sm:text-sm font-medium truncate">
                      {authUser?.firstName} {authUser?.lastName} (you)
                    </p>
                    <p className="text-drive-muted text-xs truncate">
                      {authUser?.email}
                    </p>
                  </div>
                </div>
                <span className="text-drive-muted text-xs shrink-0">Owner</span>
              </div>
            </div>
            <div className="mb-3 sm:mb-4">
              <p className="text-drive-muted text-xs font-medium mb-2">
                General access
              </p>
              <div className="flex items-center gap-2 py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl bg-drive-dark/80 border border-drive-border">
                <Lock className="w-4 h-4 text-drive-muted shrink-0" />
                <select
                  className="flex-1 bg-transparent text-white text-xs sm:text-sm focus:outline-none"
                  defaultValue="restricted"
                  aria-label="General access"
                >
                  <option value="restricted">Restricted</option>
                  <option value="link-viewer">
                    Anyone with the link (Viewer)
                  </option>
                  <option value="link-editor">
                    Anyone with the link (Editor)
                  </option>
                </select>
              </div>
              <p className="text-drive-muted text-xs mt-1.5">
                Only people with access can open with the link
              </p>
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const url = getStreamUrl(shareModalItem._id);
                  navigator.clipboard
                    .writeText(url)
                    .then(() => {
                      toast.success("Link copied to clipboard.");
                    })
                    .catch(() => {
                      toast.error("Could not copy link.");
                    });
                }}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-drive-border/60 hover:bg-drive-border text-white text-xs sm:text-sm"
              >
                <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Copy link
              </button>
              <button
                type="button"
                onClick={() => setShareModalItem(null)}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-drive-accent hover:bg-drive-accentHover text-white font-medium text-xs sm:text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        {...getRootProps()}
        className={`relative rounded-2xl border-2 border-dashed min-h-[320px] transition-all duration-300 ${
          isDragActive
            ? "border-drive-accent bg-drive-accent/15 shadow-glow scale-[1.01]"
            : "border-drive-border bg-drive-card/40 hover:border-drive-border hover:bg-drive-card/60"
        }`}
      >
        <input {...getInputProps()} aria-label="Upload files" />
        {isDragActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 rounded-2xl bg-drive-accent/10">
            <div className="flex flex-col items-center gap-3 text-drive-accent">
              <Upload className="w-14 h-14" aria-hidden />
              <span className="font-semibold text-lg">
                Drop files or folders here
              </span>
              <span className="text-sm opacity-90">
                Zip files will be extracted
              </span>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6">
          {uploading && (
            <div className="mb-4 flex items-center gap-2 text-drive-accent animate-shimmer">
              <div className="h-4 w-4 border-2 border-drive-accent border-t-transparent rounded-full animate-spin" />
              Uploading...
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div
                className="h-10 w-10 border-2 border-drive-accent border-t-transparent rounded-full animate-spin"
                aria-hidden
              />
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
              <div className="p-4 rounded-2xl bg-drive-card/80 border border-drive-border mb-6">
                <HardDrive
                  className="w-20 h-20 text-drive-muted/70"
                  aria-hidden
                />
              </div>
              {searchQuery && searchQuery.trim() ? (
                <>
                  <p className="font-semibold text-white text-lg">
                    No results found
                  </p>
                  <p className="text-drive-muted mt-2 max-w-sm">
                    No files or folders match &ldquo;{searchQuery.trim()}
                    &rdquo;. Try a different search term.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-white text-lg">
                    No files or folders yet
                  </p>
                  <p className="text-drive-muted mt-2 max-w-sm">
                    Drag and drop files here (including .zip to extract), or
                    click{" "}
                    <strong className="text-drive-accent">New folder</strong> to
                    create one.
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_1fr_12rem_auto] gap-3 sm:gap-4 items-center px-3 sm:px-4 py-2 mb-2 border-b border-drive-border text-drive-muted text-xs sm:text-sm font-medium">
                <span className="w-12">Type</span>
                <span>Name</span>
                <span className="text-right w-16 sm:w-20">Size</span>
                <span className="w-20" />
              </div>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {sortedItems.map((item) => (
                    <GridItem
                      key={item._id}
                      item={item}
                      onDownload={handleDownload}
                      onDelete={handleDeleteClick}
                      onRename={fetchItems}
                      onView={handleView}
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragOver={(e) =>
                        handleDragOver(
                          e,
                          item.type === "folder" ? item._id : null
                        )
                      }
                      onDrop={
                        item.type === "folder"
                          ? (e) => handleDrop(e, item._id)
                          : undefined
                      }
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                      isDropTarget={dropTargetId === item._id}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid gap-2">
                  {sortedItems.map((item) => (
                    <FileItem
                      key={item._id}
                      item={item}
                      onDownload={handleDownload}
                      onDelete={handleDeleteClick}
                      onRename={fetchItems}
                      onView={handleView}
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragOver={(e) =>
                        handleDragOver(
                          e,
                          item.type === "folder" ? item._id : null
                        )
                      }
                      onDrop={
                        item.type === "folder"
                          ? (e) => handleDrop(e, item._id)
                          : undefined
                      }
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                      isDropTarget={dropTargetId === item._id}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
