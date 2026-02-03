import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import toast from "react-hot-toast";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      toast.error("No token received");
      navigate("/login");
      return;
    }

    if (processed.current) return;
    processed.current = true;

    const fetchUser = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch user profile");

        const data = await response.json();
        login(token, data.user);
        toast.success("Successfully logged in!");
        navigate("/");
      } catch (err) {
        console.error(err);
        toast.error("Authentication failed");
        navigate("/login");
      }
    };

    fetchUser();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}
