import { useEffect, useRef } from 'react';

import "../styles/WikiView.css"
import "../styles/LoadingAnimation.css"

export function WikiView({ htmlContent, onNavigate, isLoading }) {
    const containerRef = useRef(null);

    const handleClick = (e) => {
        console.log("handleClick");
        const anchor = e.target.closest('a');
        if (!anchor || !anchor.getAttribute('href')) return;

        e.preventDefault(); 

        const href = anchor.getAttribute('href');
        if (href.startsWith('/wiki/')) {
            const title = decodeURIComponent(href.replace('/wiki/', '')).trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
            onNavigate(title);
        }
    };

    useEffect(() => {
        if (containerRef.current) containerRef.current.scrollTop = 0;
    }, [htmlContent]);

    if (isLoading) {
        return (
            <div className="wiki-loading-container">
                <div className="loading-content">
                    <p className="loading-text">Loading next article...</p>
                    <div className="loading-dots">
                        <div className="loading-dot"></div>
                        <div className="loading-dot"></div>
                        <div className="loading-dot"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="wiki-view-wrapper">
            <div className="wiki-view-frame">
                <div 
                    className="wiki-view-container"
                    ref={containerRef}
                    onClick={handleClick}
                >
                    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </div>
            </div>
        </div>
    );
}