// Timer.jsx
import { useEffect, useState } from 'react';
import { useGame } from '../contexts/gameContext';

export function Timer() {
    const { startTime, gameState, totalTime } = useGame();
    const [displayTime, setDisplayTime] = useState(0);

    useEffect(() => {
        if (!startTime || gameState !== "PLAYING") return;

        const interval = setInterval(() => {
            setDisplayTime(Date.now() - startTime);
        }, 100);

        return () => clearInterval(interval);
    }, [startTime, gameState]);

    const formatTime = (ms) => {
        const totalSeconds = Math.floor((ms || 0) / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Freeze on the winner's time once the round is over, otherwise tick live.
    const timeToShow = gameState === "FINISHED" ? totalTime : displayTime;

    return (
        <span>
            {formatTime(timeToShow)}
        </span>
    );
}
