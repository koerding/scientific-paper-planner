// FILE: src/components/layout/LeftPanel.js
// MODIFIED: Removed renderToggleSection helper and render SectionCards directly

import React, { useEffect } from 'react';
import useAppStore from '../../store/appStore';
import { isSectionVisible, isToggleVisible } from '../../logic/progressionLogic';
import { getVisibleSectionsInDisplayOrder, getApproachSectionIds, getDataMethodSectionIds } from '../../utils/sectionOrderUtils';
import HeaderCard from '../sections/HeaderCard';
import SectionCard from '../sections/SectionCard'; // Keep this import

// Helper function to render a standard SectionCard (still useful)
const renderSectionCard = (section, activeSection, handleSectionFocus, handleMagic) => {
  if (!section || !section.id) return null;
  const isCurrentActive = activeSection === section.id;
  return (
    <SectionCard
      key={section.id}
      sectionId={section.id}
      isCurrentSection={isCurrentActive}
      onRequestFeedback={handleMagic}
      handleSectionFocus={handleSectionFocus}
      // Ensure standard cards don't get toggle props
      isToggleSection={false}
    />
  );
};

// REMOVED the renderToggleSection helper function

const LeftPanel = ({
  activeSection,          // ID string of the currently focused section
  handleSectionFocus,     // Function to call when a section should be focused
  handleApproachToggle,   // Function to call when approach toggle changes
  handleDataMethodToggle, // Function to call when data method toggle changes
  handleMagic,            // Function to call for feedback request
  proMode,                // Boolean indicating if pro mode is active
}) => {
  // --- Select State from Zustand Store ---
  const sections = useAppStore((state) => state.sections);
  const activeToggles = useAppStore((state) => state.activeToggles);
  const storeState = useAppStore((state) => state); // Get full state for visibility checks

  // --- Debug Log (Keep for now) ---
  useEffect(() => {
    console.log("DEBUG [LeftPanel]: activeToggles updated in store:", activeToggles);
  }, [activeToggles]);
  // ---

  // --- Derived State & Logic ---
  const allSectionsArray = sections && typeof sections === 'object' ? Object.values(sections) : [];

  // --- Determine active sections based ONLY on toggles for rendering the toggle cards ---
  const activeApproachSectionId = activeToggles.approach;
  const activeDataMethodSectionId = activeToggles.dataMethod;

  // --- Get section definitions ---
  const sectionDefinitions = sectionContent.sections || []; // Use imported definitions
  const getSectionDef = (id) => sectionDefinitions.find(s => s.id === id) || {};

  // --- Check visibility based on progression/proMode ---
  // Check if the *concept* of toggling is unlocked, not just the specific sections
  const showApproachToggle = isToggleVisible('approach', storeState);
  const showDataToggle = isToggleVisible('data', storeState);

  // Filter sections for rendering standard cards (excluding toggle sections)
  const standardSectionsToRender = getVisibleSectionsInDisplayOrder(
      allSectionsArray,
      activeApproachSectionId,
      activeDataMethodSectionId
  ).filter(section =>
      section &&
      !getApproachSectionIds().includes(section.id) &&
      !getDataMethodSectionIds().includes(section.id) &&
      isSectionVisible(section.id, storeState) // Ensure standard sections are also checked for visibility
  );

  // Define approach and data method toggle options
  const approachOptions = [
    { id: 'hypothesis', label: 'Hypothesis' },
    { id: 'needsresearch', label: 'Needs-Based' },
    { id: 'exploratoryresearch', label: 'Exploratory' }
  ];

  const dataMethodOptions = [
    { id: 'experiment', label: 'Experiment' },
    { id: 'existingdata', label: 'Existing Data' },
    { id: 'theorysimulation', label: 'Theory' }
  ];

  // Find specific standard sections for ordering
  const questionSection = standardSectionsToRender.find(s => s?.id === 'question');
  const audienceSection = standardSectionsToRender.find(s => s?.id === 'audience');
  const relatedPapersSection = standardSectionsToRender.find(s => s?.id === 'relatedpapers');
  const analysisSection = standardSectionsToRender.find(s => s?.id === 'analysis');
  const processSection = standardSectionsToRender.find(s => s?.id === 'process');
  const abstractSection = standardSectionsToRender.find(s => s?.id === 'abstract');

  // Pro Mode Info calculation
  const totalPossibleSections = sectionDefinitions.length;
  const currentlyVisibleCount = standardSectionsToRender.length + (showApproachToggle ? 1 : 0) + (showDataToggle ? 1 : 0);
  const sectionsStillLocked = !proMode && currentlyVisibleCount < totalPossibleSections;


  return (
    <div className="w-1/2 h-full overflow-y-auto px-4 pt-14 pb-12 box-border flex-shrink-0">
      <HeaderCard />

      {/* Question Section */}
      {questionSection && renderSectionCard(questionSection, activeSection, handleSectionFocus, handleMagic)}

      {/* --- Render Approach Toggle Section Card Directly --- */}
      {showApproachToggle && (
        <SectionCard
          key={'approach_toggle_card'} // Use a stable key
          sectionId={activeApproachSectionId} // ID of the section to display content for
          isCurrentSection={activeSection === activeApproachSectionId}
          onRequestFeedback={handleMagic}
          handleSectionFocus={handleSectionFocus}
          options={approachOptions}
          activeOption={activeApproachSectionId} // Pass the active toggle ID
          onToggle={handleApproachToggle}
          isToggleSection={true}
        />
      )}
      {/* --- End Approach Toggle Section --- */}


      {/* Audience Section */}
      {audienceSection && renderSectionCard(audienceSection, activeSection, handleSectionFocus, handleMagic)}

      {/* Related Papers Section */}
      {relatedPapersSection && renderSectionCard(relatedPapersSection, activeSection, handleSectionFocus, handleMagic)}

      {/* --- Render Data Method Toggle Section Card Directly --- */}
      {showDataToggle && (
         <SectionCard
           key={'data_toggle_card'} // Use a stable key
           sectionId={activeDataMethodSectionId} // ID of the section to display content for
           isCurrentSection={activeSection === activeDataMethodSectionId}
           onRequestFeedback={handleMagic}
           handleSectionFocus={handleSectionFocus}
           options={dataMethodOptions}
           activeOption={activeDataMethodSectionId} // Pass the active toggle ID
           onToggle={handleDataMethodToggle}
           isToggleSection={true}
         />
      )}
      {/* --- End Data Method Toggle Section --- */}


      {/* Analysis Section */}
      {analysisSection && renderSectionCard(analysisSection, activeSection, handleSectionFocus, handleMagic)}

      {/* Process Section */}
      {processSection && renderSectionCard(processSection, activeSection, handleSectionFocus, handleMagic)}

      {/* Abstract Section */}
      {abstractSection && renderSectionCard(abstractSection, activeSection, handleSectionFocus, handleMagic)}


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
