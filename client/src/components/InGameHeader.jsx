import { useState, useEffect, useRef } from 'react';
import { Timer } from './Timer';
import '../styles/InGameHeader.css';

// Only the power-ups the server actually implements. Freeze exists in the data model but
// has no behaviour behind it, so offering it would be a dead button.
const POWER_UPS = [
    { key: 'swap', label: 'Swap', description: 'Trade places with an opponent' },
    { key: 'scramble', label: 'Scramble', description: 'Fling an opponent to a random article' },
];

export function InGameHeader({ targetPage, onSurrender, myId, players, inventory, handleUsePowerUp }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    // Which power-up is chosen and waiting for a target.
    const [armedPowerUp, setArmedPowerUp] = useState(null);
    const dropdownRef = useRef(null);
    const headerRef = useRef(null);

    // Publish the header's real height instead of hard-coding it.
    //
    // The article is offset by --ingame-header-height. That was a fixed 88px, overridden to
    // 72px on mobile — but the mobile header stacks into two rows and actually renders
    // nearer 90px, so the top of every article sat hidden underneath it. A destination title
    // long enough to wrap would break the desktop value the same way. Measuring removes the
    // guess entirely.
    useEffect(() => {
        const el = headerRef.current;
        if (!el) return;

        const publishHeight = () => {
            const { height } = el.getBoundingClientRect();
            document.documentElement.style.setProperty(
                '--ingame-header-height',
                `${Math.round(height)}px`
            );
        };

        publishHeight();
        const observer = new ResizeObserver(publishHeight);
        observer.observe(el);

        return () => {
            observer.disconnect();
            // Back to the stylesheet's value, so the next screen isn't offset by a stale one.
            document.documentElement.style.removeProperty('--ingame-header-height');
        };
    }, []);

    const close = () => {
        setIsDropdownOpen(false);
        setArmedPowerUp(null);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
                setArmedPowerUp(null);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    // Matched on id rather than username: names are unique per room now, but identity that
    // depends on display text breaks quietly the moment that assumption slips.
    // Only racers can be targeted — the server rejects power-ups aimed at anyone who has
    // surrendered or joined mid-round, so don't offer them as options.
    const opponents = players.filter(player => player.id !== myId && player.isPlaying);
    const owned = POWER_UPS.filter(({ key }) => (inventory?.[key] ?? 0) > 0);
    const totalOwned = owned.reduce((sum, { key }) => sum + inventory[key], 0);

    const fire = (powerUpKey, victimId) => {
        handleUsePowerUp(powerUpKey, victimId);
        close();
    };

    // Choosing the power-up comes first, then the target — the reverse of how you think
    // about it reads backwards. With a single opponent there is no choice to make, so
    // picking the power-up fires it immediately.
    const choosePowerUp = (powerUpKey) => {
        if (opponents.length === 1) {
            fire(powerUpKey, opponents[0].id);
            return;
        }
        setArmedPowerUp(powerUpKey);
    };

    const armed = POWER_UPS.find(p => p.key === armedPowerUp);
    const soleOpponent = opponents.length === 1 ? opponents[0] : null;

    return (
        <div className="ingame-header" ref={headerRef}>
            <div className="ingame-header-left">
                <h1 className="ingame-header-destination">
                    <span className="ingame-header-destination-label">Destination:</span>
                    {targetPage}
                </h1>
                <div className="ingame-header-timer">
                    <Timer />
                </div>
            </div>
            <div className="ingame-header-right">
                {opponents.length > 0 && owned.length > 0 && (
                    <div className="ingame-header-powerups-container" ref={dropdownRef}>
                        <button
                            className="ingame-header-powerups-button"
                            onClick={() => (isDropdownOpen ? close() : setIsDropdownOpen(true))}
                            aria-expanded={isDropdownOpen}
                        >
                            Power-Ups
                            <span className="ingame-header-powerups-badge">{totalOwned}</span>
                        </button>

                        {isDropdownOpen && (
                            <div className="ingame-header-powerups-dropdown">
                                {!armed && (
                                    <>
                                        <h3 className="ingame-header-powerups-title">Your power-ups</h3>
                                        <ul className="ingame-header-powerups-list">
                                            {owned.map(({ key, label, description }) => (
                                                <li key={key}>
                                                    <button
                                                        className="ingame-header-powerup-card"
                                                        onClick={() => choosePowerUp(key)}
                                                    >
                                                        <span className="ingame-header-powerup-heading">
                                                            <span className="ingame-header-powerup-name">{label}</span>
                                                            <span className="ingame-header-powerup-count">×{inventory[key]}</span>
                                                        </span>
                                                        <span className="ingame-header-powerup-description">
                                                            {soleOpponent
                                                                ? `${description.replace('an opponent', soleOpponent.username)}`
                                                                : description}
                                                        </span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}

                                {armed && (
                                    <>
                                        <h3 className="ingame-header-powerups-title">
                                            Use {armed.label} on…
                                        </h3>
                                        <ul className="ingame-header-powerups-list">
                                            {opponents.map((player) => (
                                                <li key={player.id}>
                                                    <button
                                                        className="ingame-header-powerup-target"
                                                        onClick={() => fire(armed.key, player.id)}
                                                    >
                                                        {player.username}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            className="ingame-header-powerups-back"
                                            onClick={() => setArmedPowerUp(null)}
                                        >
                                            ← Back
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
                <button className="ingame-header-surrender" onClick={onSurrender}>
                    Surrender
                </button>
            </div>
        </div>
    )
}
