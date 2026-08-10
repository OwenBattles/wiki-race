import { useState } from 'react';
import { useGame } from '../contexts/gameContext';
import { useHomeLogic } from '../hooks/useHomeLogic';

import { UsernameInput } from "../components/UsernameInput";
import { JoinLobby } from "../components/JoinLobby";
import { CreateLobby } from "../components/CreateLobby";
import { Typewriter } from "../components/Typewriter";
import { Notice } from "../components/Notice";
import '../styles/HomePage.css';

export default function HomePage() {
    const [usernameInput, setUsernameInput] = useState("");

    const { roomCode, setRoomCode, validRoomCode } = useGame();

    const { handleCreateRoom, handleFindRoom, handleJoinRoom, error, setError } = useHomeLogic();

    const handleJoin = () => {
        if (!usernameInput) {
            setError("Enter a username to continue.");
            return;
        }
        handleJoinRoom(roomCode, usernameInput);
    }

    const handleCreate = () => {
        if (!usernameInput) {
            setError("Enter a username to continue.");
            return;
        }
        handleCreateRoom(usernameInput);
    }

    return (
        <div className="home-page">
            <div className="home-container">
                {/* Header */}
                <div className="home-header">
                    <h1 className="home-title">
                        <Typewriter text="Wiki Race" speed={120} />
                    </h1>
                    <p className="home-subtitle">Navigate from one Wikipedia page to another</p>
                </div>

                {/* Main Card */}
                <div className="home-card">
                    <div className="home-card-content">
                        {/* Error Message */}
                        {error && <Notice>{error}</Notice>}

                        {/* Username Input */}
                        <UsernameInput value={usernameInput} onChange={setUsernameInput} />
                        
                        {/* Join Lobby */}
                        <JoinLobby 
                            lobbyCode={roomCode}
                            checkLobbyCode={handleFindRoom}
                            setLobbyCode={setRoomCode}
                            onJoin={handleJoin}
                            disabled={!validRoomCode}
                        />
                        
                        {/* Divider */}
                        <div className="home-divider">
                            <div className="home-divider-line"></div>
                            <span className="home-divider-text">or</span>
                        </div>
                        
                        {/* Create Lobby */}
                        <CreateLobby onCreate={handleCreate}/>
                    </div>
                </div>
            </div>
        </div> 
    );
}