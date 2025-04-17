// FILE: src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import ReactGA from 'react-ga4';
import './index.css';
import App from './App';

// Function to dynamically load the Google Analytics script
const loadGoogleAnalytics = () => {
  try {
    // First check if it's already loaded
    if (window.gtag) {
      console.log('Google Analytics already loaded, skipping script insertion');
      return;
    }
    
    // Create gtag.js script element
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=G-4QKEE0HDSJ`;
    
    // Create inline gtag configuration script
    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-4QKEE0HDSJ');
    `;
    
    // Add scripts to document
    document.head.appendChild(script1);
    document.head.appendChild(script2);
    
    console.log("Google Analytics scripts dynamically added to head");
  } catch (error) {
    console.error("Error loading Google Analytics scripts:", error);
  }
};

// Call the function to load Google Analytics
loadGoogleAnalytics();

// Initialize Google Analytics with your tracking ID after a short delay
// to ensure the script has loaded
const initializeGA = () => {
  const TRACKING_ID = "G-4QKEE0HDSJ";
  
  try {
    console.log('GA4: Attempting to initialize with ID:', TRACKING_ID);
    
    // Initialize ReactGA with debug mode in development
    ReactGA.initialize(TRACKING_ID, {
      gaOptions: {
        debug_mode: process.env.NODE_ENV === 'development'
      },
      testMode: process.env.NODE_ENV !== 'production'
    });
    
    console.log('GA4: Initialization successful.');
    
    // Send initial pageview after initialization
    setTimeout(() => {
      try {
        console.log('GA4: Attempting to send initial pageview...');
        
        ReactGA.send({ 
          hitType: "pageview", 
          page: window.location.pathname + window.location.search 
        });
        
        console.log('GA4: Initial pageview sent.');
        
        // Optional: Add parameters for better user segmentation
        ReactGA.set({
          appVersion: "1.0.0", // App version
          userRole: "researcher" // Default role
        });
      } catch (pageviewError) {
        console.error('GA4: Error sending initial pageview:', pageviewError);
      }
    }, 1000); // Wait 1 second to ensure GA has initialized
  } catch (error) {
    console.error('GA4: Error during initialization:', error);
  }
};

// Initialize GA after a short delay to ensure scripts are loaded
setTimeout(initializeGA, 500);

// Debug mode for development - remove in production
if (process.env.NODE_ENV === 'development') {
  // Add a function to window for testing GA
  window.testGA = () => {
    try {
      console.log('Testing GA event...');
      ReactGA.event({
        category: 'Test',
        action: 'Button Click',
        label: 'Test Button'
      });
      console.log('Test event sent successfully');
    } catch (error) {
      console.error('Error sending test event:', error);
    }
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
