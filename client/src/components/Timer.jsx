// Timer.jsx
import { useContext, useEffect, useState } from 'react';
import { GameContext } from '../contexts/GameContext';

export function Timer() {
    const { startTime, gameState, finalTime } = useContext(GameContext);
    const [displayTime, setDisplayTime] = useState(0);

    useEffect(() => {
        if (!startTime || gameState !== "PLAYING") return;
        
        const interval = setInterval(() => {
            setDisplayTime(Date.now() - startTime);
        }, 10);
        
        return () => clearInterval(interval);
    }, [startTime, gameState]);

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Show final time if game is finished, otherwise show live timer
    const timeToShow = gameState === "FINISHED" ? finalTime : displayTime;

    return (
        <div className="text-2xl font-mono font-bold">
            {formatTime(timeToShow)}
        </div>
    );
}