// FILE: src/components/layout/AppHeader.js
import React, { useState } from 'react';
import ProModeToggle from '../toggles/ProModeToggle';

const AppHeader = ({
  resetProject, // This prop maps to handleResetRequest in parent
  // ... other props
  loading // Combined loading state (e.g., isAnyAiLoading from parent)
}) => {
  // ... (handleFileImport, handleFileSelection, handleHelpClick logic) ...
  const isImporting = loading; // Use the passed loading prop

  const handleNewButtonClick = () => {
    console.log("[AppHeader] 'New' button clicked."); // <-- ADD LOG
    if (resetProject) {
      resetProject();
    } else {
      console.error("[AppHeader] resetProject prop is missing!");
    }
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo and title */}
          <div className="flex items-center"> {/* ... logo ... */} </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-1">
            {/* New Project button */}
            <button
              onClick={handleNewButtonClick} // <-- Use wrapper function
              disabled={isImporting}
              className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium
                ${isImporting
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'}`}
            >
              <svg className="h-3 w-3 mr-1" /* ... */ ></svg>
              New
            </button>

            {/* Other buttons (Import, Save, Load, Examples, Export, Pro Mode, Review, Help) */}
            {/* ... other buttons ... */}

          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
