import { useState, useContext, useEffect } from 'react';
import { GameContext } from '../contexts/GameContext';
import { useHomeLogic } from '../hooks/useHomeLogic'; 

import { UsernameInput } from "../components/UsernameInput";
import { JoinLobby } from "../components/JoinLobby";
import { CreateLobby } from "../components/CreateLobby";
import { Typewriter } from "../components/Typewriter";
import '../styles/HomePage.css';

export default function HomePage() {
    const [usernameInput, setUsernameInput] = useState("");

    const {
        roomCode, setRoomCode,
        validRoomCode
    } = useContext(GameContext);

    const { handleCreateRoom, handleFindRoom, handleJoinRoom, error } = useHomeLogic();

    // Lock page scrolling
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

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
                        {error && (
                            <div className="home-error">
                                <p className="home-error-text">{error}</p>
                            </div>
                        )}

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