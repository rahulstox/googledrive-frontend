import React from "react";
import { X, Star, Download, Trash2, RotateCcw } from "lucide-react";

export default function SelectionToolbar({
  selectedCount,
  onClearSelection,
  onBulkAction,
  isTrashView,
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 mb-8 bg-white dark:bg-drive-card p-4 rounded-2xl shadow-sm border border-drive-border animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-4">
        <button
          onClick={onClearSelection}
          className="p-2 hover:bg-drive-dark rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-drive-text" />
        </button>
        <span className="font-medium text-lg text-drive-text">
          {selectedCount} selected
        </span>
      </div>
      <div className="flex items-center gap-2">
        {!isTrashView && (
          <>
            <button
              onClick={() => onBulkAction("star")}
              className="p-2 hover:bg-drive-dark rounded-full text-drive-muted hover:text-drive-text transition-colors"
              title="Star/Unstar"
            >
              <Star className="w-5 h-5" />
            </button>
            <button
              onClick={() => onBulkAction("download")}
              className="p-2 hover:bg-drive-dark rounded-full text-drive-muted hover:text-drive-text transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => onBulkAction("trash")}
              className="p-2 hover:bg-drive-dark rounded-full text-drive-muted hover:text-red-500 transition-colors"
              title="Move to Trash"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </>
        )}
        {isTrashView && (
          <>
            <button
              onClick={() => onBulkAction("restore")}
              className="p-2 hover:bg-drive-dark rounded-full text-drive-muted hover:text-green-500 transition-colors"
              title="Restore"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={() => onBulkAction("delete")}
              className="p-2 hover:bg-drive-dark rounded-full text-drive-muted hover:text-red-500 transition-colors"
              title="Delete Forever"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
