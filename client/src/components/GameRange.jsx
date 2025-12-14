import { WikiSearchInput } from "./WikiSearchInput";

export function GameRange({ setStart, setEnd }) {    
    return (
        <div className="flex flex-col gap-4 max-w-md mx-auto p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-bold text-gray-700 mb-2">Setup Race</h3>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Article</label>
                <WikiSearchInput 
                    placeholder="e.g. Batman" 
                    onSelect={setStart} 
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Article</label>
                <WikiSearchInput 
                    placeholder="e.g. Superman" 
                    onSelect={setEnd} 
                />
            </div>
        </div>
    );
}