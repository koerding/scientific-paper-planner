// FILE: src/components/layout/AppHeader.js
// REDESIGNED: Better responsive layout with tight text+icon buttons
// MODIFIED: Removed the logo icon

import React, { useState, useEffect } from 'react';
import useAppStore from '../../store/appStore'; // Import store
import HamburgerMenu from '../menu/HamburgerMenu'; // Import our hamburger menu component
import SectionModePicker from './SectionModePicker'; // Import the toggle component

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
  const uiMode = useAppStore((state) => state.uiMode);
  const setUiMode = useAppStore((state) => state.setUiMode);

  // --- Add local state for import loading and responsive behavior ---
  const [localImportLoading, setLocalImportLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // --- Handle window resize ---
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // --- Determine if we're in mobile view ---
  const isMobileView = windowWidth < 768;

  // --- Loading spinner SVG ---
  const loadingSpinner = (
    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const handleHelpClick = () => {
    if (showHelpSplash) showHelpSplash();
  };

  // Tight button styles with minimal padding
  const getTightButtonClasses = () => {
    return `inline-flex items-center justify-center px-3 py-2 border rounded-md shadow-sm
           text-sm font-medium transition-colors text-gray-700 bg-white hover:bg-gray-50
           ${isAiBusy ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`;
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-2">
        {isMobileView ? (
          // Mobile Layout: Stack elements vertically with toggle at the bottom
          <div className="flex flex-col">
            {/* Top row: Hamburger menu on left, buttons on right */}
            <div className="flex items-center justify-between mb-2">
              {/* Left: Hamburger Menu */}
              <div className="flex items-center">
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
              </div>
              
              {/* Right: Help, Save buttons */}
              <div className="flex items-center space-x-2">
                {/* Help Button - TIGHT VERSION */}
                <button 
                  onClick={handleHelpClick} 
                  disabled={isAiBusy || localImportLoading} 
                  className={getTightButtonClasses()}
                  aria-label="Help"
                >
                  {isAiBusy ? loadingSpinner : (
                    <>
                      <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Help
                    </>
                  )}
                </button>

                {/* Save Button - TIGHT VERSION */}
                <button 
                  onClick={saveProject} 
                  disabled={isAiBusy || localImportLoading} 
                  className={getTightButtonClasses()}
                  aria-label="Save"
                >
                  {isAiBusy ? loadingSpinner : (
                    <>
                      <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Bottom row: Centered Write/Guide toggle */}
            <div className="flex items-center justify-center py-1">
              <SectionModePicker 
                currentMode={uiMode} 
                onModeChange={setUiMode}
                disabled={isAiBusy}
              />
            </div>
          </div>
        ) : (
          // Desktop Layout: Three-column layout
          <div className="flex items-center justify-between">
            {/* Left section: Hamburger menu */}
            <div className="flex items-center w-1/4 justify-start">
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
            </div>
            
            {/* Middle section: Write/Guide toggle */}
            <div className="flex items-center w-2/4 justify-center">
              <SectionModePicker 
                currentMode={uiMode} 
                onModeChange={setUiMode}
                disabled={isAiBusy}
              />
            </div>

            {/* Right section: Help, Save buttons - TIGHT VERSION */}
            <div className="flex items-center w-1/4 justify-end space-x-2">
              {/* Help Button - Text + Icon with tight spacing */}
              <button 
                onClick={handleHelpClick} 
                disabled={isAiBusy || localImportLoading} 
                className={getTightButtonClasses()}
                aria-label="Help"
              >
                {isAiBusy ? loadingSpinner : (
                  <>
                    <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Help
                  </>
                )}
              </button>

              {/* Save Button - Text + Icon with tight spacing */}
              <button 
                onClick={saveProject} 
                disabled={isAiBusy || localImportLoading} 
                className={getTightButtonClasses()}
                aria-label="Save"
              >
                {isAiBusy ? loadingSpinner : (
                  <>
                    <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
