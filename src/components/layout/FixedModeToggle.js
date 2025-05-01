// FILE: src/components/layout/FixedModeToggle.js
import React from 'react';
import useAppStore from '../../store/appStore';

/**
 * A fixed position Write/Guide toggle that's always visible on screen
 * @returns {React.ReactElement} Fixed position toggle component
 */
const FixedModeToggle = () => {
  const uiMode = useAppStore((state) => state.uiMode);
  const setUiMode = useAppStore((state) => state.setUiMode);
  const currentSectionId = useAppStore((state) => state.sections 
    ? Object.keys(state.sections).find(key => 
        state.sections[key].isCurrentSection || 
        state.currentChatSectionId === key
      )
    : null
  );
  
  // Handle mode switch with current section context
  const handleModeChange = (newMode) => {
    if (newMode === uiMode) return;
    
    // Store current section ID when switching modes
    if (currentSectionId) {
      // Save the current section ID in localStorage for reference
      localStorage.setItem('lastActiveSectionId', currentSectionId);
    }
    
    setUiMode(newMode);
  };

  return (
    <div className="fixed-mode-toggle">
      <div className="bg-white shadow-md rounded-full border border-gray-200 flex p-1 z-50">
        <button
          onClick={() => handleModeChange('write')}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${
            uiMode === 'write'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Write
          </span>
        </button>
        <button
          onClick={() => handleModeChange('guide')}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${
            uiMode === 'guide'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Guide
          </span>
        </button>
      </div>
    </div>
  );
};

export default FixedModeToggle;
