import { useContext } from "react";

import { GameContext } from "../contexts/GameContext";
import { SocketService } from "../services/socketService";
import { useWikiPage } from "./useWikiPage";

export function useGameLogic() {
    const { roomCode, setPowerUpsAllowed, gameData, setGameData } = useContext(GameContext);
    const { htmlContent, currentTitle, fetchPage, isLoading } = useWikiPage();

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
        setPowerUpsAllowed((prev) => !prev);
    }

    const handleStartGame = () => {
        if (!(gameData.startPage && gameData.endPage)) {
            alert("Enter a starting page and an ending page")
            return;
        }
        SocketService.startGame(roomCode, gameData.startPage, gameData.targetPage);
    }

    const handleChangePage = () => {

    }

    const handleSurrender = () => {

    }

    return { 
        handleCopyLink,
        handleStartPoint,
        handleEndPoint,
        handlePowerUpSettings,
        handleStartGame,
        handleChangePage,
        handleSurrender,
    }
}