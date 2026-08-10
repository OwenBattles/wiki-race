import '../styles/PlayerList.css';

// The lobby roster. Previously this was bare usernames, which left three useful facts
// invisible: who the host is (so you know who everyone is waiting on), which row is you,
// and who has dropped mid-reconnect.
//
// Tags are set as marginalia rather than bordered pills — a pill around a two-letter word
// carries more weight than the word does, and it kept the chip wider than the name.
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

                    const classes = [
                        'player-list-item',
                        isYou ? 'is-you' : '',
                        disconnected ? 'is-disconnected' : '',
                    ].filter(Boolean).join(' ');

                    return (
                        <li key={player.id} className={classes}>
                            <span className="player-list-name">{player.username}</span>

                            <span className="player-list-tags">
                                {player.isHost && (
                                    <span className="player-list-tag is-host">host</span>
                                )}
                                {isYou && <span className="player-list-tag">you</span>}
                                {player.wins > 0 && (
                                    <span className="player-list-tag player-list-wins">
                                        {player.wins} {player.wins === 1 ? 'win' : 'wins'}
                                    </span>
                                )}
                                {disconnected && (
                                    <span className="player-list-tag">reconnecting…</span>
                                )}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
