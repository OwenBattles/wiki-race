export function PowerUpSettings({ powerUpsAllowed }) {
    return (
        <div>
            {powerUpsAllowed ?
            <button>Turn Off PowerUps</button> :
            <button>Turn On Powerups</button>
        }
        </div>    
    )
}