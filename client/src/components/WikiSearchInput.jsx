import { useState, useEffect, useRef, useCallback } from "react";
import '../styles/WikiSearchInput.css';

// Plain button rows. These used to fade and slide in one by one on a stagger, which meant
// the list you were waiting for arrived slower than it had to and items moved under the
// pointer as you reached for them.
const SuggestionItem = ({ children, index, onMouseEnter, onClick, isSelected }) => (
    <button
        type="button"
        data-index={index}
        onMouseEnter={onMouseEnter}
        onClick={onClick}
        className={`wiki-search-suggestion-item ${isSelected ? 'selected' : ''}`}
        style={{ display: 'block', width: '100%', textAlign: 'left', border: 0, background: 'none' }}
    >
        {children}
    </button>
);

export function WikiSearchInput({ placeholder, onSelect, disabled, value, showDie = false, onDieClick }) {
    const [query, setQuery] = useState(value || "");
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [topGradientOpacity, setTopGradientOpacity] = useState(0);
    const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);
    const isSelecting = useRef(false);
    const listRef = useRef(null);
    // Set when the selection moved via arrow keys, so the scroll effect below knows to
    // follow it. A ref rather than state: it must not itself trigger a render.
    const keyboardNav = useRef(false);

    // Re-sync when the parent pushes a new value (e.g. the host's pick arriving over the
    // socket). Adjusting state during render is React's recommended alternative to an
    // effect here — it avoids the extra render pass an effect would cause.
    const [prevValue, setPrevValue] = useState(value);
    if (value !== prevValue) {
        setPrevValue(value);
        setQuery(value || "");
    }

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
                // prefixsearch only returns titles of real mainspace pages whose titles
                // start with the query — never a bogus "partial word" that is not an article.
                const url =
                    'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*' +
                    '&list=prefixsearch&psnamespace=0' +
                    `&pssearch=${encodeURIComponent(query)}&pslimit=10`;
                const response = await fetch(url);
                const data = await response.json();
                const list = data.query?.prefixsearch ?? [];
                const titles = list.map((p) => p.title);

                setSuggestions(titles);
                setIsOpen(titles.length > 0);
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
        keyboardNav.current = false;
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
                keyboardNav.current = true;
                setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                keyboardNav.current = true;
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
        if (!keyboardNav.current || selectedIndex < 0 || !listRef.current) return;
        keyboardNav.current = false;

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
    }, [selectedIndex]);

    return (
        <div className="wiki-search-container">
            {showDie && (
                <button
                    type="button"
                    className="wiki-search-die"
                    aria-label="Roll a random page"
                    onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (disabled) return;
                        if (!onDieClick) return;
                        try {
                            const title = await onDieClick();
                            if (title) handleSelect(title);
                        } catch (err) {
                            console.error("Die roll failed:", err);
                        }
                    }}
                    disabled={disabled}
                >
                    <svg
                        className="wiki-search-die__icon"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                    >
                        <rect x="3.5" y="3.5" width="17" height="17" rx="3" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="8" cy="8" r="1.4" fill="currentColor" />
                        <circle cx="16" cy="16" r="1.4" fill="currentColor" />
                        <circle cx="16" cy="8" r="1.4" fill="currentColor" />
                        <circle cx="8" cy="16" r="1.4" fill="currentColor" />
                        <circle cx="12" cy="12" r="1.4" fill="currentColor" />
                    </svg>
                </button>
            )}
            <input
                type="text"
                placeholder={placeholder}
                value={query}
                disabled={disabled}
                onChange={(e) => setQuery(e.target.value)}
                onClick={handleClick}
                className={`wiki-search-input ${showDie ? "wiki-search-input--with-die" : ""}`}
            />
            {!disabled && isOpen && suggestions.length > 0 && (
                <div className="wiki-search-suggestions-container">
                    <div 
                        ref={listRef} 
                        className="wiki-search-suggestions-list"
                        onScroll={handleScroll}
                    >
                        {suggestions.map((title, index) => (
                            <SuggestionItem
                                key={title}
                                index={index}
                                onMouseEnter={() => handleItemMouseEnter(index)}
                                onClick={() => handleSelect(title)}
                                isSelected={selectedIndex === index}
                            >
                                {title}
                            </SuggestionItem>
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