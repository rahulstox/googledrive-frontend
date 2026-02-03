import React, { useState } from "react";
import {
  File as FileIcon,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  Folder,
  Star,
} from "lucide-react";
import { getStreamUrl } from "../api/client";

const FileTypeIcon = ({ mimeType, className }) => {
  if (!mimeType) return <FileIcon className={className} />;
  if (mimeType.includes("pdf"))
    return <FileText className={`${className} text-red-500`} />;
  if (mimeType.includes("image"))
    return <ImageIcon className={`${className} text-purple-500`} />;
  if (mimeType.includes("video"))
    return <Video className={`${className} text-pink-500`} />;
  if (mimeType.includes("audio"))
    return <Music className={`${className} text-yellow-500`} />;
  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("text")
  )
    return <FileText className={`${className} text-blue-500`} />;
  return <FileIcon className={className} />;
};

export default function FileThumbnail({ item, isTrashView, onPreview }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isImage = item.mimeType?.startsWith("image/") && !imageError;

  const handleImageClick = (e) => {
    // Only stop propagation and preview if it's an image
    if (isImage && onPreview) {
      e.stopPropagation();
      onPreview(item);
    }
  };

  return (
    <div
      className={`w-10 h-10 rounded-xl bg-drive-dark flex items-center justify-center text-drive-muted flex-shrink-0 relative overflow-hidden ${
        isImage ? "cursor-pointer group/thumb" : ""
      }`}
      onClick={handleImageClick}
      title={isImage ? "Click to preview" : ""}
    >
      {item.type === "folder" ? (
        <Folder className="w-5 h-5 text-blue-500 fill-current" />
      ) : isImage ? (
        <>
          <img
            src={getStreamUrl(item._id)}
            alt={item.name}
            loading="lazy"
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/10 transition-colors" />
        </>
      ) : (
        <FileTypeIcon mimeType={item.mimeType} className="w-5 h-5" />
      )}

      {item.isStarred && !isTrashView && (
        <div className="absolute -top-1 -right-1 z-10">
          <Star className="w-3 h-3 text-yellow-400 fill-current drop-shadow-md" />
        </div>
      )}
    </div>
  );
}
