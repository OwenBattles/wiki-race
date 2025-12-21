import '../styles/GameOverView.css';

export function GameOverView({ players, winner, onReturnToLobby, isHost, totalTime }) {
    const formatTime = (ms) => {    
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="game-over-container">
            <div className="game-over-content">
                <div className="game-over-header">
                    <h1 className="game-over-title">Game Over</h1>
                    <div className="game-over-winner">
                        <span className="game-over-winner-label">Winner:</span>
                        <span className="game-over-winner-name">{winner.username}</span>
                    </div>
                    <div className="game-over-time">
                        <span className="game-over-time-label">Time Elapsed:</span>
                        <span className="game-over-time-value">{formatTime(totalTime)}</span>
                    </div>
                </div>

                <div className="game-over-players">
                    {players.map((player) => (
                        <div key={player.id} className="game-over-player-card">
                            <div className="game-over-player-header">
                                <span className="game-over-player-name">
                                    {player.username}
                                </span>
                                {player.isHost && (
                                    <span className="game-over-player-host">(Host)</span>
                                )}
                            </div>
                            <div className="game-over-player-path">
                                <div className="game-over-path-label">Path:</div>
                                {player.path && player.path.length > 0 ? (
                                    <ol className="game-over-path-list">
                                        {player.path.map((page, index) => (
                                            <li key={index} className="game-over-path-item">
                                                {page.title}
                                            </li>
                                        ))}
                                    </ol>
                                ) : (
                                    <div className="game-over-path-empty">No pages visited yet</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="game-over-actions">
                    {isHost ? (
                        <button className="game-over-return-button" onClick={onReturnToLobby}>
                            Return to Lobby
                        </button>
                    ) : (
                        <p className="game-over-waiting">Waiting for Host...</p>
                    )}
                </div>
            </div>
        </div>   
    )
}