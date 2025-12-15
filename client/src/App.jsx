import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './contexts/GameContext'; // Change this!
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';

function App() {
  return (
    <GameProvider> {/* Change this! */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game" element={<GamePage />} />
        </Routes>
      </BrowserRouter>
    </GameProvider> 
  )
}

export default App;