import { useGame } from "../contexts/gameContext";
import { SocketService } from "../services/socketService";

export function useGameLogic() {
    const { roomCode, gameSettings, fetchPage, startTime } = useGame();

    const handleStartPoint = (pageTitle) => {
        SocketService.setStartPage(roomCode, pageTitle);
    };

    const handleEndPoint = (pageTitle) => {
        SocketService.setTargetPage(roomCode, pageTitle);
    };

    const handlePowerUpChange = (powerUpType, value) => {
        SocketService.setPowerUp(roomCode, powerUpType, value);
    };

    const handleUsePowerUp = (powerUpType, victimId) => {
        SocketService.sendPowerUp(roomCode, powerUpType, victimId);
    };

    const handleStartGame = () => {
        if (!(gameSettings.startPage && gameSettings.targetPage)) {
            alert("Enter a starting page and a target page");
            return;
        }
        SocketService.startGame(roomCode);
    };

    const handleChangePage = async (pageTitle) => {
        try {
            // fetchPage returns the title *after* Wikipedia's redirects resolve. Report that
            // one, not the raw link text — otherwise reaching the target via a redirect
            // (e.g. an "America" link landing on "United States") never counted as a win.
            const canonicalTitle = await fetchPage(pageTitle);
            SocketService.submitMove(roomCode, canonicalTitle, Date.now() - startTime);
        } catch (err) {
            // fetchPage already logged and surfaced the failure; the loading state clears
            // in its finally block, so the player just stays on the current page.
            console.error("Failed to fetch page:", err);
        }
    };

    const handleSurrender = () => {
        const elapsedTime = startTime ? Date.now() - startTime : 0;
        SocketService.surrender(roomCode, elapsedTime);
    };

    const handleReturnToLobby = () => {
        SocketService.returnToLobby(roomCode);
    };

    return {
        handleStartPoint,
        handleEndPoint,
        handleStartGame,
        handleChangePage,
        handleSurrender,
        handleReturnToLobby,
        handlePowerUpChange,
        handleUsePowerUp,
    };
}
