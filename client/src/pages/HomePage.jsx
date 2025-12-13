import { useState } from "react"
import { socket } from "../services/socket";
import { useNavigate } from 'react-router-dom';

import { Username } from "../components/Username"
import { JoinLobby } from "../components/JoinLobby"
import { CreateLobby } from "../components/createLobby"

export default function HomePage() {
    const [username, setUsername] = useState("")
    const [lobbyCode, setLobbyCode] = useState("")

    const navigate = useNavigate();

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
        socket.emit("join_room", lobbyCode);
        console.log(`Joined room: ${lobbyCode}`);
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
            <button onClick={() => navigate('/gamepage')}>Go to GamePage</button>
        </div> 
    )
}