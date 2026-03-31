import { useState } from "react"

import { WikiSearchInput } from "./WikiSearchInput";
import '../styles/TitleEndpoints.css';

export function TitleEndpoints({ isHost, handleStartSelect, handleEndSelect, gameSettings }) {
    const fetchRandomTitle = async () => {
        const apiUrl = (
            import.meta.env.VITE_API_URL ||
            (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
        ).replace(/\/$/, '');

        const res = await fetch(`${apiUrl}/api/wiki/random`);
        if (!res.ok) throw new Error('Failed to fetch random article');
        const data = await res.json();
        return data.title;
    };

    return (
        <div className="title-endpoints-container">
            <WikiSearchInput
                value={gameSettings.startPage}
                placeholder={"Starting Point"}
                onSelect={handleStartSelect}
                showDie={true}
                onDieClick={fetchRandomTitle}
                disabled={!isHost}
            />
            <WikiSearchInput 
                value={gameSettings.targetPage}
                placeholder={"Ending Point"}
                onSelect={handleEndSelect}
                showDie={true}
                onDieClick={fetchRandomTitle}
                disabled={!isHost}
            />
        </div>   
    )
}