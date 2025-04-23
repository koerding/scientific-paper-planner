// FILE: src/components/layout/ContentArea.js
import React from 'react';
import LeftPanel from './LeftPanel';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';

const ContentArea = ({
  // Props for LeftPanel
  activeSection, sections, activeApproach, activeDataMethod,
  handleSectionFocus, handleApproachToggle, handleDataMethodToggle,
  proMode,
  // Props for RightPanel
  handleMagic, isAnyAiLoading,
}) => {

  return (
    // Ensure the flex container itself can take up screen height
    // The parent container (in MainLayout) might need h-screen or similar
    <div className="flex min-h-[calc(100vh-64px)]"> {/* Adjust 64px based on actual header height */}

      {/* Left panel: Uses CSS for overflow and height */}
      <LeftPanel
        activeSection={activeSection}
        handleSectionFocus={handleSectionFocus}
        handleApproachToggle={handleApproachToggle}
        handleDataMethodToggle={handleDataMethodToggle}
        handleMagic={handleMagic}
        proMode={proMode}
        // Note: 'sections' prop might not be needed if LeftPanel reads from store
      />

      {/* Right panel: Now uses inline styles for height and overflow */}
      <FullHeightInstructionsPanel
        activeSectionId={activeSection}
        improveInstructions={handleMagic}
        loading={isAnyAiLoading}
      />
    </div>
  );
};

export default ContentArea;
