import { useState } from "react"

import { WikiSearchInput } from "./WikiSearchInput";

export function TitleEndpoints({ isHost, handleStartSelect, handleEndSelect }) {
    return (
        <div>
            <WikiSearchInput
                placeholder={"Starting Point"}
                onSelect={handleStartSelect}
                disabled={!isHost}
            />
            <WikiSearchInput 
                placeholder={"Ending Point"}
                onSelect={handleEndSelect}
                disabled={!isHost}
            />
        </div>   
    )
}