import { useState, useEffect } from 'react';
import { useWikiPage } from '../hooks/useWikiPage';

import { SetupView } from '../components/SetupView';
import { WikiView } from '../components/WikiView';
import { InGameHeader } from '../components/InGameHeader';

export default function GamePage() {
    const { htmlContent, currentTitle, fetchPage, isLoading } = useWikiPage();

    // Possible states: "SETUP", "PLAYING", "FINISHED"
    const [gameState, setGameState] = useState("SETUP");
    const [startingPoint, setStartingPoint] = useState("");
    const [endingPoint, setEndingPoint] = useState("")

    useEffect(() => {
        fetchPage("Avocado"); // Hardcoded start for now
    }, [fetchPage]);

    const handleStartGame = () => {
        setGameState("PLAYING");
    }

    return (
        <div>
            {gameState == "SETUP" &&
                <SetupView />
            }

            {gameState == "PLAYING" && 
                <div>
                    <InGameHeader currentTitle={currentTitle} target={"Target Page"} />
                    <WikiView
                        htmlContent={htmlContent} 
                        onNavigate={(title) => fetchPage(title)} 
                        isLoading={isLoading}
                    />
                </div>
            }
        </div> 
    );
}