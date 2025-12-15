import { useContext } from "react";

import { GameContext } from "../contexts/GameContext";
import { useWikiPage } from "./useWikiPage";

export function useGameLogic() {
    const { gameData, setGameData } = useContext(GameContext);
    const { htmlContent, currentTitle, fetchPage, isLoading } = useWikiPage();

    // will add this later most likely
    const handleCopyLink = () => {

    }

    const handleStartPoint = (pageTitle) => {
        console.log(`start ${pageTitle}`)
        setGameData(prev => ({
            ...prev,
            startPage: pageTitle
        }));
    }

    const handleEndPoint = (pageTitle) => {
        setGameData(prev => ({
            ...prev,
            targetPage: pageTitle
        }));
    }

    const handleTogglePowerUps = () => {

    }

    const handleStartGame = () => {

    }

    const handleChangePage = () => {

    }

    const handleSurrender = () => {

    }

    return { 
        handleCopyLink,
        handleStartPoint,
        handleEndPoint,
        handleTogglePowerUps,
        handleStartGame,
        handleChangePage,
        handleSurrender,
    }
}