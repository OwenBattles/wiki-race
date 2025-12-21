import { Timer } from './Timer';
import '../styles/InGameHeader.css';

export function InGameHeader( { targetPage, onSurrender } ) {
    return (
        <div className="ingame-header">
            <div className="ingame-header-left">
                <h1 className="ingame-header-destination">
                    <span className="ingame-header-destination-label">Destination:</span>
                    {targetPage}
                </h1>
                <div className="ingame-header-timer">
                    <Timer />
                </div>
            </div>
            <button className="ingame-header-surrender" onClick={onSurrender}>
                Surrender
            </button>
        </div>
    )
}