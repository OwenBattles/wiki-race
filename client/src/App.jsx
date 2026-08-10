import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './contexts/GameProvider';
import { NavigationBlocker } from './components/NavigationBlocker';
import { SessionGate } from './components/SessionGate';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';

function App() {
  return (
    <GameProvider> 
      <BrowserRouter>
        <NavigationBlocker />
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