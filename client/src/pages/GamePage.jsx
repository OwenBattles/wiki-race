import { useEffect } from 'react';
import { useWikiPage } from '../hooks/useWikiPage';
import { WikiView } from '../components/WikiView';

export default function GamePage() {
    const { htmlContent, currentTitle, fetchPage, isLoading } = useWikiPage();

    useEffect(() => {
        fetchPage("Avocado"); // Hardcoded start for now
    }, [fetchPage]);

    return (
        <div >
            <div >
                <h2 >Current: {currentTitle}</h2>
                <div >Target: The Moon</div>
            </div>

            <WikiView
                htmlContent={htmlContent} 
                onNavigate={(title) => fetchPage(title)} 
                isLoading={isLoading}
            />
        </div>
    );
}