# Drive Frontend

React frontend for the Drive (Google Drive–style) application: auth flows, 3D-style dashboard, drag-and-drop upload, and file/folder management.

## Features

- **Auth**: Login, register (with email activation), forgot password, reset password, activation page.
- **Dashboard**: List files and folders with timestamps; create folder; drag-and-drop upload; download; delete. 3D-style layout and theme.
- **UI**: Tailwind CSS, Outfit + JetBrains Mono, react-hot-toast for messages.

## Tech

- React 18, Vite
- React Router, react-dropzone, react-hot-toast, lucide-react
- Tailwind CSS

## Setup

1. Ensure backend is running (e.g. `http://localhost:5000`). Vite proxy forwards `/api` to backend when using `npm run dev`.
2. `npm install`
3. `npm run dev` — frontend at `http://localhost:5173`
4. For production: set backend URL if needed (e.g. env `VITE_API_URL`) and `npm run build`; host `dist`.

## Repo

Preferred GitHub repo name: `googledrive-frontend`  
URL format: `https://github.com/username/googledrive-frontend`
