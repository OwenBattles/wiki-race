import { useContext } from "react";

import { GameContext } from "../contexts/GameContext";
import { SocketService } from "../services/socketService";
import { useWikiPage } from "./useWikiPage";

export function useGameLogic() {
    const { roomCode, setPowerUpsAllowed, gameSettings } = useContext(GameContext);

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
        if (!(gameSettings.startPage && gameSettings.targetPage)) {
            alert("Enter a starting page and a target page")
            return;
        }
        SocketService.startGame(roomCode, gameSettings.startPage, gameSettings.targetPage); // todo: add start page and target page to the backend
    }

    const handleChangePage = (pageTitle, href) => {
        console.log("handleChangePage", pageTitle, href);
        SocketService.submitMove(roomCode, pageTitle, href);
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