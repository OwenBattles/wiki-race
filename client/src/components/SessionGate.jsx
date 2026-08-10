import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGame } from "../contexts/gameContext";

// Keeps the URL and the session in agreement.
//
// This replaces the old RefreshRedirect, which sent any hard load of /game straight back to
// "/" — that was the whole reason refreshing mid-race lost you the game. Now a reload with a
// stored seat waits for the rejoin handshake and stays put; only a load with no reclaimable
// seat goes home.
export function SessionGate() {
  const { sessionStatus } = useGame();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Still handshaking — deciding now would race the answer.
    if (sessionStatus === 'pending') return;

    if (sessionStatus === 'active' && location.pathname !== '/game') {
      navigate('/game', { replace: true });
      return;
    }

    if (sessionStatus === 'none' && location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  }, [sessionStatus, location.pathname, navigate]);

  return null;
}
