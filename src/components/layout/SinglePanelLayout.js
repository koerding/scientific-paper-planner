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
 * FIXED: Removed floating toggle to avoid duplication
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
      className="flex flex-col items-center pt-10 pb-12 w-full h-full overflow-y-auto bg-fafafd">
      
      {/* Main content panel with card design */}
      <div 
        className="w-full max-w-[740px] px-4 flex-grow overflow-visible z-30 relative mx-auto mb-20" /* Added bottom margin for mobile */
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
