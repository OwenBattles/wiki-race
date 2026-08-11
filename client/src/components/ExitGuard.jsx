import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useGame } from "../contexts/gameContext";
import { ConfirmDialog } from "./ConfirmDialog";

// Handles every way out of a room, so they all behave the same.
//
// This replaces NavigationBlocker, which listened for popstate and called navigate(1) —
// it simply undid the back button, with no explanation and no alternative. Leaving was
// impossible short of closing the tab.
//
// Back is now honoured, just not silently: because a stray swipe or a mis-aimed tap looks
// exactly like a deliberate exit, it asks first. Confirming leaves the room properly
// (the seat is freed, the session cleared) rather than stranding a ghost player behind.
export function ExitGuard() {
  const { sessionStatus, gameState, leaveRequested, requestLeave, cancelLeave, leaveRoom } = useGame();
  const location = useLocation();

  const inRoom = sessionStatus === 'active' && location.pathname === '/game';

  useEffect(() => {
    if (!inRoom) return;

    // A spare entry to absorb the first Back press. Without it, Back would leave the site
    // entirely and there would be nothing to intercept.
    window.history.pushState({ wikiRaceGuard: true }, "");
    let lastHash = window.location.hash;

    const onPopState = () => {
      // Clicking a link in an article's contents list is a fragment navigation, and Chrome
      // fires popstate for those too. Treating every popstate as a back-press meant the
      // contents list asked you whether you wanted to leave the race.
      //
      // A changed hash means the fragment moved, not that anyone tried to leave. Back out of
      // a fragment jump then reads as undoing the jump, which is what it should do; only a
      // traversal that leaves the hash alone is an attempt to leave the room.
      if (window.location.hash !== lastHash) {
        lastHash = window.location.hash;
        return;
      }

      // Put the entry back so the page stays put while the question is on screen, then ask.
      window.history.pushState({ wikiRaceGuard: true }, "");
      requestLeave();
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [inRoom, requestLeave]);

  // Closing the tab mid-race is worth a browser-level warning, but only mid-race —
  // prompting on every page in the room would be noise.
  useEffect(() => {
    if (!inRoom || gameState !== 'PLAYING') return;

    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [inRoom, gameState]);

  const racing = gameState === 'PLAYING';

  return (
    <ConfirmDialog
      open={Boolean(leaveRequested)}
      title={racing ? "Leave the race?" : "Leave this room?"}
      body={
        racing
          ? "You'll drop out of the round and give up your place. The others keep racing."
          : "You'll go back to the start and need the room code to come back."
      }
      confirmLabel="Leave room"
      cancelLabel={racing ? "Keep racing" : "Stay"}
      onConfirm={leaveRoom}
      onCancel={cancelLeave}
    />
  );
}
