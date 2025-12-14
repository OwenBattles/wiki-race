import { useState } from 'react';

export function useWikiPage(setHtmlContent, setCurrentTitle) {
    const [isLoading, setIsLoading] = useState(false);

    const fetchPage = async (title) => {
        setIsLoading(true);
        try {
            // Replace with your actual backend URL
            const res = await fetch(`http://localhost:3000/api/wiki/${title}`);
            if (!res.ok) throw new Error("Failed to fetch page");
            
            const data = await res.json();
            
            setHtmlContent(data.content); // Updates the Parent's state
            setCurrentTitle(data.title);  // Updates the Parent's state
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return { fetchPage, isLoading };
}