// FILE: src/components/layout/ContentArea.js
// MODIFIED: Replace dual-panel layout with SinglePanelLayout

import React from 'react';
import SinglePanelLayout from './SinglePanelLayout';
import useAppStore from '../../store/appStore'; // Import store to access loading state directly

const ContentArea = ({
  // Props needed by children
  activeSection, activeApproach, activeDataMethod,
  handleSectionFocus, handleApproachToggle, handleDataMethodToggle,
  proMode, handleMagic,
}) => {
  // Get global loading state directly from store for AI operations
  const isAnyAiLoading = useAppStore((state) => state.isAnyLoading());

  return (
    // Position absolutely to fill parent
    <div className="absolute inset-0 flex">
      {/* Single panel layout that handles both write and guide modes */}
      <SinglePanelLayout
        activeSection={activeSection}
        activeApproach={activeApproach}
        activeDataMethod={activeDataMethod}
        handleSectionFocus={handleSectionFocus}
        handleApproachToggle={handleApproachToggle}
        handleDataMethodToggle={handleDataMethodToggle}
        proMode={proMode}
        handleMagic={handleMagic}
      />
    </div>
  );
};

export default ContentArea;
