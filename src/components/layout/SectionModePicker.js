// FILE: src/components/layout/SectionModePicker.js
import React from 'react';

/**
 * Toggle component for switching between Write and Guide modes
 */
const SectionModePicker = ({ currentMode, onModeChange, disabled = false }) => {
  // Add a small debounce to prevent double-clicking
  const handleModeChange = (newMode) => {
    if (disabled || currentMode === newMode) return;
    
    // Set a temporary local disabled state to prevent rapid toggling
    onModeChange(newMode);
  };

  return (
    <div className="bg-gray-100 p-1.5 rounded-full inline-flex w-auto mx-auto h-11">
      <button
        onClick={() => handleModeChange('write')}
        disabled={disabled || currentMode === 'write'}
        className={`flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          currentMode === 'write'
            ? 'bg-white text-gray-800 shadow-sm'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        Write
      </button>
      
      <button
        onClick={() => handleModeChange('guide')}
        disabled={disabled || currentMode === 'guide'}
        className={`flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          currentMode === 'guide'
            ? 'bg-white text-gray-800 shadow-sm'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Guide
      </button>
    </div>
  );
};

export default SectionModePicker;
