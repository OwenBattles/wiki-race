import { useState } from "react"

import { WikiSearchInput } from "./WikiSearchInput";

export function TitleEndpoints({ isHost, handleStartSelect, handleEndSelect, gameSettings }) {
    return (
        <div>
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