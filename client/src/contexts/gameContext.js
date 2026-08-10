import { createContext, useContext } from 'react';

// Kept separate from GameProvider.jsx so that file only exports components,
// which is what React Fast Refresh requires to hot-reload it.
export const GameContext = createContext(null);

export function useGame() {
    const context = useContext(GameContext);
    if (!context) throw new Error('useGame must be used inside a <GameProvider>');
    return context;
}
