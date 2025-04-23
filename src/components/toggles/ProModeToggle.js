// FILE: src/components/toggles/ProModeToggle.js
import React from 'react';
import useAppStore from '../../store/appStore'; // Import the Zustand store

const ProModeToggle = () => {
  // Select state and action from the Zustand store
  const proModeEnabled = useAppStore((state) => state.proMode);
  const setProMode = useAppStore((state) => state.setProMode);

  // Toggle pro mode using the store action
  const handleToggle = () => {
    const newState = !proModeEnabled;
    setProMode(newState); // Call the action from the store
  };

  return (
    <button
      onClick={handleToggle}
      className={`inline-flex items-center px-3 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500
        ${proModeEnabled
          ? 'border-green-500 bg-green-600 hover:bg-green-700 text-white'
          : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900'}`}
      title={proModeEnabled ? "Disable Pro Mode (will hide locked sections)" : "Enable Pro Mode (shows all sections)"}
    >
      <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      Pro Mode: {proModeEnabled ? "On" : "Off"}
    </button>
  );
};

export default ProModeToggle;
