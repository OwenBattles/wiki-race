import { useState } from "react"

import { WikiSearchInput } from "./WikiSearchInput";

export function TitleEndpoints({ isHost, handleStartSelect, handleEndSelect, gameData }) {
    return (
        <div>
            <WikiSearchInput
                value={gameData.startPage}
                placeholder={"Starting Point"}
                onSelect={handleStartSelect}
                disabled={!isHost}
            />
            <WikiSearchInput 
                value={gameData.targetPage}
                placeholder={"Ending Point"}
                onSelect={handleEndSelect}
                disabled={!isHost}
            />
        </div>   
    )
}