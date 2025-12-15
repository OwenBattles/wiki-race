import { useContext } from "react"
import { GameContext } from "../contexts/GameContext"

export function useGameLogic() {
    const { } = useContext(GameContext);
    const { htmlContent, currentTitle, fetchPage, isLoading } = useWikiPage();

    // will add this later most likely
    const handleCopyLink = () => {

    }

    const handleStartPoint = (pageTitle) => {

    }

    const handleEndPoint = (pageTitle) => {

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