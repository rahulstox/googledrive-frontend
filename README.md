# Drive Frontend

React frontend for the Drive (Google Drive–style) application.

## Features

- **Authentication**: Secure Login, Register (with email activation), Forgot/Reset Password.
- **Dashboard**:
  - **File Management**: Upload, Download, Rename, Delete (Soft/Permanent), Restore.
  - **Organization**: Nested Folders, Starred items, Trash bin.
  - **Visuals**: Grid/List views, Lazy-loaded thumbnails for images, Preview modal for media/docs.
  - **Drag-and-Drop**:
    - **Files**: Drag files anywhere to upload.
    - **Folders**: Drag folders (Chrome/Edge) to upload entire structures (nested folders are preserved).
- **UI/UX**:
  - Responsive Design (Tailwind CSS).
  - Dark/Light mode support.
  - Real-time progress bars for uploads.
  - Context Menus and Keyboard Shortcuts (Ctrl+A, Del, F2).

## Tech Stack

- **Framework**: React 18, Vite
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **State/Routing**: React Router DOM, Context API
- **Utilities**:
  - `react-dropzone` (File handling)
  - `react-hot-toast` (Notifications)
  - `axios` (API requests)

## Setup & Installation

1.  **Prerequisites**: Node.js (v16+) and the Backend server running.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Setup**:
    - The app connects to `/api` which is proxied to the backend in `vite.config.js`.
    - Ensure backend is running on `http://localhost:5000` (default).
4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Access at `http://localhost:5173`.

## Limitations

- **Folder Upload**:
  - **Drag-and-Drop**: Supported on modern browsers (Chrome, Edge) that support `webkitRelativePath` or Directory Entry API.
  - **File Picker**: The standard "Upload" button typically selects files. To select folders via dialog, browser support varies.
- **Large Files**: Uploads up to 5GB are supported (backend limit), but browser memory may constrain extremely large uploads on low-end devices.

## Build

To build for production:
```bash
npm run build
```
The output will be in the `dist` folder.
