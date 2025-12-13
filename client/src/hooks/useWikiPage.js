import { useState, useCallback } from 'react';

export function useWikiPage() {
    const [htmlContent, setHtmlContent] = useState("");
    const [currentTitle, setCurrentTitle] = useState("");
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
            setHtmlContent(data.content);
            setCurrentTitle(data.title);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { htmlContent, currentTitle, fetchPage, isLoading, error };
}