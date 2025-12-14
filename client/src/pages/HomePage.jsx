import { useState, useEffect } from "react"
import { socket } from "../services/socket";
import { useNavigate } from 'react-router-dom';

import { Username } from "../components/Username"
import { JoinLobby } from "../components/JoinLobby"
import { CreateLobby } from "../components/createLobby"

export default function HomePage() {
    const [username, setUsername] = useState("");
    const [lobbyCode, setLobbyCode] = useState("");
    const [validLobbyCode, setValidLobbyCode] = useState(false);
    const [validUsername, setValidUsername] = useState(false);

    const canJoinLobby = validLobbyCode; // && validUsername;

    const navigate = useNavigate();

    useEffect(() => {
        // Listen for successful creation
        socket.on('room_created', (lobbyCode) => {
             navigate('/game', { state: { username: username, lobbyCode: lobbyCode, initHostStatus: true } });
        });

        // Listen for successful join
        socket.on('join_success', (lobbyCode) => {
             navigate('/game', { state: { username: username, lobbyCode: lobbyCode, initHostStatus: false } });
        });

        // Listen for valid lobby code
        socket.on('lobby_check_result', ({ found, message }) => {
            if (found) {
                setValidLobbyCode(true);
                console.log(message); // "Lobby found"
            } else {
                setValidLobbyCode(false);
                console.log(message); // "Lobby not found"
            }
        });

        // Listen for unique username
        socket.on('check_username', ({ found, message}) => {
            if (!found) {
                setValidUsername(true);
            } else {
                setValidUsername(false);
            }
        });

        // Listen for errors 
        socket.on('error', (msg) => {
            alert(msg); // Or show a nice toast notification
        });

        return () => {
            socket.off('room_created');
            socket.off('join_success');
            socket.off('lobby_check_result');
            socket.off('check_username');
            socket.off('error');
        };
    }, [navigate]);

    const handleCreate = () => {
        if (!username) {
            alert("Enter a Username");
            return;
        } 
        socket.emit('create_room', { username: username });
    };

    const handleJoin = () => {
        if (!username) alert("Enter a Username");
        socket.emit('join_lobby', { lobbyCode: lobbyCode, username: username});
    };

    const checkLobby = (newLobbyCode) => {
        socket.emit('find_lobby', newLobbyCode);
    }

    return (
        <div>
            <p1>Wiki-Race</p1>
            <Username value={username} setUsername={setUsername}/>
            <JoinLobby 
                lobbyCode={lobbyCode}
                setLobbyCode={setLobbyCode}
                checkLobbyCode={checkLobby}
                onJoin={handleJoin}
                isValidLobbyCode={canJoinLobby}
            />
            <CreateLobby onCreate={handleCreate}/>
        </div> 
    )
}