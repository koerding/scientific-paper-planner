// FILE: src/App.js
// MODIFIED: Added useEffect for onboarding initialization
import React, { useEffect } from 'react';
import PaperPlannerApp from './components/PaperPlanner/VerticalPaperPlannerApp';
import useAppStore, { initializeOnboardingFromLocalStorage } from './store/appStore'; // Import the action

function App() {
  useEffect(() => {
    window.resetApp = () => {
      useAppStore.getState().resetState();
    };
    return () => { delete window.resetApp; };
  }, []);

  // --- ADD THIS useEffect ---
  useEffect(() => {
    // Call the onboarding initialization logic after the app mounts
    // This ensures the store is hydrated and ready
    initializeOnboardingFromLocalStorage();
  }, []); // Empty dependency array ensures it runs only once on mount
  // --- END ADD ---

  return (
    <div className="App">
      <PaperPlannerApp />
    </div>
  );
}

export default App;
