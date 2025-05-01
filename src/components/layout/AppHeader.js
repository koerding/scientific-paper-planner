// FILE: src/components/layout/AppHeader.js
// MODIFIED: Added hamburger menu and simplified header buttons to only Show "Save"

import React, { useState } from 'react';
import useAppStore from '../../store/appStore'; // Import store
import HamburgerMenu from '../menu/HamburgerMenu'; // Import our new hamburger menu component

const AppHeader = ({
  resetProject,
  exportProject,
  saveProject,
  loadProject,
  importDocumentContent,
  onOpenReviewModal,
  showHelpSplash,
}) => {
  // --- Get global loading state directly from store ---
  const isAiBusy = useAppStore((state) => state.isAnyLoading());

  // --- Add local state for import loading ---
  const [localImportLoading, setLocalImportLoading] = useState(false);

  // --- Loading spinner SVG ---
  const loadingSpinner = (
    <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  // --- Button style functions (use isAiBusy now) ---
  const getButtonClasses = (baseStyle = "text-gray-700 bg-white hover:bg-gray-50", activeStyle = baseStyle) => {
      return `inline-flex items-center px-2 py-1 border rounded-md shadow-sm text-xs font-medium transition-colors
              ${isAiBusy
                ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-wait'
                : `${baseStyle} cursor-pointer`
              }`;
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-2">
        {/* --- justify-between ensures left/right alignment --- */}
        <div className="flex items-center justify-between">
          {/* Left side: Hamburger menu and Logo */}
          <div className="flex items-center">
            {/* Hamburger Menu */}
            <HamburgerMenu
              resetProject={resetProject}
              exportProject={exportProject}
              loadProject={loadProject}
              importDocumentContent={importDocumentContent}
              onOpenReviewModal={onOpenReviewModal}
              showHelpSplash={showHelpSplash}
              isAiBusy={isAiBusy}
              localImportLoading={localImportLoading}
            />

            {/* Logo */}
            <div className="w-8 h-8 bg-purple-600 text-white rounded-md flex items-center justify-center ml-2">
              <span className="font-bold text-lg">SP</span>
            </div>
            <span className="font-semibold text-gray-700 ml-2">Planner</span>
          </div>

          {/* Right side: Just Save button */}
          <div className="flex items-center">
            {/* Save Button */}
            <button 
              onClick={saveProject} 
              disabled={isAiBusy || localImportLoading} 
              className={getButtonClasses()}
            >
              {isAiBusy ? loadingSpinner : (
                <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              )} Save
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
