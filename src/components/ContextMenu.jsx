import { useEffect, useRef } from "react";
import {
  Download,
  ExternalLink,
  Star,
  Trash2,
  Edit2,
  FolderOpen,
  RotateCcw,
} from "lucide-react";

export default function ContextMenu({ x, y, item, onClose, onAction }) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    // Use a small timeout to avoid the initial click that opened the menu from closing it immediately
    // if the event bubbles up or if we use mousedown/up.
    // But since we use onContextMenu which is separate, 'click' listener is fine.
    document.addEventListener("click", handleClick);
    document.addEventListener("contextmenu", handleClick); // Close on right click elsewhere
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("contextmenu", handleClick);
    };
  }, [onClose]);

  if (!item) return null;

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[180px] bg-white rounded-xl shadow-xl border border-drive-border py-1 text-sm animate-in fade-in zoom-in-95 duration-100 origin-top-left"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-2 border-b border-drive-border mb-1 bg-drive-dark/30">
        <p className="font-semibold text-drive-text truncate max-w-[160px]">
          {item.name}
        </p>
        <p className="text-xs text-drive-muted">
          {item.type === "folder" ? "Folder" : formatSize(item.size)}
        </p>
      </div>

      {item.isTrash ? (
        <>
          <button
            onClick={() => onAction("restore", item)}
            className="w-full text-left px-3 py-2 hover:bg-drive-dark flex items-center gap-2 text-drive-text transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-green-500" /> Restore
          </button>
          <button
            onClick={() => onAction("delete", item)}
            className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete Forever
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => onAction("open", item)}
            className="w-full text-left px-3 py-2 hover:bg-drive-dark flex items-center gap-2 text-drive-text transition-colors"
          >
            {item.type === "folder" ? (
              <FolderOpen className="w-4 h-4 text-blue-500" />
            ) : (
              <ExternalLink className="w-4 h-4 text-blue-500" />
            )}
            Open
          </button>

          {item.type !== "folder" && (
            <button
              onClick={() => onAction("download", item)}
              className="w-full text-left px-3 py-2 hover:bg-drive-dark flex items-center gap-2 text-drive-text transition-colors"
            >
              <Download className="w-4 h-4 text-drive-muted" /> Download
            </button>
          )}

          <button
            onClick={() => onAction("star", item)}
            className="w-full text-left px-3 py-2 hover:bg-drive-dark flex items-center gap-2 text-drive-text transition-colors"
          >
            <Star
              className={`w-4 h-4 ${item.isStarred ? "text-yellow-400 fill-current" : "text-drive-muted"}`}
            />
            {item.isStarred ? "Remove from Starred" : "Add to Starred"}
          </button>

          <button
            onClick={() => onAction("rename", item)}
            className="w-full text-left px-3 py-2 hover:bg-drive-dark flex items-center gap-2 text-drive-text transition-colors"
          >
            <Edit2 className="w-4 h-4 text-drive-muted" /> Rename
          </button>

          <button
            onClick={() => onAction("move", item)}
            className="w-full text-left px-3 py-2 hover:bg-drive-dark flex items-center gap-2 text-drive-text transition-colors"
          >
            <FolderOpen className="w-4 h-4 text-drive-muted" /> Move to folder
          </button>

          <div className="h-px bg-drive-border my-1 mx-2" />

          <button
            onClick={() => onAction("trash", item)}
            className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Move to Trash
          </button>
        </>
      )}
    </div>
  );
}

function formatSize(bytes) {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
