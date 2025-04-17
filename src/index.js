// src/index.js - Revised Example
import React from 'react';
import ReactDOM from 'react-dom/client';
import ReactGA from 'react-ga4';
import './index.css';
import App from './App';

const TRACKING_ID = "G-4QKEE0HDSJ";

// --- REMOVE loadGoogleAnalytics function ---
// --- REMOVE loadGoogleAnalytics() call ---
// --- REMOVE setTimeout around initializeGA ---

// Initialize ReactGA directly
try {
  console.log('GA4: Attempting to initialize with ID:', TRACKING_ID);
  ReactGA.initialize(TRACKING_ID, {
    // Consider uncommenting debug_mode for testing
    // gaOptions: { debug_mode: process.env.NODE_ENV === 'development' },
    // testMode: process.env.NODE_ENV !== 'production'
  });
  console.log('GA4: Initialization called.');

  // --- REMOVE the initial pageview send from here ---
  // Let VerticalPaperPlannerApp.js handle the initial pageview in its useEffect

} catch (error) {
  console.error('GA4: Error during initialization:', error);
}

// ... (rest of your index.js) ...

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
