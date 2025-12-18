import { useState } from 'react';

export function PowerUpSettings({ isHost, powerUps, onPowerUpChange }) {
    const [isOpen, setIsOpen] = useState(false);

    console.log("power ups", powerUps);

    const handleIncrement = (powerUpType) => {
        console.log("incrementing", powerUpType);
        onPowerUpChange(powerUpType, powerUps[powerUpType] + 1);
    };

    const handleDecrement = (powerUpType) => {
        if (powerUps[powerUpType] <= 0) return;
        console.log("decrementing", powerUpType);
        onPowerUpChange(powerUpType, powerUps[powerUpType] - 1);
    };

    const totalPowerUps = Object.values(powerUps).reduce((sum, val) => sum + val, 0);

    if (!isHost) {
        return (
            <div>
                <button onClick={() => setIsOpen(!isOpen)}>Show PowerUp settings</button>
                {isOpen && (
                    <div>
                        <p>Swap: {powerUps.swap}</p>
                        <p>Scramble: {powerUps.scramble}</p>
                        <p>Freeze: {powerUps.freeze}</p>             
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
                PowerUps ({totalPowerUps}) {isOpen ? '▲' : '▼'}
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 min-w-[250px] z-10">
                    <div className="space-y-3">
                        {/* Swap PowerUp */}
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-700">Swap</span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleDecrement('swap')}
                                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center text-lg font-bold transition-colors"
                                    disabled={powerUps.swap === 0}
                                >
                                    −
                                </button>
                                <span className="w-8 text-center font-semibold">
                                    {powerUps.swap}
                                </span>
                                <button
                                    onClick={() => handleIncrement('swap')}
                                    className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-lg font-bold transition-colors"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Scramble PowerUp */}
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-700">Scramble</span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleDecrement('scramble')}
                                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center text-lg font-bold transition-colors"
                                    disabled={powerUps.scramble === 0}
                                >
                                    −
                                </button>
                                <span className="w-8 text-center font-semibold">
                                    {powerUps.scramble}
                                </span>
                                <button
                                    onClick={() => handleIncrement('scramble')}
                                    className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-lg font-bold transition-colors"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Freeze PowerUp */}
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-700">Freeze</span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleDecrement('freeze')}
                                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center text-lg font-bold transition-colors"
                                    disabled={powerUps.freeze === 0}
                                >
                                    −
                                </button>
                                <span className="w-8 text-center font-semibold">
                                    {powerUps.freeze}
                                </span>
                                <button
                                    onClick={() => handleIncrement('freeze')}
                                    className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-lg font-bold transition-colors"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Example usage:
function Example() {
    const [powerUps, setPowerUps] = useState({
        swap: 0,
        scramble: 0,
        freeze: 0
    });

    return (
        <div className="p-8">
            <PowerUpSettings
                isHost={true}
                powerUps={powerUps}
                onPowerUpChange={setPowerUps}
            />
        </div>
    );
}