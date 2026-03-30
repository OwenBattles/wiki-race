import '../styles/SurrenderedLobbyView.css';

export function SurrenderedLobbyView({ roomCode, players, gameSettings }) {
    return (
        <div className="surrendered-lobby">
            <div className="surrendered-lobby__header">
                <h1 className="surrendered-lobby__title">Room: {roomCode}</h1>
                <p className="surrendered-lobby__subtitle">
                    You surrendered. You’ll stay here until someone reaches{' '}
                    <span className="surrendered-lobby__dest">{gameSettings.targetPage}</span>.
                </p>
            </div>

            <div className="surrendered-lobby__card">
                <div className="surrendered-lobby__meta">
                    <div className="surrendered-lobby__meta-row">
                        <span className="surrendered-lobby__meta-label">Start</span>
                        <span className="surrendered-lobby__meta-value">{gameSettings.startPage}</span>
                    </div>
                    <div className="surrendered-lobby__meta-row">
                        <span className="surrendered-lobby__meta-label">Destination</span>
                        <span className="surrendered-lobby__meta-value">{gameSettings.targetPage}</span>
                    </div>
                </div>

                <h2 className="surrendered-lobby__players-title">Players</h2>
                <ul className="surrendered-lobby__players">
                    {players.map((p) => (
                        <li key={p.id} className="surrendered-lobby__player">
                            <span className="surrendered-lobby__player-name">{p.username}</span>
                            <span className="surrendered-lobby__player-status">
                                {p.isPlaying ? 'Racing' : 'In lobby'}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

