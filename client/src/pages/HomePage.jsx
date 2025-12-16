import { useState, useContext } from 'react';
import { GameContext } from '../contexts/GameContext';

import { useHomeLogic } from '../hooks/useHomeLogic'; 

import { UsernameInput } from "../components/UsernameInput";
import { JoinLobby } from "../components/JoinLobby";
import { CreateLobby } from "../components/CreateLobby"; 

export default function HomePage() {
    const [usernameInput, setUsernameInput] = useState("");

    const {
        roomCode, setRoomCode,
        validRoomCode
    } = useContext(GameContext);

    const { handleCreateRoom, handleFindRoom, handleJoinRoom, error } = useHomeLogic();

    // Should refactor these handlers to use the useHomeLogic hook

    const handleJoin = () => {
        if (!usernameInput) {
            alert("Enter a Username");
            return;
        }
        handleJoinRoom(roomCode, usernameInput);
    }

    const handleCreate = () => {
        if (!usernameInput) {
            alert("Enter a Username");
            return;
        }
        handleCreateRoom(usernameInput);
    }

    return (
        <div>
            <h1>Wiki-Race</h1>
            
            {error && <p className="text-red-500">{error}</p>}

            <UsernameInput value={usernameInput} onChange={setUsernameInput} />
            
            <JoinLobby 
                lobbyCode={roomCode}
                checkLobbyCode={handleFindRoom}
                setLobbyCode={setRoomCode}
                onJoin={handleJoin}
                disabled={!validRoomCode}
            />
            
            <CreateLobby onCreate={handleCreate}/>
        </div> 
    );
}