import { useContext } from "react";

import { GameContext } from "../contexts/GameContext";
import { SocketService } from "../services/socketService";
import { useWikiPage } from "./useWikiPage";

export function useGameLogic() {
    const { roomCode, setPowerUpsAllowed, gameData } = useContext(GameContext);
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
        console.log("in useGameLogic, ", gameData.startPage, "=>", gameData.targetPage)
        if (!(gameData.startPage && gameData.targetPage)) {
            alert("Enter a starting page and a target page")
            return;
        }
        SocketService.startGame(roomCode, gameData.startPage, gameData.targetPage); // todo: add start page and target page to the backend
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