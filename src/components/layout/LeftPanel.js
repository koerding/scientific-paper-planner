// FILE: src/components/layout/LeftPanel.js
import React from 'react';
import useAppStore from '../../store/appStore';
import { isSectionVisible, isToggleVisible } from '../../logic/progressionLogic';
import { getVisibleSectionsInDisplayOrder, getApproachSectionIds, getDataMethodSectionIds } from '../../utils/sectionOrderUtils';
import HeaderCard from '../sections/HeaderCard';
import SectionCard from '../sections/SectionCard';
import ResearchApproachToggle from '../toggles/ResearchApproachToggle';
import DataAcquisitionToggle from '../toggles/DataAcquisitionToggle';

// Helper function to render SectionCard
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
    />
  );
};


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


  // --- Derived State & Logic ---
  const allSectionsArray = sections && typeof sections === 'object' ? Object.values(sections) : [];
  const visibleSections = getVisibleSectionsInDisplayOrder(
      allSectionsArray,
      activeToggles.approach,
      activeToggles.dataMethod
  ).filter(section => section && isSectionVisible(section.id, storeState));

  const showApproachToggle = isToggleVisible('approach', storeState);
  const showDataToggle = isToggleVisible('data', storeState);

  const approachSectionIds = getApproachSectionIds();
  const dataMethodSectionIds = getDataMethodSectionIds();
  const questionSection = visibleSections.find(section => section?.id === 'question');
  const approachSection = visibleSections.find(section => section && approachSectionIds.includes(section.id) && section.id === activeToggles.approach);
  const audienceSection = visibleSections.find(section => section?.id === 'audience');
  const relatedPapersSection = visibleSections.find(section => section?.id === 'relatedpapers');
  const dataMethodSection = visibleSections.find(section => section && dataMethodSectionIds.includes(section.id) && section.id === activeToggles.dataMethod);
  const remainingSections = visibleSections.filter(section => section && ['analysis', 'process', 'abstract'].includes(section.id) );
  const totalPossibleSections = 11;
  const sectionsStillLocked = !proMode && visibleSections.length < totalPossibleSections;


  return (
    // --- UPDATED PADDING ---
    // Increased pt-5 to pt-20 (adjust if needed based on actual header height)
    <div className="w-1/2 h-full overflow-y-auto px-4 pt-10 pb-12 box-border flex-shrink-0">
      <HeaderCard />

      {/* Question Section */}
      {questionSection && renderSectionCard(questionSection, activeSection, handleSectionFocus, handleMagic)}

      {/* Research Approach Toggle */}
      {showApproachToggle && (
        <ResearchApproachToggle
          activeApproach={activeToggles.approach}
          setActiveApproach={handleApproachToggle}
        />
      )}

      {/* Active Approach Section */}
      {approachSection && renderSectionCard(approachSection, activeSection, handleSectionFocus, handleMagic)}

      {/* Audience Section */}
      {audienceSection && renderSectionCard(audienceSection, activeSection, handleSectionFocus, handleMagic)}

      {/* Related Papers Section */}
      {relatedPapersSection && renderSectionCard(relatedPapersSection, activeSection, handleSectionFocus, handleMagic)}

      {/* Data Acquisition Toggle */}
      {showDataToggle && (
        <DataAcquisitionToggle
          activeMethod={activeToggles.dataMethod}
          setActiveMethod={handleDataMethodToggle}
        />
      )}

      {/* Active Data Method Section */}
      {dataMethodSection && renderSectionCard(dataMethodSection, activeSection, handleSectionFocus, handleMagic)}

      {/* Remaining Sections */}
      {remainingSections.map(section => renderSectionCard(section, activeSection, handleSectionFocus, handleMagic))}

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
