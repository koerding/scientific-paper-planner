// FILE: src/components/layout/ContentArea.js
import React from 'react';
import LeftPanel from './LeftPanel';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';

const ContentArea = ({
  // Props for LeftPanel
  activeSection, // This is the activeSectionId string
  sections, // Passed down from store for LeftPanel rendering logic
  activeApproach,
  activeDataMethod,
  handleSectionFocus,
  handleApproachToggle,
  handleDataMethodToggle,
  proMode, // Pass proMode down
  // Props for RightPanel
  handleMagic, // Passed down to RightPanel
  isAnyAiLoading, // Passed down to RightPanel
}) => {

  return (
    // Removed the extra paddingTop div, assuming header handles spacing
    <div className="flex">
      {/* Left panel with sections */}
      <LeftPanel
        activeSection={activeSection} // Pass focused section ID
        handleSectionFocus={handleSectionFocus} // Pass focus handler
        handleApproachToggle={handleApproachToggle} // Pass toggle handler
        handleDataMethodToggle={handleDataMethodToggle} // Pass toggle handler
        handleMagic={handleMagic} // Pass feedback handler
        proMode={proMode} // Pass proMode down
        // Removed props that LeftPanel now gets directly from store:
        // userInputs, localSectionContent, sectionsWithFeedback, feedbackRatings, lastFeedbackTimes
      />

      {/* Right panel with instructions */}
      <FullHeightInstructionsPanel
        activeSectionId={activeSection} // <<< PASS THE ID HERE
        improveInstructions={handleMagic} // Pass feedback handler
        loading={isAnyAiLoading} // Pass loading state
        // Removed currentSection prop, as panel gets it from store via ID
      />

      {/* Footer was moved outside ContentArea in MainLayout if necessary, or keep it here if preferred */}
      {/* <div className="text-center text-gray-500 text-sm mt-6 border-t border-gray-200 pt-3 pb-3 bg-white"> ... </div> */}
    </div>
  );
};

export default ContentArea;
