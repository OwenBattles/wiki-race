import { useEffect, useRef } from 'react';

import "../styles/WikiView.css"

export function WikiView({ htmlContent, onNavigate, isLoading, updateHistory }) {
    const containerRef = useRef(null);

    const handleClick = (e) => {
        const anchor = e.target.closest('a');
        if (!anchor || !anchor.getAttribute('href')) return;

        e.preventDefault(); 

        const href = anchor.getAttribute('href');
        if (href.startsWith('/wiki/')) {
            const title = decodeURIComponent(href.replace('/wiki/', ''));
            onNavigate(title);
        }
    };

    useEffect(() => {
        if (containerRef.current) containerRef.current.scrollTop = 0;
    }, [htmlContent]);

    if (isLoading) {
        return (
            <div>
                Loading next article...
            </div>
        );
    }

    return (
        <div 
            className="wiki-view-container p-6 bg-white overflow-y-auto" // Added the class here
            ref={containerRef}
            onClick={handleClick}
        >
             <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
    );
}