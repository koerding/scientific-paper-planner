// FILE: src/components/layout/LeftPanel.js
// MODIFIED: Render ToggleHeader directly, separate from SectionCard content

import React, { useEffect } from 'react';
import useAppStore from '../../store/appStore';
import { isSectionVisible, isToggleVisible } from '../../logic/progressionLogic';
import { getVisibleSectionsInDisplayOrder, getApproachSectionIds, getDataMethodSectionIds } from '../../utils/sectionOrderUtils';
import HeaderCard from '../sections/HeaderCard';
import SectionCard from '../sections/SectionCard';
import ToggleHeader from '../sections/ToggleHeader'; // Import ToggleHeader
import sectionContent from '../../data/sectionContent.json';

// Helper function to render a standard SectionCard (still useful)
const renderStandardSectionCard = (section, activeSection, handleSectionFocus, handleMagic) => {
  if (!section || !section.id) return null;
  // Only render if the section state exists (content loaded etc.)
  const sectionState = useAppStore.getState().sections[section.id];
  if (!sectionState) return null;

  const isCurrentActive = activeSection === section.id;
  return (
    <SectionCard
      key={section.id} // Use section ID as key
      sectionId={section.id}
      isCurrentSection={isCurrentActive}
      onRequestFeedback={handleMagic}
      handleSectionFocus={handleSectionFocus}
      isToggleSection={false} // Ensure this is false for standard cards
    />
  );
};


const LeftPanel = ({
  activeSection,
  handleSectionFocus,
  handleApproachToggle,
  handleDataMethodToggle,
  handleMagic,
  proMode,
}) => {
  // --- Select State from Zustand Store ---
  const sections = useAppStore((state) => state.sections); // Still needed for content lookup
  const activeToggles = useAppStore((state) => state.activeToggles);
  const storeState = useAppStore((state) => state);

  // --- Debug Log ---
  useEffect(() => {
    console.log("DEBUG [LeftPanel]: activeToggles updated in store:", activeToggles);
  }, [activeToggles]);
  // ---

  // --- Derived State & Logic ---
  const activeApproachSectionId = activeToggles.approach;
  const activeDataMethodSectionId = activeToggles.dataMethod;
  const sectionDefinitions = sectionContent.sections || [];
  const showApproachToggle = isToggleVisible('approach', storeState);
  const showDataToggle = isToggleVisible('data', storeState);

  // --- Get Section Data (using Zustand state directly) ---
  const getSectionState = (id) => sections[id];

  // --- Options for Toggles ---
  const approachOptions = [ { id: 'hypothesis', label: 'Hypothesis' }, { id: 'needsresearch', label: 'Needs-Based' }, { id: 'exploratoryresearch', label: 'Exploratory' } ];
  const dataMethodOptions = [ { id: 'experiment', label: 'Experiment' }, { id: 'existingdata', label: 'Existing Data' }, { id: 'theorysimulation', label: 'Theory' } ];

  // Find specific standard sections using definitions and check visibility
  const findVisibleStandardSection = (id) => {
      const def = sectionDefinitions.find(s => s.id === id);
      return def && isSectionVisible(id, storeState) ? def : null;
  };
  const questionSectionDef = findVisibleStandardSection('question');
  const audienceSectionDef = findVisibleStandardSection('audience');
  const relatedPapersSectionDef = findVisibleStandardSection('relatedpapers');
  const analysisSectionDef = findVisibleStandardSection('analysis');
  const processSectionDef = findVisibleStandardSection('process');
  const abstractSectionDef = findVisibleStandardSection('abstract');

  // --- Get the active toggle section definitions if they should be visible ---
  const activeApproachSectionDef = sectionDefinitions.find(s => s.id === activeApproachSectionId);
  const activeDataMethodSectionDef = sectionDefinitions.find(s => s.id === activeDataMethodSectionId);

  // --- Pro Mode Info Calculation ---
  // Count visible sections accurately
  let visibleCount = 0;
  if (questionSectionDef) visibleCount++;
  if (showApproachToggle) visibleCount++; // Count the toggle group as one
  if (audienceSectionDef) visibleCount++;
  if (relatedPapersSectionDef) visibleCount++;
  if (showDataToggle) visibleCount++; // Count the toggle group as one
  if (analysisSectionDef) visibleCount++;
  if (processSectionDef) visibleCount++;
  if (abstractSectionDef) visibleCount++;

  const totalPossibleSections = sectionDefinitions.length; // Total sections defined
  const sectionsStillLocked = !proMode && visibleCount < totalPossibleSections;


  return (
    <div className="w-1/2 h-full overflow-y-auto px-4 pt-14 pb-12 box-border flex-shrink-0">
      <HeaderCard />

      {/* Question Section */}
      {questionSectionDef && renderStandardSectionCard(questionSectionDef, activeSection, handleSectionFocus, handleMagic)}

      {/* Approach Toggle Header (Rendered Directly) */}
      {showApproachToggle && (
        <div className="bg-white rounded-md border-2 border-gray-300 p-2 mb-2 shadow-sm toggle-header-container">
           {/* Pass necessary props directly to ToggleHeader */}
           <ToggleHeader
             options={approachOptions}
             activeOption={activeApproachSectionId} // Direct from state
             onToggle={handleApproachToggle}
             // Pass dummy/appropriate values for props ToggleHeader expects from SectionCard context if needed
             // Or modify ToggleHeader to not require them if only used here
             isMinimized={false} // Or manage state if needed
             isHovered={false} // Or manage state if needed
             isFocused={activeSection === activeApproachSectionId} // Base focus on main activeSection
             toggleMinimized={() => { handleSectionFocus(activeApproachSectionId); /* Maybe toggle something else? */ }} // Clicking header focuses card
           />
        </div>
      )}
      {/* Approach Content Section Card (Rendered Separately) */}
      {showApproachToggle && activeApproachSectionDef && renderStandardSectionCard(activeApproachSectionDef, activeSection, handleSectionFocus, handleMagic)}


      {/* Audience Section */}
      {audienceSectionDef && renderStandardSectionCard(audienceSectionDef, activeSection, handleSectionFocus, handleMagic)}

      {/* Related Papers Section */}
      {relatedPapersSectionDef && renderStandardSectionCard(relatedPapersSectionDef, activeSection, handleSectionFocus, handleMagic)}


      {/* Data Method Toggle Header (Rendered Directly) */}
      {showDataToggle && (
         <div className="bg-white rounded-md border-2 border-gray-300 p-2 mb-2 shadow-sm toggle-header-container">
            <ToggleHeader
               options={dataMethodOptions}
               activeOption={activeDataMethodSectionId} // Direct from state
               onToggle={handleDataMethodToggle}
               isMinimized={false}
               isHovered={false}
               isFocused={activeSection === activeDataMethodSectionId}
               toggleMinimized={() => { handleSectionFocus(activeDataMethodSectionId); }}
             />
         </div>
      )}
      {/* Data Method Content Section Card (Rendered Separately) */}
      {showDataToggle && activeDataMethodSectionDef && renderStandardSectionCard(activeDataMethodSectionDef, activeSection, handleSectionFocus, handleMagic)}


      {/* Analysis Section */}
      {analysisSectionDef && renderStandardSectionCard(analysisSectionDef, activeSection, handleSectionFocus, handleMagic)}

      {/* Process Section */}
      {processSectionDef && renderStandardSectionCard(processSectionDef, activeSection, handleSectionFocus, handleMagic)}

      {/* Abstract Section */}
      {abstractSectionDef && renderStandardSectionCard(abstractSectionDef, activeSection, handleSectionFocus, handleMagic)}


      {/* Pro Mode Info */}
      {sectionsStillLocked && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 mt-6">
          {/* ... Pro mode text ... */}
        </div>
      )}
    </div>
  );
};

export default LeftPanel;
