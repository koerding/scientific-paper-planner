// FILE: src/components/layout/SinglePanelLayout.js
import React from 'react';
import { useCallback } from 'react';
import useAppStore from '../../store/appStore';
import LeftPanel from './LeftPanel'; // Import as WritePanel
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel'; // Import as GuidePanel
import SectionModePicker from './SectionModePicker'; // New toggle component

/**
 * Single Panel Layout component that switches between Write and Guide modes
 * Replaces the original dual-panel ContentArea component
 */
const SinglePanelLayout = ({
  activeSection, 
  activeApproach, 
  activeDataMethod,
  handleSectionFocus, 
  handleApproachToggle, 
  handleDataMethodToggle,
  proMode, 
  handleMagic
}) => {
  // Get UI mode from store
  const uiMode = useAppStore((state) => state.uiMode);
  const setUiMode = useAppStore((state) => state.setUiMode);
  const isAnyAiLoading = useAppStore((state) => state.isAnyLoading());
  
  // Memoized mode switch handlers
  const handleSwitchToGuide = useCallback(() => {
    setUiMode('guide');
  }, [setUiMode]);
  
  const handleSwitchToWrite = useCallback(() => {
    setUiMode('write');
  }, [setUiMode]);

  return (
    <div className="flex flex-col items-center pt-14 pb-12 w-full h-full overflow-auto">
      {/* Mode toggle at top of panel area */}
      <div className="w-full max-w-[740px] px-4 mt-6 mb-4">
        <SectionModePicker 
          currentMode={uiMode} 
          onModeChange={setUiMode}
          disabled={isAnyAiLoading}
        />
      </div>
      
      {/* Main content panel - conditionally renders Write or Guide panel */}
      <div 
        className="w-full max-w-[740px] px-4 flex-grow overflow-auto"
        aria-live="polite" // For accessibility
      >
        {uiMode === 'write' ? (
          /* WRITE MODE: Show the original left panel (content editor) */
          <div className="w-full">
            <LeftPanel
              activeSection={activeSection}
              handleSectionFocus={handleSectionFocus}
              handleApproachToggle={handleApproachToggle}
              handleDataMethodToggle={handleDataMethodToggle}
              handleMagic={handleMagic}
              proMode={proMode}
              onRequestFeedback={handleSwitchToGuide} // Pass the mode switch function
            />
          </div>
        ) : (
          /* GUIDE MODE: Show the original right panel (instructions/feedback) */
          <div className="w-full">
            <FullHeightInstructionsPanel
              activeSectionId={activeSection}
              improveInstructions={handleMagic}
              loading={isAnyAiLoading}
              onRequestWrite={handleSwitchToWrite} // Pass the mode switch function
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SinglePanelLayout;
