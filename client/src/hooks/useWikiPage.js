import { useState, useCallback } from 'react';


export function useWikiPage({ setPath }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchPage = useCallback(async (title) => {
        setIsLoading(true);
        setError(null);
        try {
            // Replace with your actual backend URL
            const res = await fetch(`http://localhost:3000/api/wiki/${title}`);
            if (!res.ok) throw new Error("Failed to fetch page");
            
            const data = await res.json();
            setPath(prev => [...prev, { title: data.title, html: data.content }]);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { fetchPage, isLoading, error };
}