// FILE: src/components/layout/SinglePanelLayout.js
import React, { useEffect, useRef } from 'react';
import LeftPanel from './LeftPanel';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';
import useAppStore from '../../store/appStore';
import { showWelcomeSplash } from '../modals/SplashScreenManager';

/**
 * A single panel layout that handles both write and guide modes
 * FIXED: Now correctly displays title in guide mode only
 * FIXED: Embedded toggle in header for both modes
 * FIXED: Added proper padding for write mode
 * FIXED: Improved centering of content
 */
const SinglePanelLayout = ({
  activeSection,
  activeApproach,
  activeDataMethod,
  handleSectionFocus,
  handleApproachToggle,
  handleDataMethodToggle,
  proMode,
  handleMagic,
}) => {
  // Get UI mode and current section ID from the store
  const uiMode = useAppStore((state) => state.uiMode);
  const setUiMode = useAppStore((state) => state.setUiMode);
  const isAnyAiLoading = useAppStore((state) => state.isAnyLoading());
  const currentChatSectionId = useAppStore((state) => state.currentChatSectionId);
  
  // Use currentChatSectionId as the source of truth for which section is active
  const activeSectionId = currentChatSectionId || activeSection;
  
  // Get section info for the header (only shown in guide mode)
  const currentSection = useAppStore((state) => activeSectionId ? state.sections[activeSectionId] : null);
  const sectionTitle = currentSection?.title || "Select a section";
  
  // Ref for scrolling to sections
  const contentRef = useRef(null);
  
  // Handlers for switching between write and guide modes
  const handleSwitchToGuide = () => {
    setUiMode('guide');
  };
  
  const handleSwitchToWrite = () => {
    setUiMode('write');
  };
  
  return (
    <div 
      ref={contentRef}
      className="flex flex-col items-center pt-10 pb-12 w-full h-full overflow-y-auto bg-fafafd"
      data-mode={uiMode} /* Added data attribute for CSS targeting */
    >
      {/* Main content panel with card design */}
      <div 
        className="w-full max-w-[760px] px-4 flex-grow overflow-visible z-30 relative mx-auto mb-20" /* Adjusted max-width */
        aria-live="polite"
      >
        {/* Card header - Now just shows title in guide mode without toggle */}
        <div className="bg-white rounded-t-lg border border-gray-200 shadow-sm px-5 py-3 mb-0 flex items-center">
          {/* Only show title in guide mode */}
          {uiMode === 'guide' && (
            <h2 className="text-xl font-semibold text-gray-800">{sectionTitle}</h2>
          )}
          {/* This is empty in write mode */}
          {uiMode === 'write' && <div></div>}
          
          {/* Add the mode toggle to the card header */}
          <div className="ml-auto">
            <div className="bg-gray-100 p-1 rounded-full inline-flex items-center justify-center w-auto h-8 shadow-sm">
              <button
                onClick={handleSwitchToWrite}
                disabled={isAnyAiLoading || uiMode === 'write'}
                className={`flex items-center justify-center px-5 py-1 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  uiMode === 'write'
                    ? 'bg-white text-gray-800 shadow-sm font-semibold'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                } ${isAnyAiLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Write
              </button>
              
              <span className="text-gray-400 mx-1 flex items-center">·</span> {/* Added dot separator */}
              
              <button
                onClick={handleSwitchToGuide}
                disabled={isAnyAiLoading || uiMode === 'guide'}
                className={`flex items-center justify-center px-5 py-1 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  uiMode === 'guide'
                    ? 'bg-white text-gray-800 shadow-sm font-semibold'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                } ${isAnyAiLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Guide
              </button>
            </div>
          </div>
        </div>
        
        {/* Card body */}
        <div className="bg-white rounded-b-lg border-l border-r border-b border-gray-200 shadow-sm hover:shadow-md transition-shadow px-5 py-4 mb-6">
          {uiMode === 'write' ? (
            /* WRITE MODE: Show the original left panel (content editor) */
            <div className="w-full">
              <LeftPanel
                activeSection={activeSectionId}
                handleSectionFocus={handleSectionFocus}
                handleApproachToggle={handleApproachToggle}
                handleDataMethodToggle={handleDataMethodToggle}
                handleMagic={handleMagic}
                proMode={proMode}
                onRequestFeedback={handleSwitchToGuide}
                contentRef={contentRef}
              />
            </div>
          ) : (
            /* GUIDE MODE: Show the instruction panel for the current section */
            <div className="w-full">
              <FullHeightInstructionsPanel
                key={activeSectionId}
                activeSectionId={activeSectionId}
                improveInstructions={handleMagic}
                loading={isAnyAiLoading}
                onRequestWrite={handleSwitchToWrite}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SinglePanelLayout;
