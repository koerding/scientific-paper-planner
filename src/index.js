// FILE: src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import ReactGA from 'react-ga4';
import './index.css';
import App from './App';

// Initialize Google Analytics directly
const TRACKING_ID = "G-4QKEE0HDSJ"; // Your Google Analytics Tracking ID

try {
  console.log('GA4: Attempting to initialize with ID:', TRACKING_ID);

  // Initialize ReactGA
  ReactGA.initialize(TRACKING_ID, {
    // You might want debug mode ON for testing
    // gaOptions: { debug_mode: true }
    // testMode: process.env.NODE_ENV !== 'production' // <-- EDITED: Commented out to ensure data is sent for testing
  });

  console.log('GA4: Initialization called.');

  // Reminder: Ensure the initial pageview is sent reliably from your main App component
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
