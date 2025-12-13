import { useState } from "react"

import { Username } from "../components/Username"
import { JoinLobby } from "../components/JoinLobby"
import { CreateLobby } from "../components/createLobby"

export default function HomePage() {
    const [username, setUsername] = useState("")
    const [lobbyCode, setLobbyCode] = useState("")

    const handleJoinLobby = () => {
        if (!username) {
            alert("Please enter a Username")
            return
        }
        if (!lobbyCode) {
            alert("Please enter a Lobby Code")
            return
        }

        // handle joining lobby logic
        console.log("Joining Lobby!")
    }

    const handleCreateLobby = () => {
        if (!username) {
            alert("Please enter a Username")
            return
        }
        
        // handle lobby creation
        console.log("Creating Lobby!")
    }

    return (
        <div>
            <p1>Wiki-Race</p1>
            <Username value={username} onChange={setUsername} />
            <JoinLobby 
                lobbyCode={lobbyCode}
                setLobbyCode={setLobbyCode}
                onJoin={handleJoinLobby}
            />
            <CreateLobby onCreate={handleCreateLobby}/>
        </div> 
    )
}