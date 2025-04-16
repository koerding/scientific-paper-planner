// FILE: src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import ReactGA from 'react-ga'; // Import the Google Analytics package
import './index.css';
import App from './App';

// Initialize Google Analytics with your tracking ID
const TRACKING_ID = "G-4QKEE0HDSJ"; // Replace with your actual tracking ID
ReactGA.initialize(TRACKING_ID);

// Track the initial pageview
ReactGA.pageview(window.location.pathname + window.location.search);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


