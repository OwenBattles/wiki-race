export function InGameHeader( { targetPage, onSurrender } ) {
    return (
        <div>
            <h1>Destination: {targetPage}</h1>
            <button onClick={onSurrender}>Surrender</button>
        </div>
    )
}