// FILE: src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import ReactGA from 'react-ga4';
import './index.css';
import App from './App';

// --- REMOVED: loadGoogleAnalytics function ---
// --- REMOVED: loadGoogleAnalytics() call ---
// --- REMOVED: setTimeout wrappers ---

// Initialize Google Analytics directly
const TRACKING_ID = "G-4QKEE0HDSJ"; // Your Google Analytics Tracking ID

try {
  console.log('GA4: Attempting to initialize with ID:', TRACKING_ID);
  
  // Initialize ReactGA
  // You can enable debug_mode during development if needed
  ReactGA.initialize(TRACKING_ID, {
    // gaOptions: { debug_mode: process.env.NODE_ENV === 'development' },
    // testMode: process.env.NODE_ENV !== 'production' // testMode prevents sending data
  });
  
  console.log('GA4: Initialization called.');
  
  // --- REMOVED: Initial pageview send from here ---
  // Ensure the initial pageview is sent reliably from your main App component
  // or router, e.g., within a useEffect hook after the app mounts.
  
} catch (error) {
  console.error('GA4: Error during initialization:', error);
}

// Debug mode helper for development (optional)
if (process.env.NODE_ENV === 'development') {
  window.testGA = () => {
    try {
      console.log('Testing GA event...');
      ReactGA.event({
        category: 'Test',
        action: 'Button Click',
        label: 'Test Button - Manual'
      });
      console.log('Test event sent successfully');
    } catch (error) {
      console.error('Error sending test event:', error);
    }
  };
  console.log("GA Test function available: call window.testGA() in console.");
}

// Render the React application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
