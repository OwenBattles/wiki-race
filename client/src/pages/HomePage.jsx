import { useState } from 'react';
import { useGame } from '../contexts/gameContext';
import { useHomeLogic } from '../hooks/useHomeLogic';

import { Notice } from "../components/Notice";
import '../styles/HomePage.css';

export default function HomePage() {
    const [usernameInput, setUsernameInput] = useState("");
    const [codeInput, setCodeInput] = useState("");

    const { validRoomCode, notice, sessionStatus } = useGame();
    const { handleCreateRoom, handleFindRoom, handleJoinRoom, error, setError } = useHomeLogic();

    const busy = sessionStatus === 'pending';
    const message = error || notice?.message;

    const handleCodeChange = (value) => {
        const code = value.toUpperCase().slice(0, 5);
        setCodeInput(code);
        if (code.length === 5) handleFindRoom(code);
    };

    const requireName = () => {
        if (usernameInput.trim()) return true;
        setError("Enter a name so the others know who you are.");
        return false;
    };

    const onJoin = (e) => {
        e.preventDefault();
        if (!requireName()) return;
        handleJoinRoom(codeInput, usernameInput.trim());
    };

    const onCreate = () => {
        if (!requireName()) return;
        handleCreateRoom(usernameInput.trim());
    };

    return (
        <main className="home">
            <div className="home-sheet">
                <header className="home-masthead">
                    <h1 className="home-title">Wiki&nbsp;Race</h1>
                    <p className="home-standfirst">
                        Start on one Wikipedia article and reach another. Only the links
                        inside the page will get you there.
                    </p>
                </header>

                <div className="home-controls">
                    {message && <Notice>{message}</Notice>}

                    <div className="home-field">
                        <label className="home-label" htmlFor="username">Your name</label>
                        <input
                            id="username"
                            className="field"
                            type="text"
                            placeholder="Everyone in the room sees this"
                            value={usernameInput}
                            maxLength={20}
                            autoComplete="off"
                            onChange={(e) => setUsernameInput(e.target.value)}
                        />
                    </div>

                    <form className="home-field" onSubmit={onJoin}>
                        <label className="home-label" htmlFor="roomcode">Room code</label>
                        <div className="home-join-row">
                            <input
                                id="roomcode"
                                className="field home-code"
                                type="text"
                                placeholder="5 characters"
                                value={codeInput}
                                maxLength={5}
                                autoComplete="off"
                                autoCapitalize="characters"
                                spellCheck="false"
                                onChange={(e) => handleCodeChange(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="btn btn--primary"
                                disabled={!validRoomCode || codeInput.length !== 5 || busy}
                            >
                                Join
                            </button>
                        </div>
                    </form>

                    <div className="home-or"><span>or</span></div>

                    <button
                        type="button"
                        className="btn btn--block"
                        onClick={onCreate}
                        disabled={busy}
                    >
                        Start a new room
                    </button>
                </div>
            </div>
        </main>
    );
}
