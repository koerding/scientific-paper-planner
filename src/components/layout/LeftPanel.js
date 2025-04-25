// FILE: src/components/layout/LeftPanel.js
// REVERTED: Back to rendering SectionCard for toggles with dynamic keys
// (This version is from before the ToggleHeader separation refactor)

import React, { useEffect } from 'react';
import useAppStore from '../../store/appStore';
import { isSectionVisible, isToggleVisible } from '../../logic/progressionLogic';
import { getVisibleSectionsInDisplayOrder, getApproachSectionIds, getDataMethodSectionIds } from '../../utils/sectionOrderUtils';
import HeaderCard from '../sections/HeaderCard';
import SectionCard from '../sections/SectionCard';
import sectionContent from '../../data/sectionContent.json';

// Helper function to render a standard SectionCard
const renderStandardSectionCard = (section, activeSection, handleSectionFocus, handleMagic) => {
  if (!section || !section.id) return null;
  const sectionState = useAppStore.getState().sections[section.id];
  if (!sectionState) return null; // Ensure state exists

  const isCurrentActive = activeSection === section.id;
  return (
    <SectionCard
      key={section.id} // Use section ID as key
      sectionId={section.id}
      isCurrentSection={isCurrentActive}
      onRequestFeedback={handleMagic}
      handleSectionFocus={handleSectionFocus}
      isToggleSection={false} // Explicitly false
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
  const allSectionsArray = sections && typeof sections === 'object' ? Object.values(sections) : [];
  const activeApproachSectionId = activeToggles.approach;
  const activeDataMethodSectionId = activeToggles.dataMethod;
  const sectionDefinitions = sectionContent.sections || [];
  const showApproachToggle = isToggleVisible('approach', storeState);
  const showDataToggle = isToggleVisible('data', storeState);

  // Filter standard sections for rendering
  const standardSectionsToRender = getVisibleSectionsInDisplayOrder(
      allSectionsArray,
      activeApproachSectionId,
      activeDataMethodSectionId
  ).filter(section =>
      section &&
      !getApproachSectionIds().includes(section.id) &&
      !getDataMethodSectionIds().includes(section.id) &&
      isSectionVisible(section.id, storeState)
  );

  // Define options for toggles
  const approachOptions = [ { id: 'hypothesis', label: 'Hypothesis' }, { id: 'needsresearch', label: 'Needs-Based' }, { id: 'exploratoryresearch', label: 'Exploratory' } ];
  const dataMethodOptions = [ { id: 'experiment', label: 'Experiment' }, { id: 'existingdata', label: 'Existing Data' }, { id: 'theorysimulation', label: 'Theory' } ];

  // Find specific standard sections for ordering
  const questionSectionDef = standardSectionsToRender.find(s => s?.id === 'question');
  const audienceSectionDef = standardSectionsToRender.find(s => s?.id === 'audience');
  const relatedPapersSectionDef = standardSectionsToRender.find(s => s?.id === 'relatedpapers');
  const analysisSectionDef = standardSectionsToRender.find(s => s?.id === 'analysis');
  const processSectionDef = standardSectionsToRender.find(s => s?.id === 'process');
  const abstractSectionDef = standardSectionsToRender.find(s => s?.id === 'abstract');

   // Pro Mode Info Calculation
  const totalPossibleSections = sectionDefinitions.length;
  let visibleCount = standardSectionsToRender.length;
  if (showApproachToggle) visibleCount++;
  if (showDataToggle) visibleCount++;
  const sectionsStillLocked = !proMode && visibleCount < totalPossibleSections;

  return (
    <div className="w-1/2 h-full overflow-y-auto px-4 pt-14 pb-12 box-border flex-shrink-0">
      <HeaderCard />

      {/* Question Section */}
      {questionSectionDef && renderStandardSectionCard(questionSectionDef, activeSection, handleSectionFocus, handleMagic)}

      {/* Approach Toggle Section Card */}
      {showApproachToggle && (
        <SectionCard
          key={activeApproachSectionId} // Dynamic key
          sectionId={activeApproachSectionId}
          isCurrentSection={activeSection === activeApproachSectionId}
          onRequestFeedback={handleMagic}
          handleSectionFocus={handleSectionFocus}
          options={approachOptions}
          activeOption={activeApproachSectionId}
          onToggle={handleApproachToggle}
          isToggleSection={true}
        />
      )}

      {/* Audience Section */}
      {audienceSectionDef && renderStandardSectionCard(audienceSectionDef, activeSection, handleSectionFocus, handleMagic)}

      {/* Related Papers Section */}
      {relatedPapersSectionDef && renderStandardSectionCard(relatedPapersSectionDef, activeSection, handleSectionFocus, handleMagic)}

      {/* Data Method Toggle Section Card */}
      {showDataToggle && (
         <SectionCard
           key={activeDataMethodSectionId} // Dynamic key
           sectionId={activeDataMethodSectionId}
           isCurrentSection={activeSection === activeDataMethodSectionId}
           onRequestFeedback={handleMagic}
           handleSectionFocus={handleSectionFocus}
           options={dataMethodOptions}
           activeOption={activeDataMethodSectionId}
           onToggle={handleDataMethodToggle}
           isToggleSection={true}
         />
      )}

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
           <p className="text-sm text-gray-700">
            <span className="font-medium">Progressive Mode:</span> New sections (Hypotheses, Audience, etc) unlock as you complete previous ones with a score of 6 or higher.
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
