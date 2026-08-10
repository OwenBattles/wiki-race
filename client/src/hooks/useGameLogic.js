import { useGame } from "../contexts/gameContext";
import { SocketService } from "../services/socketService";

export function useGameLogic() {
    const { roomCode, gameSettings, fetchPage } = useGame();

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
        // Optimistic: render the new page immediately and let the server confirm. If it
        // rejects the move, the 'move_rejected' handler rewinds the path.
        try {
            await fetchPage(pageTitle);
            SocketService.submitMove(roomCode, pageTitle);
        } catch (err) {
            // fetchPage already logged and surfaced the failure; the loading state clears
            // in its finally block, so the player just stays on the current page.
            console.error("Failed to fetch page:", err);
        }
    };

    const handleSurrender = () => {
        SocketService.surrender(roomCode);
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
