import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './contexts/GameProvider';
import { ExitGuard } from './components/ExitGuard';
import { SessionGate } from './components/SessionGate';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';

function App() {
  return (
    <GameProvider> 
      <BrowserRouter>
        <ExitGuard />
        <SessionGate />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game" element={<GamePage />} />
        </Routes>
      </BrowserRouter>
    </GameProvider> 
  )
}

export default App;