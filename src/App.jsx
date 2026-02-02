import { lazy, Suspense, Component } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/useAuth";

const Layout = lazy(() => import("./components/Layout"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Activate = lazy(() => import("./pages/Activate"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

function PageLoader() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#0a0a0c]"
      style={{ background: "#0a0a0c" }}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-10 w-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin"
          aria-hidden
        />
        <span className="text-sm text-[#71717a]" style={{ color: "#71717a" }}>
          Loading...
        </span>
      </div>
    </div>
  );
}

class RouteErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] p-4">
          <div className="text-center text-white max-w-md">
            <p className="text-lg font-medium mb-2">Something went wrong</p>
            <p className="text-[#71717a] text-sm mb-4">
              Try refreshing the page or log in again.
            </p>
            <a href="/" className="text-[#6366f1] hover:underline">
              Go to home
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function PrivateRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (token) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnly>
                <Login />
              </PublicOnly>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnly>
                <Register />
              </PublicOnly>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicOnly>
                <ForgotPassword />
              </PublicOnly>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <PublicOnly>
                <ResetPassword />
              </PublicOnly>
            }
          />
          <Route path="/activate/:token" element={<Activate />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="folder/:folderId" element={<Dashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}
