// FILE: src/components/layout/LeftPanel.js
// MODIFIED: Reduced top padding from pt-14 to pt-4

import React, { useEffect } from 'react';
import useAppStore from '../../store/appStore';
import { isSectionVisible, isToggleVisible } from '../../logic/progressionLogic';
import { getVisibleSectionsInDisplayOrder, getApproachSectionIds, getDataMethodSectionIds } from '../../utils/sectionOrderUtils';
import HeaderCard from '../sections/HeaderCard';
import SectionCard from '../sections/SectionCard';
import ToggleHeader from '../sections/ToggleHeader';
import sectionContent from '../../data/sectionContent.json';

// Helper function to render a standard SectionCard
const renderStandardSectionCard = (section, activeSection, handleSectionFocus, handleMagic) => {
  // ... (function remains the same) ...
  if (!section || !section.id) return null;
  const sectionState = useAppStore.getState().sections[section.id];
  if (!sectionState) return null;

  const isCurrentActive = activeSection === section.id;
  return (
    <SectionCard
      key={section.id}
      sectionId={section.id}
      isCurrentSection={isCurrentActive}
      onRequestFeedback={handleMagic}
      handleSectionFocus={handleSectionFocus}
      isToggleSection={false}
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
  const sections = useAppStore((state) => state.sections);
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
  const getSectionState = (id) => sections[id];
  const approachOptions = [ { id: 'hypothesis', label: 'Hypothesis' }, { id: 'needsresearch', label: 'Needs-Based' }, { id: 'exploratoryresearch', label: 'Exploratory' } ];
  const dataMethodOptions = [ { id: 'experiment', label: 'Experiment' }, { id: 'existingdata', label: 'Existing Data' }, { id: 'theorysimulation', label: 'Theory' } ];
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
  const activeApproachSectionDef = sectionDefinitions.find(s => s.id === activeApproachSectionId);
  const activeDataMethodSectionDef = sectionDefinitions.find(s => s.id === activeDataMethodSectionId);
  let visibleCount = 0;
  if (questionSectionDef) visibleCount++;
  if (showApproachToggle) visibleCount++;
  if (audienceSectionDef) visibleCount++;
  if (relatedPapersSectionDef) visibleCount++;
  if (showDataToggle) visibleCount++;
  if (analysisSectionDef) visibleCount++;
  if (processSectionDef) visibleCount++;
  if (abstractSectionDef) visibleCount++;
  const totalPossibleSections = sectionDefinitions.length;
  const sectionsStillLocked = !proMode && visibleCount < totalPossibleSections;


  return (
    // *** MODIFIED PADDING HERE: Changed pt-14 to pt-4 ***
    <div className="w-1/2 h-full overflow-y-auto px-4 pt-4 pb-12 box-border flex-shrink-0">
      <HeaderCard />

      {/* Question Section */}
      {questionSectionDef && renderStandardSectionCard(questionSectionDef, activeSection, handleSectionFocus, handleMagic)}

      {/* Approach Toggle Header */}
      {showApproachToggle && (
        <div className="bg-white rounded-md border-2 border-gray-300 p-2 mb-2 shadow-sm toggle-header-container">
           <ToggleHeader
             options={approachOptions}
             activeOption={activeApproachSectionId}
             onToggle={handleApproachToggle}
             isMinimized={false}
             isHovered={false}
             isFocused={activeSection === activeApproachSectionId}
             toggleMinimized={() => { handleSectionFocus(activeApproachSectionId); }}
           />
        </div>
      )}
      {/* Approach Content Section Card */}
      {showApproachToggle && activeApproachSectionDef && renderStandardSectionCard(activeApproachSectionDef, activeSection, handleSectionFocus, handleMagic)}


      {/* Audience Section */}
      {audienceSectionDef && renderStandardSectionCard(audienceSectionDef, activeSection, handleSectionFocus, handleMagic)}

      {/* Related Papers Section */}
      {relatedPapersSectionDef && renderStandardSectionCard(relatedPapersSectionDef, activeSection, handleSectionFocus, handleMagic)}


      {/* Data Method Toggle Header */}
      {showDataToggle && (
         <div className="bg-white rounded-md border-2 border-gray-300 p-2 mb-2 shadow-sm toggle-header-container">
            <ToggleHeader
               options={dataMethodOptions}
               activeOption={activeDataMethodSectionId}
               onToggle={handleDataMethodToggle}
               isMinimized={false}
               isHovered={false}
               isFocused={activeSection === activeDataMethodSectionId}
               toggleMinimized={() => { handleSectionFocus(activeDataMethodSectionId); }}
             />
         </div>
      )}
      {/* Data Method Content Section Card */}
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
           <p className="text-sm text-gray-700">
            <span className="font-medium">Progressive Mode:</span> New sections unlock as you complete previous ones with a score of 6 or higher.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Enable "Pro Mode" in the header to see all sections immediately.
          </p>
        </div>
      )}
    </div>
  );
};

export default LeftPanel;
