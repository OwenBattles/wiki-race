import { PlayerList } from './PlayerList';
import '../styles/SurrenderedLobbyView.css';

// Where you wait out a round you've left. It states what happens next rather than just
// reporting what you did.
export function SurrenderedLobbyView({ players, myId, gameSettings }) {
    return (
        <div className="surrendered-lobby">
            <header className="surrendered-lobby__header">
                <h1 className="surrendered-lobby__title">You gave up</h1>
                <p className="surrendered-lobby__subtitle">
                    The round carries on without you until someone reaches{' '}
                    <span className="surrendered-lobby__dest">{gameSettings.targetPage}</span>.
                </p>
            </header>

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

            <PlayerList players={players} myId={myId} />
        </div>
    );
}
