// FILE: src/components/layout/ContentArea.js

import React from 'react';
import LeftPanel from './LeftPanel';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';

/**
 * Component for the main content area with left and right panels
 * UPDATED: Added sectionsWithFeedback to track which sections have received feedback
 */
const ContentArea = ({
  // Left panel props
  activeSection,
  userInputs,
  handleInputChange,
  localSectionContent,
  isAnyAiLoading,
  activeApproach,
  activeDataMethod,
  setActiveSectionWithManualFlag,
  handleApproachToggle,
  handleDataMethodToggle,
  sectionRefs,
  handleEdit,
  handleSignificantEdit,
  sectionsWithFeedback = [], // New prop to track sections with feedback
  
  // Right panel props
  sectionDataForPanel,
  handleMagic
}) => {
  return (
    <div style={{ paddingTop: '40px' }}>
      <div className="flex">
        {/* Left panel with sections */}
        <LeftPanel 
          activeSection={activeSection}
          userInputs={userInputs}
          handleInputChange={handleInputChange}
          localSectionContent={localSectionContent}
          isAnyAiLoading={isAnyAiLoading}
          activeApproach={activeApproach}
          activeDataMethod={activeDataMethod}
          setActiveSectionWithManualFlag={setActiveSectionWithManualFlag}
          handleApproachToggle={handleApproachToggle}
          handleDataMethodToggle={handleDataMethodToggle}
          sectionRefs={sectionRefs}
          handleEdit={handleEdit}
          handleSignificantEdit={handleSignificantEdit}
          handleMagic={handleMagic}
          sectionsWithFeedback={sectionsWithFeedback}
        />
      </div>

      {/* Right panel with instructions */}
      <FullHeightInstructionsPanel
        currentSection={sectionDataForPanel}
        improveInstructions={handleMagic}
        loading={isAnyAiLoading}
      />

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm mt-6 border-t border-gray-200 pt-3 pb-3 bg-white">
        <p>
          Scientific Project Planner • Designed with Love for Researchers by Konrad @Kordinglab • {new Date().getFullYear()}
          <span className="mx-2">•</span>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('openPrivacyPolicy'))}
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Privacy Policy
          </button>
        </p>
      </div>
    </div>
  );
};

export default ContentArea;
