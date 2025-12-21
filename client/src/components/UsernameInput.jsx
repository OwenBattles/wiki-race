import '../styles/UsernameInput.css';

export function UsernameInput({ value, onChange }) {
    return (
        <div className="username-input-container">
            <input 
                type="text"
                className="username-input"
                placeholder="Enter your username"
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
            />
        </div>
    );
}