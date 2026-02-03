import { useState, useEffect } from "react";
import { X, FileText, Image as ImageIcon, Video, Music } from "lucide-react";
import { getStreamUrl, api } from "../api/client";

function formatSize(bytes) {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function FilePreviewModal({ file, onClose }) {
  const [signedUrl, setSignedUrl] = useState(null);
  const [videoError, setVideoError] = useState(false);
  const [textContent, setTextContent] = useState(null);

  useEffect(() => {
    if (!file) return;
    setVideoError(false);
    setTextContent(null);
    
    const isOffice = /\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(file.name);
    if (isOffice) {
      api(`/files/download/${file._id}`)
        .then((res) => setSignedUrl(res.url))
        .catch((err) => console.error("Failed to get signed URL", err));
    }

    const type = file.mimeType || "";
    if (
      type.startsWith("text/") || 
      type === "application/json" || 
      type === "application/javascript" ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".js") ||
      file.name.endsWith(".jsx") ||
      file.name.endsWith(".css") ||
      file.name.endsWith(".html")
    ) {
      fetch(getStreamUrl(file._id))
        .then(res => res.text())
        .then(text => setTextContent(text))
        .catch(err => console.error("Failed to load text", err));
    }
  }, [file]);

  if (!file) return null;

  const url = getStreamUrl(file._id);
  const type = file.mimeType || "";

  const renderContent = () => {
    if (type.startsWith("image/")) {
      return (
        <img
          src={url}
          alt={file.name}
          className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-sm"
        />
      );
    }
    if (type.startsWith("video/") && !videoError) {
      return (
        <video
          src={url}
          controls
          autoPlay
          className="max-w-full max-h-[75vh] rounded-lg shadow-sm"
          onError={() => setVideoError(true)}
        />
      );
    }
    if (type.startsWith("audio/")) {
      return (
        <div className="p-12 bg-white rounded-2xl shadow-sm flex flex-col items-center">
          <Music className="w-16 h-16 text-purple-500 mb-6" />
          <audio src={url} controls className="w-full min-w-[300px]" />
        </div>
      );
    }
    if (
      type.startsWith("text/") || 
      type === "application/json" || 
      type === "application/javascript" ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".js") ||
      file.name.endsWith(".jsx") ||
      file.name.endsWith(".css") ||
      file.name.endsWith(".html")
    ) {
       return (
         <div className="bg-white p-4 rounded-lg shadow-sm w-full h-[75vh] overflow-auto">
            <pre className="text-sm font-mono whitespace-pre-wrap break-words text-gray-800">
              {textContent || "Loading content..."}
            </pre>
         </div>
       );
    }
    if (type === "application/pdf") {
      return (
        <iframe
          src={url}
          className="w-full h-[75vh] rounded-lg shadow-sm bg-white"
          title={file.name}
        />
      );
    }

    // Google Docs Viewer for Office files
    const isOffice = /\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(file.name);
    if (isOffice && signedUrl) {
      const gViewUrl = `https://docs.google.com/gview?url=${encodeURIComponent(signedUrl)}&embedded=true`;
      return (
        <iframe
          src={gViewUrl}
          className="w-full h-[75vh] rounded-lg shadow-sm bg-white"
          title={file.name}
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        {videoError ? (
          <Video className="w-24 h-24 mb-6 opacity-20 text-red-500" />
        ) : (
          <FileText className="w-24 h-24 mb-6 opacity-20" />
        )}
        <p className="text-lg font-medium mb-2">
          {videoError ? "Video playback failed" : "Preview not available"}
        </p>
        <p className="text-sm mb-6">
          {videoError
            ? "This video format might not be supported by your browser."
            : "This file type cannot be previewed directly."}
        </p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          Download to view
        </a>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl bg-[#1e1e1e] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#252525]">
          <div className="flex items-center gap-4 text-white">
            <div className="p-2 bg-white/10 rounded-lg">
              {type.startsWith("image/") ? (
                <ImageIcon className="w-5 h-5" />
              ) : type.startsWith("video/") ? (
                <Video className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg truncate max-w-md">
                {file.name}
              </h3>
              <p className="text-xs text-gray-400">
                {formatSize(file.size)} • {type}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 p-6 flex items-center justify-center bg-[#1e1e1e] overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
