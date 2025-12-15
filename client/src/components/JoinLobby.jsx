export function JoinLobby({ lobbyCode, checkLobbyCode, setLobbyCode, onJoin, disabled}) {
    const handleChange = (e) => {
        const value = e.target.value;
        setLobbyCode(value);
        checkLobbyCode(value);
    }

    return (
        <div>
            <input 
                className="border p-2 rounded"
                placeholder="Room Code"
                value={lobbyCode}
                onChange={handleChange}
            />
            <button 
                onClick={onJoin}
                disabled={disabled}
                className={`p-2 rounded text-white ${
                    disabled ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
            Join Lobby    
            </button>
        </div>
    )
}