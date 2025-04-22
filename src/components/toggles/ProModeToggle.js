// FILE: src/components/toggles/ProModeToggle.js

import React, { useState, useEffect } from 'react';
import { isProModeEnabled, setProModeEnabled } from '../../services/progressionStateService';
import { trackFeatureUsage } from '../../utils/analyticsUtils';

/**
 * Pro Mode toggle button component for the header
 * Enables/disables the progressive unlocking feature
 */
const ProModeToggle = () => {
  const [enabled, setEnabled] = useState(false);
  
  // Load initial state
  useEffect(() => {
    setEnabled(isProModeEnabled());
    
    // Listen for pro mode changes from other components
    const handleProModeChange = (event) => {
      setEnabled(event.detail.enabled);
    };
    
    window.addEventListener('proModeChanged', handleProModeChange);
    return () => {
      window.removeEventListener('proModeChanged', handleProModeChange);
    };
  }, []);
  
  // Handle toggle button click
  const handleToggle = () => {
    const newState = !enabled;
    setProModeEnabled(newState);
    setEnabled(newState);
    
    // Track usage in analytics
    trackFeatureUsage('Pro Mode', newState ? 'Enabled' : 'Disabled');
  };
  
  return (
    <button
      onClick={handleToggle}
      className={`
        inline-flex items-center px-3 py-1.5 border rounded-md shadow-sm text-xs font-medium
        transition-colors duration-200 ease-in-out relative
        ${enabled 
          ? 'border-green-500 bg-green-600 text-white hover:bg-green-700' 
          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        }
      `}
      title={enabled ? 'Disable guided progression' : 'Enable all sections'}
    >
      <div className="flex items-center">
        {/* Switch track and handle */}
        <span 
          className={`relative inline-block w-8 h-4 mr-2 rounded-full transition-colors duration-200 ease-in-out ${enabled ? 'bg-green-300' : 'bg-gray-300'}`}
        >
          <span 
            className={`absolute inset-y-0 left-0 w-4 h-4 rounded-full transition-transform duration-200 ease-in-out transform ${enabled ? 'translate-x-4 bg-white' : 'translate-x-0 bg-white'}`}
          ></span>
        </span>
        
        {/* Button text */}
        Pro Mode
        {enabled && (
          <span className="ml-1 text-xxs bg-green-200 text-green-800 py-0.5 px-1 rounded">ON</span>
        )}
      </div>
    </button>
  );
};

export default ProModeToggle;
