import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function NavigationBlocker() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.history.pushState(null, "", location.pathname);

    const block = () => {
      navigate(1);
    };

    window.addEventListener("popstate", block);
    return () => window.removeEventListener("popstate", block);
  }, [location, navigate]);

  return null;
}
