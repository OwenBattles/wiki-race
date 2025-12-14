import { useState, useEffect } from "react";

// A reusable component for a single Wikipedia input
export function WikiSearchInput({ placeholder, onSelect }) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length < 2) {
                setSuggestions([]);
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
    }, [query]);

    const handleSelect = (title) => {
        setQuery(title);      // Fill the input
        setSuggestions([]);   // Clear list
        setIsOpen(false);     // Close dropdown
        onSelect(title);      // Notify parent
    };

    return (
        <div className="relative w-full mb-4">
            <input 
                className="w-full p-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="text" 
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            
            {/* Dropdown List */}
            {isOpen && suggestions.length > 0 && (
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