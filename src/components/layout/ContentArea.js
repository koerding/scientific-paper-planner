// FILE: src/components/layout/ContentArea.js
import React from 'react';
import LeftPanel from './LeftPanel';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';

const ContentArea = ({
  // Props needed by children
  activeSection, activeApproach, activeDataMethod,
  handleSectionFocus, handleApproachToggle, handleDataMethodToggle,
  proMode, handleMagic, isAnyAiLoading,
}) => {

  return (
    // Position absolutely to fill parent, remain flex row
    // REMOVED: flex-grow h-full overflow-hidden
    // ADDED: absolute inset-0
    <div className="absolute inset-0 flex">

      {/* Left panel: Add necessary classes directly */}
      <LeftPanel
        activeSection={activeSection}
        handleSectionFocus={handleSectionFocus}
        handleApproachToggle={handleApproachToggle}
        handleDataMethodToggle={handleDataMethodToggle}
        handleMagic={handleMagic}
        proMode={proMode}
      />

      {/* Right panel: Add necessary classes directly */}
      <FullHeightInstructionsPanel
        activeSectionId={activeSection}
        improveInstructions={handleMagic}
        loading={isAnyAiLoading}
      />
    </div>
  );
};

export default ContentArea;
