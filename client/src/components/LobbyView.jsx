import { TitleEndpoints } from "./TitleEndpoints";
import { PowerUpSettings } from "./PowerUpSettings";
import { PlayerList } from "./PlayerList";
import '../styles/LobbyView.css';

export function LobbyView({ isHost, players, myId, handleStartSelect, handleEndSelect, gameSettings, onStart, handlePowerUpChange, powerUps }) {
    const ready = Boolean(gameSettings.startPage && gameSettings.targetPage);
    const alone = players.length < 2;

    return (
        <div className="lobby">
            <TitleEndpoints
                isHost={isHost}
                handleStartSelect={handleStartSelect}
                handleEndSelect={handleEndSelect}
                gameSettings={gameSettings}
            />

            {!alone && (
                <PowerUpSettings
                    isHost={isHost}
                    powerUps={powerUps}
                    onPowerUpChange={handlePowerUpChange}
                />
            )}

            <PlayerList players={players} myId={myId} />

            <footer className="lobby-launch">
                {isHost ? (
                    <>
                        <button
                            className="btn btn--primary btn--block"
                            onClick={onStart}
                            disabled={!ready}
                        >
                            Start the race
                        </button>
                        {/* Says what is missing rather than just disabling the button. */}
                        {!ready && (
                            <p className="lobby-hint">Pick a start and a destination first.</p>
                        )}
                        {ready && alone && (
                            <p className="lobby-hint">Share the room code to race someone.</p>
                        )}
                    </>
                ) : (
                    <p className="lobby-hint lobby-hint--waiting">
                        Waiting for the host to start the race.
                    </p>
                )}
            </footer>
        </div>
    )
}
