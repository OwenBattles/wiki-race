import '../styles/CreateLobby.css';

export function CreateLobby({ onCreate, disabled }) {
    return (
        <button 
            className="create-lobby-button"
            onClick={onCreate}
            disabled={disabled}
        >
            Create New Room
        </button>
    );
}