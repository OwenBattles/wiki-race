import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './contexts/GameContext'; // Change this!
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';

function App() {
  useEffect(() => {
    const disableNavigation = (e) => {
      window.history.pushState(null, '', window.location.href);
    };
  
    window.history.pushState(null, '', window.location.href);
    
    window.addEventListener('popstate', disableNavigation);
  
    return () => {
      window.removeEventListener('popstate', disableNavigation);
    };
  }, []);
  
  return (
    <GameProvider> 
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