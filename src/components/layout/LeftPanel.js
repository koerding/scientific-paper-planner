// FILE: src/components/layout/LeftPanel.js
import React from 'react';
import useAppStore from '../../store/appStore'; // Import the Zustand store
import { isSectionVisible, isToggleVisible } from '../../logic/progressionLogic'; // Import visibility logic
import { getVisibleSectionsInDisplayOrder, getApproachSectionIds, getDataMethodSectionIds } from '../../utils/sectionOrderUtils'; // Keep section ordering utils
import HeaderCard from '../sections/HeaderCard';
import SectionCard from '../sections/SectionCard'; // SectionCard will also be updated
import ResearchApproachToggle from '../toggles/ResearchApproachToggle'; // Toggle will be updated
import DataAcquisitionToggle from '../toggles/DataAcquisitionToggle'; // Toggle will be updated

const LeftPanel = ({
  activeSection, // Focused section ID (local state from parent)
  handleSectionFocus, // Callback to set the focused section ID in parent
  handleApproachToggle, // Callback to set active approach toggle in store
  handleDataMethodToggle, // Callback to set active data method toggle in store
  handleMagic, // Callback to request feedback/improvement
  proMode,
}) => {
  // --- Select State from Zustand Store ---
  const sections = useAppStore((state) => state.sections);
  const activeToggles = useAppStore((state) => state.activeToggles);
  const storeState = useAppStore((state) => state); // Get full state for visibility checks


  // --- Derived State & Logic ---
  const allSectionsArray = Object.values(sections); // Convert sections object to array
  const visibleSections = getVisibleSectionsInDisplayOrder(
      allSectionsArray,
      activeToggles.approach,
      activeToggles.dataMethod
  ).filter(section => section && isSectionVisible(section.id, storeState)); // Filter based on progression/proMode

  const showApproachToggle = isToggleVisible('approach', storeState);
  const showDataToggle = isToggleVisible('data', storeState);

  // Group sections for rendering order
  const approachSectionIds = getApproachSectionIds();
  const dataMethodSectionIds = getDataMethodSectionIds();

  const questionSection = visibleSections.find(section => section?.id === 'question');
  const approachSection = visibleSections.find(section => section && approachSectionIds.includes(section.id));
  const audienceSection = visibleSections.find(section => section?.id === 'audience');
  const relatedPapersSection = visibleSections.find(section => section?.id === 'relatedpapers');
  const dataMethodSection = visibleSections.find(section => section && dataMethodSectionIds.includes(section.id));
  const remainingSections = visibleSections.filter(section =>
    section && ['analysis', 'process', 'abstract'].includes(section.id)
  );

   // Check if any sections are locked (only relevant if not in Pro Mode)
   const totalPossibleSections = 11; // Update if sections change
   const sectionsStillLocked = !proMode && visibleSections.length < totalPossibleSections;

  // Render a single section card
  const renderSection = (section) => {
    if (!section || !section.id) return null;

    const isCurrentActive = activeSection === section.id; // Check against focused section ID

    return (
      <SectionCard
        key={section.id}
        sectionId={section.id} // Pass sectionId instead of full section object
        isCurrentSection={isCurrentActive}
        onRequestFeedback={handleMagic} // Pass feedback handler down
        handleSectionFocus={handleSectionFocus} // Pass focus handler down
      />
    );
  };


  return (
    <div className="w-half px-4 py-2" style={{ width: '50%' }}>
      <HeaderCard />

      {/* Question Section */}
      {questionSection && renderSection(questionSection)}

      {/* Research Approach Toggle */}
      {showApproachToggle && (
        <ResearchApproachToggle
          activeApproach={activeToggles.approach}
          setActiveApproach={handleApproachToggle} // Use callback from parent
        />
      )}

      {/* Active Approach Section */}
      {approachSection && renderSection(approachSection)}

      {/* Audience Section */}
      {audienceSection && renderSection(audienceSection)}

      {/* Related Papers Section */}
      {relatedPapersSection && renderSection(relatedPapersSection)}

      {/* Data Acquisition Toggle */}
      {showDataToggle && (
        <DataAcquisitionToggle
          activeMethod={activeToggles.dataMethod}
          setActiveMethod={handleDataMethodToggle} // Use callback from parent
        />
      )}

      {/* Active Data Method Section */}
      {dataMethodSection && renderSection(dataMethodSection)}

      {/* Remaining Sections */}
      {remainingSections.map(section => renderSection(section))}

        {/* Pro Mode Info - Only shown when Pro Mode is disabled and sections are still locked */}
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
