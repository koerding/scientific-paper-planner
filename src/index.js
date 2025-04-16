// FILE: src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import ReactGA from 'react-ga4';
import './index.css';
import App from './App';

// Initialize Google Analytics with your tracking ID
const TRACKING_ID = "G-4QKEE0HDSJ"; 
ReactGA.initialize(TRACKING_ID);

// Track the initial pageview
ReactGA.send({ hitType: "pageview", page: window.location.pathname + window.location.search });

// Optional: Add parameters to better understand user segments
ReactGA.set({
  // Set parameters for better user segmentation
  appVersion: "1.0.0", // Replace with your actual app version
  userRole: "researcher" // Default role - you can update this dynamically
});

// Debug mode for development - remove in production
if (process.env.NODE_ENV === 'development') {
  ReactGA.set({ debug: true });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
