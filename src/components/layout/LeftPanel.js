// FILE: src/components/layout/LeftPanel.js
import React, { useEffect } from 'react'; // Import useEffect
import useAppStore from '../../store/appStore';
import { isSectionVisible, isToggleVisible } from '../../logic/progressionLogic';
import { getVisibleSectionsInDisplayOrder, getApproachSectionIds, getDataMethodSectionIds } from '../../utils/sectionOrderUtils';
import HeaderCard from '../sections/HeaderCard';
import SectionCard from '../sections/SectionCard';

// Helper function to render a standard SectionCard
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

// Helper function to render a toggle section
const renderToggleSection = (
  sectionId,
  options,
  activeOptionId,
  handleToggle,
  activeSection,
  handleSectionFocus,
  handleMagic
) => {
  if (!options || options.length === 0) return null;
  const isCurrentActive = activeSection === activeOptionId;

  return (
    <SectionCard
      key={sectionId} // Use a stable key for the toggle group itself
      sectionId={activeOptionId} // Pass the *active* section ID for content rendering
      isCurrentSection={isCurrentActive}
      onRequestFeedback={handleMagic}
      handleSectionFocus={handleSectionFocus}
      options={options}
      activeOption={activeOptionId} // Explicitly pass the active option for styling
      onToggle={handleToggle}
      isToggleSection={true}
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

  // --- ADD THIS useEffect for Debugging ---
  useEffect(() => {
    console.log("DEBUG [LeftPanel]: activeToggles updated in store:", activeToggles);
  }, [activeToggles]);
  // --- END ADD ---

  // --- Derived State & Logic ---
  const allSectionsArray = sections && typeof sections === 'object' ? Object.values(sections) : [];
  const visibleSections = getVisibleSectionsInDisplayOrder(
      allSectionsArray,
      activeToggles.approach,
      activeToggles.dataMethod
  ).filter(section => section && isSectionVisible(section.id, storeState));

  const showApproachToggle = isToggleVisible('approach', storeState);
  const showDataToggle = isToggleVisible('data', storeState);

  // Define approach and data method toggle options with shortened labels
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

  const approachSectionIds = getApproachSectionIds();
  const dataMethodSectionIds = getDataMethodSectionIds();
  const questionSection = visibleSections.find(section => section?.id === 'question');
  const audienceSection = visibleSections.find(section => section?.id === 'audience');
  const relatedPapersSection = visibleSections.find(section => section?.id === 'relatedpapers');
  const remainingSections = visibleSections.filter(section =>
    section &&
    ['analysis', 'process', 'abstract'].includes(section.id)
  );

  const totalPossibleSections = 11; // Update if total sections change
  const sectionsStillLocked = !proMode && visibleSections.length < totalPossibleSections;

  return (
    <div className="w-1/2 h-full overflow-y-auto px-4 pt-14 pb-12 box-border flex-shrink-0">
      <HeaderCard />

      {/* Question Section */}
      {questionSection && renderSectionCard(questionSection, activeSection, handleSectionFocus, handleMagic)}

      {/* Research Approach Toggle Section */}
      {showApproachToggle && renderToggleSection(
        'approach_toggle', // Stable key for the toggle group
        approachOptions,
        activeToggles.approach, // Pass the active toggle ID from store
        handleApproachToggle,
        activeSection,
        handleSectionFocus,
        handleMagic
      )}

      {/* Audience Section */}
      {audienceSection && renderSectionCard(audienceSection, activeSection, handleSectionFocus, handleMagic)}

      {/* Related Papers Section */}
      {relatedPapersSection && renderSectionCard(relatedPapersSection, activeSection, handleSectionFocus, handleMagic)}

      {/* Data Acquisition Toggle Section */}
      {showDataToggle && renderToggleSection(
        'data_toggle', // Stable key for the toggle group
        dataMethodOptions,
        activeToggles.dataMethod, // Pass the active toggle ID from store
        handleDataMethodToggle,
        activeSection,
        handleSectionFocus,
        handleMagic
      )}

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
