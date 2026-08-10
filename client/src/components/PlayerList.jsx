import '../styles/PlayerList.css';

// The lobby roster. Previously this was bare usernames, which left three useful facts
// invisible: who the host is (so you know who everyone is waiting on), which row is you,
// and who has dropped mid-reconnect.
export function PlayerList({ players, myId }) {
    return (
        <div className="player-list">
            <h2 className="player-list-heading">
                Players
                <span className="player-list-count">{players.length}</span>
            </h2>
            <ul className="player-list-items">
                {players.map((player) => {
                    const isYou = player.id === myId;
                    const disconnected = player.connected === false;

                    return (
                        <li
                            key={player.id}
                            className={`player-list-item${disconnected ? ' is-disconnected' : ''}`}
                        >
                            <span className="player-list-name">{player.username}</span>

                            <span className="player-list-tags">
                                {isYou && <span className="player-list-tag">you</span>}
                                {player.isHost && (
                                    <span className="player-list-tag is-host">host</span>
                                )}
                                {player.wins > 0 && (
                                    <span className="player-list-wins">
                                        {player.wins} {player.wins === 1 ? 'win' : 'wins'}
                                    </span>
                                )}
                                {disconnected && (
                                    <span className="player-list-status">reconnecting…</span>
                                )}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
