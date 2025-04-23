// FILE: src/components/toggles/ProModeToggle.js
import React from 'react';
import useAppStore from '../../store/appStore'; // Import the Zustand store
// REMOVED: import { isProModeEnabled, toggleProMode } from '../../services/progressionStateService'; // <-- Removed import

const ProModeToggle = () => {
  // Select state and action from the Zustand store
  const proModeEnabled = useAppStore((state) => state.proMode);
  const setProMode = useAppStore((state) => state.setProMode);

  // No need for local state or useEffect listening to window events anymore

  // Toggle pro mode using the store action
  const handleToggle = () => {
    const newState = !proModeEnabled;
    setProMode(newState); // Call the action from the store
  };

  return (
    <button
      onClick={handleToggle}
      className={`inline-flex items-center px-2 py-1 border rounded-md shadow-sm text-xs font-medium transition-colors
        ${proModeEnabled
          ? 'border-green-500 bg-green-600 hover:bg-green-700 text-white'
          : 'border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700'}`}
      title={proModeEnabled ? "Disable Pro Mode (will hide locked sections)" : "Enable Pro Mode (shows all sections)"}
    >
      <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      Pro Mode: {proModeEnabled ? "On" : "Off"}
    </button>
  );
};

export default ProModeToggle;
