import { WikiSearchInput } from "./WikiSearchInput";
import '../styles/TitleEndpoints.css';

// The two endpoints are the two ends of one journey, so they're drawn as one: a marker,
// a connecting rule, a second marker. Presenting them as two identical stacked fields
// said nothing about how they relate.
export function TitleEndpoints({ isHost, handleStartSelect, handleEndSelect, gameSettings }) {
    const fetchRandomTitle = async () => {
        const apiUrl = (
            import.meta.env.VITE_API_URL ||
            (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
        ).replace(/\/$/, '');

        const res = await fetch(`${apiUrl}/api/wiki/random`);
        if (!res.ok) throw new Error('Failed to fetch random article');
        const data = await res.json();
        return data.title;
    };

    return (
        <section className="route">
            <h2 className="eyebrow">the route</h2>

            <div className="route-legs">
                <div className="route-leg route-leg--first">
                    <span className="route-rail" aria-hidden="true">
                        <span className="route-marker route-marker--start" />
                    </span>
                    <div className="route-leg-body">
                        <span className="route-leg-label">Start</span>
                        <WikiSearchInput
                            value={gameSettings.startPage}
                            placeholder={isHost ? "Search for an article" : "Waiting for the host"}
                            onSelect={handleStartSelect}
                            showDie={true}
                            onDieClick={fetchRandomTitle}
                            disabled={!isHost}
                        />
                    </div>
                </div>

                <div className="route-leg route-leg--last">
                    <span className="route-rail" aria-hidden="true">
                        <span className="route-marker route-marker--end" />
                    </span>
                    <div className="route-leg-body">
                        <span className="route-leg-label">Destination</span>
                        <WikiSearchInput
                            value={gameSettings.targetPage}
                            placeholder={isHost ? "Search for an article" : "Waiting for the host"}
                            onSelect={handleEndSelect}
                            showDie={true}
                            onDieClick={fetchRandomTitle}
                            disabled={!isHost}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}
