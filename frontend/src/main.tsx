import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from '@/App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@context/index';
import { UIFeedbackProvider } from '@context/UIFeedbackContext';
import { ThemeProvider } from '@context/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Google Client ID from environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <UIFeedbackProvider>
              <App />
            </UIFeedbackProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>
);

