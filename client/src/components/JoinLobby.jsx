import '../styles/JoinLobby.css';

export function JoinLobby({ lobbyCode, checkLobbyCode, setLobbyCode, onJoin, disabled}) {
    const handleChange = (e) => {
        const value = e.target.value.toUpperCase();
        setLobbyCode(value);
        if (value.length === 5) {
            checkLobbyCode(value);
        }
    }

    return (
        <div className="join-lobby-container">
            <input 
                type="text"
                className="join-lobby-input"
                placeholder="Enter room code"
                value={lobbyCode}
                onChange={handleChange}
                maxLength="5"
            />
            <button 
                className="join-lobby-button"
                onClick={onJoin}
                disabled={disabled || !lobbyCode || lobbyCode.length !== 5}
            >
                Join Room
            </button>
        </div>
    );
}