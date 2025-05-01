// FILE: src/components/layout/SinglePanelLayout.js
import React, { useCallback } from 'react';
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
  
  // Get section data for the section title
  const currentSection = useAppStore((state) => 
    state.sections && state.sections[activeSection] ? state.sections[activeSection] : null
  );
  const sectionTitle = currentSection?.title || "Section";
  const sectionNumber = getSectionNumber(activeSection);
  
  // Memoized mode switch handlers
  const handleSwitchToGuide = useCallback(() => {
    setUiMode('guide');
  }, [setUiMode]);
  
  const handleSwitchToWrite = useCallback(() => {
    setUiMode('write');
  }, [setUiMode]);

  return (
    <div className="flex flex-col items-center pt-10 pb-12 w-full h-full overflow-auto bg-fafafd"> {/* Starting at 40px (pt-10) with bg color */}
      {/* Main content panel with card design */}
      <div 
        className="w-full max-w-[740px] px-4 flex-grow overflow-auto"
        aria-live="polite" // For accessibility
      >
        {/* Card header with section info and toggle */}
        <div className="bg-white rounded-t-lg border border-gray-200 shadow-sm px-5 py-4 mb-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{sectionTitle}</h2>
              <p className="text-sm text-gray-500 mt-1">Section {sectionNumber} · {sectionTitle}</p>
            </div>
            <SectionModePicker 
              currentMode={uiMode} 
              onModeChange={setUiMode}
              disabled={isAnyAiLoading}
            />
          </div>
        </div>
        
        {/* Card body */}
        <div className="bg-white rounded-b-lg border-l border-r border-b border-gray-200 shadow-sm hover:shadow-md transition-shadow px-5 py-4 mb-6">
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
      
      {/* Floating action button container */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-2 items-end">
        {/* Ready/Revise CTA - visible when scrolled */}
        <div className="bg-blue-600 text-white rounded-full shadow-lg px-4 py-2 text-sm font-medium">
          {uiMode === 'write' ? (
            <button 
              onClick={handleSwitchToGuide}
              className="flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ready for Feedback
            </button>
          ) : (
            <button 
              onClick={handleSwitchToWrite}
              className="flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
              </svg>
              Ready to Write
            </button>
          )}
        </div>
        
        {/* Chat button stays in its original position */}
        {/* We don't need to add anything here as ModernChatInterface handles it */}
      </div>
    </div>
  );
};

// Helper function to get section number
function getSectionNumber(sectionId) {
  const sectionNumbers = {
    'question': 1,
    'hypothesis': 2,
    'needsresearch': 2,
    'exploratoryresearch': 2,
    'audience': 3,
    'relatedpapers': 4,
    'experiment': 5,
    'existingdata': 5,
    'theorysimulation': 5,
    'analysis': 6,
    'process': 7,
    'abstract': 8
  };
  
  return sectionNumbers[sectionId] || '';
}

export default SinglePanelLayout;
