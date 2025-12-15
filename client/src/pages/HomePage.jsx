import { useContext } from 'react';
import { GameContext } from '../contexts/GameContext';

import { useHomeLogic } from '../hooks/useHomeLogic'; 

import { UsernameInput } from "../components/UsernameInput";
import { JoinLobby } from "../components/JoinLobby";
import { CreateLobby } from "../components/CreateLobby"; 

export default function HomePage() {
    const {
        username, setUsername,
        roomCode, setRoomCode,
    } = useContext(GameContext);

    const { handleCreateRoom, handleJoinRoom, error } = useHomeLogic();

    return (
        <div>
            <h1>Wiki-Race</h1>
            
            {error && <p className="text-red-500">{error}</p>}

            <UsernameInput value={username} onChange={setUsername} />
            
            <JoinLobby 
                lobbyCode={roomCode}
                setLobbyCode={setRoomCode}
                onJoin={(code) => handleJoinRoom(code, username)}
            />
            
            <CreateLobby onCreate={() => handleCreateRoom(username)}/>
        </div> 
    );
}