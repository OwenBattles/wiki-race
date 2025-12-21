import '../styles/CreateLobby.css';

export function CreateLobby({ onCreate }) {
    return (
        <button 
            className="create-lobby-button"
            onClick={onCreate}
        >
            Create New Room
        </button>
    );
}