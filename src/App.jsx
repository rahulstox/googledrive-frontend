import { lazy, Suspense, Component } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/useAuth";

const Layout = lazy(() => import("./components/Layout"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Activate = lazy(() => import("./pages/Activate"));
const CheckEmail = lazy(() => import("./pages/CheckEmail"));
const OAuthCallback = lazy(() => import("./pages/OAuthCallback"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-drive-dark">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-10 w-10 border-2 border-drive-accent border-t-transparent rounded-full animate-spin"
          aria-hidden
        />
        <span className="text-sm text-drive-muted">Loading...</span>
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
        <div className="min-h-screen flex items-center justify-center bg-drive-dark p-4">
          <div className="text-center text-drive-text max-w-md">
            <p className="text-lg font-medium mb-2">Something went wrong</p>
            <p className="text-drive-muted text-sm mb-4">
              Try refreshing the page or log in again.
            </p>
            <a href="/" className="text-drive-accent hover:underline">
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
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/activate" element={<Activate />} />
          <Route path="/check-email" element={<CheckEmail />} />
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
            <Route path="starred" element={<Dashboard />} />
            <Route path="trash" element={<Dashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}
