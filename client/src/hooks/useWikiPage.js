import { useState, useCallback } from 'react';

export function useWikiPage({ setPath }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchPage = useCallback(async (title) => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Backend automatically handles redirects with redirects: 1
            const res = await fetch(`http://localhost:3000/api/wiki/${encodeURIComponent(title)}`);
            
            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error("Page not found");
                }
                throw new Error("Failed to fetch page");
            }
            
            const data = await res.json();
            
            // data.title is the FINAL title after redirects (e.g., "United States" not "America")
            setPath(prev => [...prev, { 
                title: data.title,      
                html: data.content 
            }]);
            
            return data.title; 
            
        } catch (err) {
            console.error(err);
            setError(err.message);
            throw err; // Re-throw so caller knows it failed
        } finally {
            setIsLoading(false);
        }
    }, [setPath]);

    return { fetchPage, isLoading, error };
}