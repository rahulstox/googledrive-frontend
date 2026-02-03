import React from "react";
import { X, FolderPlus } from "lucide-react";

export default function CreateFolderModal({
  isOpen,
  onClose,
  onSubmit,
  value,
  onChange,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-drive-card w-full max-w-md p-6 rounded-2xl shadow-xl transform transition-all scale-100 animate-in zoom-in-95 duration-200 border border-drive-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-drive-accent/10 rounded-xl">
              <FolderPlus className="w-6 h-6 text-drive-accent" />
            </div>
            <h2 className="text-xl font-bold text-drive-text">New Folder</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-drive-border rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-drive-muted" />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-drive-text mb-2">
              Folder Name
            </label>
            <input
              autoFocus
              type="text"
              value={value}
              onChange={onChange}
              placeholder="Untitled folder"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-drive-dark border border-drive-border rounded-xl text-drive-text focus:outline-none focus:ring-2 focus:ring-drive-accent focus:border-transparent transition-all"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-drive-muted font-medium hover:bg-gray-100 dark:hover:bg-drive-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="px-5 py-2.5 rounded-xl bg-drive-accent text-white font-medium hover:bg-drive-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
