# Krypton Drive - Frontend

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)

A modern, responsive, and feature-rich cloud storage interface built with React. This application replicates core Google Drive functionalities, offering a seamless user experience for file management, organization, and sharing.

## 📋 Table of Contents

- [About The Project](#about-the-project)
  - [Key Features](#key-features)
  - [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## 🚀 About The Project

Krypton Drive Frontend provides a polished user interface for interacting with the Krypton Drive cloud storage system. It focuses on intuitive drag-and-drop interactions, real-time feedback, and a clean aesthetic.

### Key Features

- **🔐 Secure Authentication**: Full registration and login flows with email activation and secure password reset.
- **📂 Smart Dashboard**: Grid and List views, breadcrumb navigation, and advanced filtering.
- **🖱️ Drag-and-Drop**: Seamless file and folder uploads directly from your desktop.
- **🖼️ Rich Previews**: Built-in previewers for images, videos, and documents.
- **🗑️ Trash Management**: Soft delete functionality with restore and permanent delete options.
- **⭐ Organization**: Star important files and manage nested folder structures.
- **🌗 Dark/Light Mode**: Fully responsive design with theme support.

### Built With

- [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
- [![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
- [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
- [![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)](https://axios-http.com/)

## 🏁 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Running instance of [Krypton Drive Backend](../googledrive-backend)

### Installation

1.  **Clone the repository**

    ```sh
    git clone https://github.com/rahulstox/googledrive-frontend.git
    cd googledrive-frontend
    ```

2.  **Install dependencies**

    ```sh
    npm install
    ```

3.  **Start the development server**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

### Environment Variables

The application relies on proxy configuration in `vite.config.js` to route API requests to the backend.
Ensure your backend is running on `http://localhost:5000` or update the proxy target in `vite.config.js`.

## 💡 Usage

- **Upload**: Drag files onto the dashboard or use the "New" button.
- **Context Menu**: Right-click any file or folder to access actions (Download, Rename, Trash, etc.).
- **Selection**: Ctrl+Click to select multiple items for bulk actions.

## 🗺️ Roadmap

- [x] Basic File Operations (Upload, Download, Delete)
- [x] Folder Structure
- [x] Authentication Flow
- [ ] Share/Collaborate on Files
- [ ] Public Share Links
- [ ] Offline Support

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📧 Contact

Rahul - [GitHub Profile](https://github.com/rahulstox)

Project Link: [https://github.com/rahulstox/googledrive-frontend](https://github.com/rahulstox/googledrive-frontend)
