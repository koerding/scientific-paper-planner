// FILE: src/components/modals/SplashScreenManager.js

import React, { useState, useEffect, useRef } from 'react';
import SplashScreen from './SplashScreen';

/**
 * Manages the display of the splash screen based on user preferences
 * Shows the splash only on first visit or when manually triggered
 * FIXED: Improved ref forwarding to ensure the Help button works correctly
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
    </>
  );
};

/**
 * Enhanced version of SplashScreenManager with ref forwarding
 * This is what makes the Help button in the AppHeader work properly
 */
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
  
  // FIXED: Better implementation for the splash screen display
  const handleShowSplash = () => {
    console.log("Showing splash screen via ForwardedSplashScreenManager");
    setShowSplash(true);
  };
  
  // Expose methods via ref - this is what makes the Help button work
  React.useImperativeHandle(ref, () => ({
    showSplash: handleShowSplash
  }));
  
  return (
    <>
      {showSplash && <SplashScreen onClose={handleCloseSplash} />}
    </>
  );
});

// Ensure the forwardRef has a display name for debugging
ForwardedSplashScreenManager.displayName = 'ForwardedSplashScreenManager';

// Helper function to show splash screen from anywhere
export const showWelcomeSplash = () => {
  // Reset the localStorage flag and reload
  localStorage.removeItem('hideWelcomeSplash');
  
  // If we have a ref to the component, use it directly
  if (window.splashManagerRef && window.splashManagerRef.current) {
    console.log("Found splash manager ref, showing splash directly");
    window.splashManagerRef.current.showSplash();
  } else {
    // Otherwise force it to show on next reload
    console.log("No splash manager ref found, refreshing page");
    window.location.reload();
  }
};

export { ForwardedSplashScreenManager };
export default SplashScreenManager;
