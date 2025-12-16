import { useState, useEffect } from "react";

export function WikiSearchInput({ placeholder, onSelect, disabled, value }) {
    const [query, setQuery] = useState(value || "");
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setQuery(value || "");
    }, [value]);

    useEffect(() => {
        if (disabled) return; 
        
        const delayDebounceFn = setTimeout(async () => {
            if (query.length < 2) {
                setSuggestions([]);
                setIsOpen(false);
                return;
            }
            
            try {
                const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${query}&limit=5&namespace=0&format=json&origin=*`;
                const response = await fetch(url);
                const data = await response.json();
                setSuggestions(data[1] || []);
                setIsOpen(true);
            } catch (error) {
                console.error("Wiki search failed:", error);
            }
        }, 500);
        
        return () => clearTimeout(delayDebounceFn);
    }, [query, disabled]);

    const handleClick = () => {
        if (disabled) return; // Don't clear if disabled
        setQuery("");
        onSelect("");
    };

    const handleSelect = (title) => {
        if (disabled) return;
        setQuery(title);
        setSuggestions([]);
        setIsOpen(false);
        onSelect(title);
    };

    return (
        <div className="relative w-full mb-4">
            <input
                type="text"
                placeholder={placeholder}
                value={query}  
                disabled={disabled}
                onChange={(e) => setQuery(e.target.value)}
                onClick={handleClick}
                className={`w-full p-3 border rounded shadow-sm focus:outline-none focus:ring-2
                    ${disabled
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-white focus:ring-blue-500"
                    }
                `}
            />
            {!disabled && isOpen && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-b shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((title, index) => (
                        <li
                            key={index}
                            onClick={() => handleSelect(title)}
                            className="p-3 hover:bg-blue-50 cursor-pointer transition-colors border-b last:border-b-0"
                        >
                            {title}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}