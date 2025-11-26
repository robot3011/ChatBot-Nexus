import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Index redirects to appropriate page based on auth state
export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/chat");
    } else {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Show nothing while redirecting
  return null;
}
