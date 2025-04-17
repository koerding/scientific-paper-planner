// src/index.js - Simplified Example
import React from 'react';
import ReactDOM from 'react-dom/client';
import ReactGA from 'react-ga4';
import './index.css';
import App from './App';

const TRACKING_ID = "G-4QKEE0HDSJ";

try {
  console.log('GA4: Attempting to initialize with ID:', TRACKING_ID);
  ReactGA.initialize(TRACKING_ID, {
    // debug_mode can be helpful during development
    // gaOptions: { debug_mode: process.env.NODE_ENV === 'development' }
    // testMode might prevent data sending in non-production, review if needed
    // testMode: process.env.NODE_ENV !== 'production'
  });
  console.log('GA4: Initialization called.');

  // --- IMPORTANT: Move the initial pageview sending ---
  // It's often better to send the first pageview from your main App component
  // or router listener after the app has mounted, not immediately here.
  // See recommendation 3 below.

} catch (error) {
  console.error('GA4: Error during initialization:', error);
}

// ... (rest of your index.js, like ReactDOM.createRoot) ...

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
