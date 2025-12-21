import { useState, useEffect } from 'react';
import '../styles/Typewriter.css';

export function Typewriter({ text, speed = 100, onComplete }) {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showCursor, setShowCursor] = useState(true);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, speed);

            return () => clearTimeout(timeout);
        } else if (onComplete && currentIndex === text.length) {
            onComplete();
        }
    }, [currentIndex, text, speed, onComplete]);

    // Blinking cursor effect
    useEffect(() => {
        const cursorInterval = setInterval(() => {
            setShowCursor(prev => !prev);
        }, 530);

        return () => clearInterval(cursorInterval);
    }, []);

    return (
        <>
            {displayedText}
            {currentIndex < text.length && showCursor && <span className="typewriter-cursor">|</span>}
        </>
    );
}

