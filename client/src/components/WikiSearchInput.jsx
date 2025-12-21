import { useState, useEffect, useRef } from "react";
import '../styles/WikiSearchInput.css';

export function WikiSearchInput({ placeholder, onSelect, disabled, value }) {
    const [query, setQuery] = useState(value || "");
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const isSelecting = useRef(false);

    useEffect(() => {
        setQuery(value || "");
    }, [value]);

    useEffect(() => {
        if (disabled || isSelecting.current) {
            isSelecting.current = false;
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            if (query.length < 2) {
                setSuggestions([]);
                setIsOpen(false);
                return;
            }

            try {
                const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&namespace=0&format=json&origin=*&redirects=resolve`;
                const response = await fetch(url);
                const data = await response.json();
                
                // data[1] contains the final titles (after redirects)
                setSuggestions(data[1] || []);
                setIsOpen(true);
            } catch (error) {
                console.error("Wiki search failed:", error);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query, disabled]);

    const handleClick = () => {
        if (disabled) return;
        setQuery("");
        onSelect("");
    };

    const handleSelect = (title) => {
        if (disabled) return;
        
        const normalizedTitle = title
            .trim()
            .replace(/_/g, ' ')
            .replace(/\s+/g, ' ');
        
        isSelecting.current = true;
        setQuery(normalizedTitle);
        setSuggestions([]);
        setIsOpen(false);
        
        onSelect(normalizedTitle);
    };

    return (
        <div className="wiki-search-container">
            <input
                type="text"
                placeholder={placeholder}
                value={query}
                disabled={disabled}
                onChange={(e) => setQuery(e.target.value)}
                onClick={handleClick}
                className="wiki-search-input"
            />
            {!disabled && isOpen && suggestions.length > 0 && (
                <ul className="wiki-search-suggestions">
                    {suggestions.map((title, index) => (
                        <li
                            key={index}
                            onClick={() => handleSelect(title)}
                            className="wiki-search-suggestion-item"
                        >
                            {title}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}