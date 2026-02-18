import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { GameSettingsProvider } from './contexts/GameSettingsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AdProvider } from './contexts/AdContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <GameSettingsProvider>
              <AdProvider>
                <App />
              </AdProvider>
            </GameSettingsProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);