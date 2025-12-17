import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './contexts/GameContext'; 
import { NavigationBlocker } from './components/NavigationBlocker';
import { RefreshRedirect } from './components/RefreshRedirect';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';

function App() {
  return (
    <GameProvider> 
      <BrowserRouter>
        <NavigationBlocker />
        <RefreshRedirect />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game" element={<GamePage />} />
        </Routes>
      </BrowserRouter>
    </GameProvider> 
  )
}

export default App;