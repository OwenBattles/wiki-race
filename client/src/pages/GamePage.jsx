import { useEffect, useContext, use } from 'react';
import { GameContext } from '../contexts/GameContext';
import { useWikiPage } from '../hooks/useWikiPage';
import { WikiView } from '../components/WikiView';

export default function GamePage() {
    const { htmlContent, currentTitle, fetchPage, isLoading } = useWikiPage();
    const { roomCode } = useContext(GameContext);

    return (
        <div >
            <h1>{roomCode}</h1>
        </div>
    );
}