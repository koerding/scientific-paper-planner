// FILE: src/App.js
// MODIFIED: Added touch detection initialization
import React, { useEffect } from 'react';
import PaperPlannerApp from './components/PaperPlanner/VerticalPaperPlannerApp';
import useAppStore, { initializeOnboardingFromLocalStorage } from './store/appStore';
import { initializeTouchFeatures } from './utils/touchDetection'; // Import the touch detection utility

function App() {
  useEffect(() => {
    window.resetApp = () => {
      useAppStore.getState().resetState();
    };
    return () => { delete window.resetApp; };
  }, []);

  // Initialize onboarding from localStorage
  useEffect(() => {
    // Call the onboarding initialization logic after the app mounts
    // This ensures the store is hydrated and ready
    initializeOnboardingFromLocalStorage();
  }, []); // Empty dependency array ensures it runs only once on mount
  
  // Initialize touch features
  useEffect(() => {
    // Setup touch detection and swipe functionality
    initializeTouchFeatures();
  }, []); // Empty dependency array ensures it runs only once on mount

  return (
    <div className="App">
      <PaperPlannerApp />
    </div>
  );
}

export default App;
