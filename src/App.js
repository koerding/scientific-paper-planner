// FILE: src/App.js

import React, { useEffect } from 'react';
import PaperPlannerApp from './PaperPlannerApp';
import { resetAllState } from './services/resetService';

function App() {
  // Initialize app and set up any global listeners
  useEffect(() => {
    // Set up a global handler for handling reset commands from anywhere in the app
    window.resetApp = () => {
      console.log("Global app reset triggered");
      resetAllState();
    };

    // Clean up on unmount
    return () => {
      delete window.resetApp;
    };
  }, []);

  return (
    <div className="App">
      <PaperPlannerApp />
    </div>
  );
}

export default App;
