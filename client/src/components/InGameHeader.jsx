import { Timer } from './Timer';

export function InGameHeader( { targetPage, onSurrender } ) {
    return (
        <div>
            <h1>Destination: {targetPage}</h1>
            <Timer />
            <button onClick={onSurrender}>Surrender</button>
        </div>
    )
}