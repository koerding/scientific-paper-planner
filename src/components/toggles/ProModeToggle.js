// src/components/toggles/ProModeToggle.js
import React, { useState, useEffect } from 'react';
import { isProModeEnabled, toggleProMode } from '../../services/progressionStateService';

const ProModeToggle = () => {
  const [enabled, setEnabled] = useState(false);
  
  // Initialize state
  useEffect(() => {
    setEnabled(isProModeEnabled());
    
    // Listen for pro mode changes
    const handleProModeChange = (event) => {
      setEnabled(event.detail.enabled);
    };
    
    window.addEventListener('proModeChanged', handleProModeChange);
    return () => window.removeEventListener('proModeChanged', handleProModeChange);
  }, []);
  
  // Toggle pro mode
  const handleToggle = () => {
    const newState = toggleProMode();
    setEnabled(newState);
  };
  
  return (
    <button 
      onClick={handleToggle}
      className={`inline-flex items-center px-2 py-1 border rounded-md shadow-sm text-xs font-medium 
        ${enabled 
          ? 'border-green-500 bg-green-600 hover:bg-green-700 text-white' 
          : 'border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700'}`}
      title={enabled ? "Disable Pro Mode" : "Enable Pro Mode to see all sections"}
    >
      <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      Pro Mode: {enabled ? "On" : "Off"}
    </button>
  );
};

export default ProModeToggle;
