import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function RefreshRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // If user refreshed on anything other than "/"
    if (location.pathname !== "/") {
      navigate("/", { replace: true });
    }
  }, []); // run once on load

  return null;
}
