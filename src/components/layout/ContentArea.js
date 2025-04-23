// FILE: src/components/layout/ContentArea.js
import React from 'react';
import LeftPanel from './LeftPanel';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';

const ContentArea = ({
  // Props for LeftPanel
  activeSection,
  // sections, // sections prop likely no longer needed by LeftPanel
  activeApproach,
  activeDataMethod,
  handleSectionFocus,
  handleApproachToggle,
  handleDataMethodToggle,
  proMode,
  // Props for RightPanel
  handleMagic,
  isAnyAiLoading,
}) => {

  return (
    // Make flex container take full height of its parent and hide its own overflow
    <div className="flex flex-grow h-full overflow-hidden">

      {/* Left panel: Relies on CSS for overflow and width. Height comes from flex parent */}
      <LeftPanel
        activeSection={activeSection}
        handleSectionFocus={handleSectionFocus}
        handleApproachToggle={handleApproachToggle}
        handleDataMethodToggle={handleDataMethodToggle}
        handleMagic={handleMagic}
        proMode={proMode}
      />

      {/* Right panel: Uses inline styles for overflow and width. Height comes from flex parent */}
      <FullHeightInstructionsPanel
        activeSectionId={activeSection}
        improveInstructions={handleMagic}
        loading={isAnyAiLoading}
      />
    </div>
  );
};

export default ContentArea;
