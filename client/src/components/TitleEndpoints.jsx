import { useState } from "react"

import { WikiSearchInput } from "./WikiSearchInput";
import '../styles/TitleEndpoints.css';

export function TitleEndpoints({ isHost, handleStartSelect, handleEndSelect, gameSettings }) {
    return (
        <div className="title-endpoints-container">
            <WikiSearchInput
                value={gameSettings.startPage}
                placeholder={"Starting Point"}
                onSelect={handleStartSelect}
                disabled={!isHost}
            />
            <WikiSearchInput 
                value={gameSettings.targetPage}
                placeholder={"Ending Point"}
                onSelect={handleEndSelect}
                disabled={!isHost}
            />
        </div>   
    )
}