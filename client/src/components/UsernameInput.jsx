export function UsernameInput({ value, onChange }) {
    return (
        <input 
            placeholder="Enter a Username"
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
        ></input>
    )
}