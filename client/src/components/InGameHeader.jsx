export function InGameHeader( { targetPage, onSurrender, elapsedTime } ) {
    const formatTime = (ms) => {    
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div>
            <h1>Destination: {targetPage}</h1>
            <p>Time Elapsed: {formatTime(elapsedTime)}</p>
            <button onClick={onSurrender}>Surrender</button>
        </div>
    )
}