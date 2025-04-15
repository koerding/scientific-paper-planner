// FILE: src/components/modals/SplashScreenManager.js

import React, { useState, useEffect } from 'react';
import SplashScreen from './SplashScreen';

/**
 * Manages the display of the splash screen based on user preferences
 * Shows the splash only on first visit or when manually triggered
 */
const SplashScreenManager = () => {
  const [showSplash, setShowSplash] = useState(false);
  
  useEffect(() => {
    // Check local storage on component mount
    const shouldHideSplash = localStorage.getItem('hideWelcomeSplash') === 'true';
    
    if (!shouldHideSplash) {
      // Show splash if user hasn't chosen to hide it
      setShowSplash(true);
    }
  }, []);
  
  const handleCloseSplash = () => {
    setShowSplash(false);
  };
  
  // Handle manually showing the splash screen
  // This can be called from a "Help" or "About" menu item
  const handleShowSplash = () => {
    setShowSplash(true);
  };
  
  return (
    <>
      {showSplash && <SplashScreen onClose={handleCloseSplash} />}
      
      {/* Export the show method for external components to use */}
      {React.useImperativeHandle && React.forwardRef ? (
        <></>
      ) : null}
    </>
  );
};

// Create a higher-order component with ref forwarding
const ForwardedSplashScreenManager = React.forwardRef((props, ref) => {
  const [showSplash, setShowSplash] = useState(false);
  
  useEffect(() => {
    // Check local storage on component mount
    const shouldHideSplash = localStorage.getItem('hideWelcomeSplash') === 'true';
    
    if (!shouldHideSplash) {
      // Show splash if user hasn't chosen to hide it
      setShowSplash(true);
    }
  }, []);
  
  const handleCloseSplash = () => {
    setShowSplash(false);
  };
  
  // Handle manually showing the splash screen
  const handleShowSplash = () => {
    setShowSplash(true);
  };
  
  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    showSplash: handleShowSplash
  }));
  
  return (
    <>
      {showSplash && <SplashScreen onClose={handleCloseSplash} />}
    </>
  );
});

// Helper function to show splash screen from anywhere
export const showWelcomeSplash = () => {
  // Reset the localStorage flag and reload
  localStorage.removeItem('hideWelcomeSplash');
  
  // If we have a ref to the component, use it directly
  if (window.splashManagerRef && window.splashManagerRef.current) {
    window.splashManagerRef.current.showSplash();
  } else {
    // Otherwise force it to show on next reload
    window.location.reload();
  }
};

export { ForwardedSplashScreenManager };
export default SplashScreenManager;
