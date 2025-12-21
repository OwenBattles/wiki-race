import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useInView } from "motion/react";
import '../styles/WikiSearchInput.css';

const AnimatedSuggestionItem = ({ children, delay = 0, index, onMouseEnter, onClick, isSelected }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { amount: 0.5, triggerOnce: false });
    
    return (
        <motion.div
            ref={ref}
            data-index={index}
            onMouseEnter={onMouseEnter}
            onClick={onClick}
            initial={{ opacity: 0, y: -10 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.2, delay }}
            style={{ marginBottom: '0.5rem', cursor: 'pointer' }}
        >
            <div className={`wiki-search-suggestion-item ${isSelected ? 'selected' : ''}`}>
                {children}
            </div>
        </motion.div>
    );
};

export function WikiSearchInput({ placeholder, onSelect, disabled, value }) {
    const [query, setQuery] = useState(value || "");
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [keyboardNav, setKeyboardNav] = useState(false);
    const [topGradientOpacity, setTopGradientOpacity] = useState(0);
    const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);
    const isSelecting = useRef(false);
    const listRef = useRef(null);

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
                setSelectedIndex(-1);
                return;
            }

            try {
                const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&namespace=0&format=json&origin=*&redirects=resolve`;
                const response = await fetch(url);
                const data = await response.json();
                
                // data[1] contains the final titles (after redirects)
                setSuggestions(data[1] || []);
                setIsOpen(true);
                setSelectedIndex(-1);
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

    const handleSelect = useCallback((title) => {
        if (disabled) return;
        
        const normalizedTitle = title
            .trim()
            .replace(/_/g, ' ')
            .replace(/\s+/g, ' ');
        
        isSelecting.current = true;
        setQuery(normalizedTitle);
        setSuggestions([]);
        setIsOpen(false);
        setSelectedIndex(-1);
        
        onSelect(normalizedTitle);
    }, [disabled, onSelect]);

    const handleItemMouseEnter = useCallback((index) => {
        setSelectedIndex(index);
        setKeyboardNav(false);
    }, []);

    const handleScroll = useCallback((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        setTopGradientOpacity(Math.min(scrollTop / 50, 1));
        const bottomDistance = scrollHeight - (scrollTop + clientHeight);
        setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1));
    }, []);

    useEffect(() => {
        if (disabled || !isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setKeyboardNav(true);
                setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setKeyboardNav(true);
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    e.preventDefault();
                    handleSelect(suggestions[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                setIsOpen(false);
                setSelectedIndex(-1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, suggestions, selectedIndex, disabled, handleSelect]);

    useEffect(() => {
        if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;
        
        const container = listRef.current;
        const selectedItem = container.querySelector(`[data-index="${selectedIndex}"]`);
        
        if (selectedItem) {
            const extraMargin = 20;
            const containerScrollTop = container.scrollTop;
            const containerHeight = container.clientHeight;
            const itemTop = selectedItem.offsetTop;
            const itemBottom = itemTop + selectedItem.offsetHeight;
            
            if (itemTop < containerScrollTop + extraMargin) {
                container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
            } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
                container.scrollTo({
                    top: itemBottom - containerHeight + extraMargin,
                    behavior: 'smooth'
                });
            }
        }
        
        setKeyboardNav(false);
    }, [selectedIndex, keyboardNav]);

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
                <div className="wiki-search-suggestions-container">
                    <div 
                        ref={listRef} 
                        className="wiki-search-suggestions-list"
                        onScroll={handleScroll}
                    >
                        {suggestions.map((title, index) => (
                            <AnimatedSuggestionItem
                                key={index}
                                delay={index * 0.05}
                                index={index}
                                onMouseEnter={() => handleItemMouseEnter(index)}
                                onClick={() => handleSelect(title)}
                                isSelected={selectedIndex === index}
                            >
                                {title}
                            </AnimatedSuggestionItem>
                        ))}
                    </div>
                    <div 
                        className="wiki-search-top-gradient" 
                        style={{ opacity: topGradientOpacity }}
                    ></div>
                    <div 
                        className="wiki-search-bottom-gradient" 
                        style={{ opacity: bottomGradientOpacity }}
                    ></div>
                </div>
            )}
        </div>
    );
}