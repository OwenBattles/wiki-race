import '../styles/PlayerList.css';

// Who is here, who is running the room, and who has dropped. Tags are set as marginalia
// rather than pills — quieter, and it keeps the chip the size of the name.
export function PlayerList({ players, myId }) {
    return (
        <section className="player-list">
            <h2 className="eyebrow">players · {players.length}</h2>

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
                                {player.isHost && <span className="player-list-tag--host">host</span>}
                                {isYou && <span>you</span>}
                                {player.wins > 0 && (
                                    <span className="player-list-wins">
                                        {player.wins}&nbsp;{player.wins === 1 ? 'win' : 'wins'}
                                    </span>
                                )}
                                {disconnected && <span>reconnecting</span>}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
