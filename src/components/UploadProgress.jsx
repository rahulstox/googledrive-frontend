import React from "react";
import { X, Check, AlertCircle, Loader2 } from "lucide-react";

export default function UploadProgress({ queue, onClose }) {
  if (queue.length === 0) return null;

  const uploadingCount = queue.filter((i) => i.status === "uploading").length;
  const completedCount = queue.filter((i) => i.status === "completed").length;
  const errorCount = queue.filter((i) => i.status === "error").length;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white dark:bg-drive-card rounded-xl shadow-2xl border border-drive-border overflow-hidden z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-gray-50 dark:bg-drive-dark p-3 flex items-center justify-between border-b border-drive-border">
        <h3 className="font-medium text-drive-text text-sm">
          {uploadingCount > 0
            ? `Uploading ${uploadingCount} item${uploadingCount !== 1 ? "s" : ""}`
            : "Uploads complete"}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 dark:hover:bg-drive-border rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-drive-muted" />
        </button>
      </div>
      <div className="max-h-60 overflow-y-auto p-2 space-y-1">
        {queue.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-drive-border/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium text-drive-text truncate">
                  {item.name}
                </p>
                <span className="text-xs text-drive-muted">
                  {item.status === "uploading" && `${item.progress || 0}%`}
                </span>
              </div>
              {item.status === "uploading" && (
                <div className="w-full bg-gray-200 dark:bg-drive-border rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-drive-accent h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${item.progress || 0}%` }}
                  />
                </div>
              )}
              <p className="text-xs text-drive-muted capitalize flex items-center gap-1 mt-1">
                {item.status === "error" && (
                  <span className="text-red-500">Failed</span>
                )}
                {item.status === "uploading" && "Uploading..."}
                {item.status === "completed" && (
                  <span className="text-green-600 dark:text-green-400">
                    Completed
                  </span>
                )}
              </p>
            </div>
            {item.status === "uploading" && (
              <Loader2 className="w-4 h-4 text-drive-accent animate-spin flex-shrink-0" />
            )}
            {item.status === "completed" && (
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            )}
            {item.status === "error" && (
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
