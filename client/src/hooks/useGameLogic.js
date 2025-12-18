import { useContext } from "react";

import { GameContext } from "../contexts/GameContext";
import { SocketService } from "../services/socketService";
import { useWikiPage } from "./useWikiPage";

export function useGameLogic() {
    const { roomCode, powerUpsAllowed, gameSettings, currentPageTitle, fetchPage, isLoading, error, startTime } = useContext(GameContext);


    // will add this later most likely
    const handleCopyLink = () => {

    }

    const handleStartPoint = (pageTitle) => {
        SocketService.setStartPage(roomCode, pageTitle);
    }

    const handleEndPoint = (pageTitle) => {
        SocketService.setTargetPage(roomCode, pageTitle);
    }

    const handlePowerUpSettings = () => {
        SocketService.setPowerUpsAllowed(roomCode, !powerUpsAllowed)
    }

    const handlePowerUpChange = (powerUpType, value) => {
        SocketService.setPowerUp(roomCode, powerUpType, value);
    }

    const handleUsePowerUp = (powerUpType, victimId) => {
        console.log("using power up", powerUpType, victimId);
        SocketService.usePowerUp(roomCode, powerUpType, victimId);
    }

    const handleStartGame = () => {
        if (!(gameSettings.startPage && gameSettings.targetPage)) {
            alert("Enter a starting page and a target page")
            return;
        }
        SocketService.startGame(roomCode);
    }

    const handleChangePage = (pageTitle) => {
        console.log("changing page to", pageTitle);
        fetchPage(pageTitle);
        SocketService.submitMove(roomCode, pageTitle, Date.now() - startTime);
    }

    const handleSurrender = () => {
        console.log("surrendering");
    }

    const handleReturnToLobby = () => {
        SocketService.returnToLobby(roomCode);
    }

    return { 
        handleCopyLink,
        handleStartPoint,
        handleEndPoint,
        handlePowerUpSettings,
        handleStartGame,
        handleChangePage,
        handleSurrender,
        handleReturnToLobby,
        handlePowerUpChange,
        handleUsePowerUp,
    }
}