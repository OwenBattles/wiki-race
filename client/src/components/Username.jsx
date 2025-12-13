export function Username({ value, onChange }) {
    return (
        <input 
            placeholder="Enter a Username"
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
        ></input>
    )
}