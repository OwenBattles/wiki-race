import '../styles/GameOverView.css';

const formatTime = (ms) => {
    const totalSeconds = Math.floor((ms || 0) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// The round's result is a set of routes, and a route is a sequence — so it's set the way a
// book sets sequences: numbered, ruled down the margin, with leaders carrying the eye from
// each name to its count. This is the one place the design spends its ink.
export function GameOverView({ players, winner, onReturnToLobby, isHost, totalTime }) {
    const winnerName = winner?.username;
    const nobodyWon = !winnerName || winnerName === 'Nobody';

    // Longest route last: reading down the page goes from the sharpest run to the longest.
    const ordered = [...players].sort((a, b) => (a.path?.length ?? 0) - (b.path?.length ?? 0));

    return (
        <main className="over">
            <header className="over-head">
                <p className="over-kicker">{nobodyWon ? 'No winner' : 'Winner'}</p>
                <h1 className="over-name">{nobodyWon ? 'Nobody reached it' : winnerName}</h1>
                <p className="over-time">
                    <span className="over-time-label">in</span>
                    <span className="over-time-value">{formatTime(totalTime)}</span>
                </p>
            </header>

            <section className="over-routes">
                <h2 className="eyebrow">routes taken</h2>

                {ordered.map((player) => {
                    const path = player.path ?? [];
                    const won = !nobodyWon && player.username === winnerName;

                    return (
                        <article
                            key={player.id}
                            className={`route-card${won ? ' is-winner' : ''}`}
                        >
                            <h3 className="route-card-head">
                                <span className="route-card-name">{player.username}</span>
                                <span className="route-card-leader" aria-hidden="true" />
                                <span className="route-card-count">
                                    {path.length ? `${path.length - 1} links` : 'no moves'}
                                </span>
                            </h3>

                            {path.length > 0 ? (
                                <ol className="route-steps">
                                    {path.map((page, index) => (
                                        <li key={index} className="route-step">
                                            <span className="route-step-figure">{index + 1}</span>
                                            <span className="route-step-title">{page.title}</span>
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <p className="route-empty">Left before making a move.</p>
                            )}
                        </article>
                    );
                })}
            </section>

            <footer className="over-actions">
                {isHost ? (
                    <button className="btn btn--primary" onClick={onReturnToLobby}>
                        Back to the lobby
                    </button>
                ) : (
                    <p className="lobby-hint">Waiting for the host to set up the next round.</p>
                )}
            </footer>
        </main>
    )
}
