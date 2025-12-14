export function Username({ value, setUsername, checkUsername }) {
    const handleUsernameChange = (e) => {
        const newUsername = e.target.value;
        setUsername(newUsername);
        // checkUsername(newUsername);
    }
    return (
        <input 
            placeholder="Enter a Username"
            value={value} 
            onChange={handleUsernameChange} 
        ></input>
    )
}