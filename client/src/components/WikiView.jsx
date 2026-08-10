import { useEffect, useRef } from 'react';

import "../styles/WikiView.css"
import "../styles/LoadingAnimation.css"

export function WikiView({ htmlContent, onNavigate, isLoading }) {
    const containerRef = useRef(null);

    const handleClick = (e) => {
        const anchor = e.target.closest('a');
        if (!anchor || !anchor.getAttribute('href')) return;

        const href = anchor.getAttribute('href');
        // Allow in-page navigation (e.g. Table of Contents)
        if (href.startsWith('#')) return;

        e.preventDefault();
        if (href.startsWith('/wiki/')) {
            const title = decodeURIComponent(href.replace('/wiki/', '')).trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
            onNavigate(title);
        }
    };

    useEffect(() => {
        if (containerRef.current) containerRef.current.scrollTop = 0;
        window.scrollTo({ top: 0 });
    }, [htmlContent]);

    return (
        <div className="wiki-view-wrapper">
            {/* A loading bar rather than a blank pane: swapping the whole article out on
                every click made each move feel like a page reload. The current article
                stays put and dims slightly until the next one arrives. */}
            {isLoading && (
                <div className="wiki-loading-bar" role="status" aria-label="Loading next article">
                    <div className="wiki-loading-bar-fill" />
                </div>
            )}
            <div className="wiki-view-frame">
                <div
                    className={`wiki-view-container${isLoading ? ' is-loading' : ''}`}
                    ref={containerRef}
                    onClick={handleClick}
                >
                    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </div>
            </div>
        </div>
    );
}
