// FILE: src/components/layout/LeftPanel.js

import React from 'react';
import HeaderCard from '../sections/HeaderCard';
import SectionControls from '../controls/SectionControls';
import SectionCard from '../sections/SectionCard';
import ResearchApproachToggle from '../toggles/ResearchApproachToggle';
import DataAcquisitionToggle from '../toggles/DataAcquisitionToggle';
import { 
  shouldDisplaySection,
  getVisibleSectionsInDisplayOrder,
  getApproachSectionIds,
  getDataMethodSectionIds
} from '../../utils/sectionOrderUtils';

/**
 * Left panel component that manages rendering sections and toggles
 * FIXED: Uses centralized section order configuration
 */
const LeftPanel = ({ 
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
  handleMagic, // Included to support section feedback
  sectionsWithFeedback = [] // New prop to track which sections have feedback
}) => {
  // Helper to get all visible section IDs for the section controls
  const getAllVisibleSectionIds = () => {
    const visibleIds = [];
    
    if (Array.isArray(localSectionContent?.sections)) {
      localSectionContent.sections.forEach(section => {
        if (section?.id && shouldDisplaySection(section.id, activeApproach, activeDataMethod)) {
          visibleIds.push(section.id);
        }
      });
    }
    
    return visibleIds;
  };
  
  // Handle feedback request for a specific section
  const handleSectionFeedback = (sectionId) => {
    if (handleMagic && typeof handleMagic === 'function') {
      console.log(`Requesting feedback for section: ${sectionId}`);
      // Call the magic function with the section ID
      handleMagic(sectionId);
    }
  };
  
  // Rendering function for a section
  const renderSection = (section) => {
    if (!section || !section.id) return null;
    
    const isCurrentActive = activeSection === section.id;
    const hasFeedback = sectionsWithFeedback.includes(section.id);
    
    return (
      <SectionCard
        key={section.id}
        section={section}
        isCurrentSection={isCurrentActive}
        userInputs={userInputs}
        handleInputChange={handleInputChange}
        loading={isAnyAiLoading}
        sectionRef={sectionRefs.current[section.id]}
        onClick={() => setActiveSectionWithManualFlag(section.id)}
        onEdit={handleEdit}
        onSignificantEdit={handleSignificantEdit}
        onRequestFeedback={handleSectionFeedback}
        hasFeedback={hasFeedback}
      />
    );
  };
  
  // Get section IDs by category
  const approachSectionIds = getApproachSectionIds();
  const dataMethodSectionIds = getDataMethodSectionIds();
  
  // Get sections in display order, filtering for visibility
  const visibleSections = getVisibleSectionsInDisplayOrder(
    localSectionContent?.sections || [],
    activeApproach,
    activeDataMethod
  );
  
  // Group sections for inserting toggles between them
  const questionSection = visibleSections.find(section => section.id === 'question');
  const approachSection = visibleSections.find(section => approachSectionIds.includes(section.id));
  const audienceSection = visibleSections.find(section => section.id === 'audience');
  const relatedPapersSection = visibleSections.find(section => section.id === 'relatedpapers');
  const dataMethodSection = visibleSections.find(section => dataMethodSectionIds.includes(section.id));
  const remainingSections = visibleSections.filter(section => 
    ['analysis', 'process', 'abstract'].includes(section.id)
  );
  
  return (
    <div className="w-half px-4 py-2" style={{ width: '50%' }}>
      <HeaderCard />
      
      {/* Section minimization controls */}
      <SectionControls 
        sectionIds={getAllVisibleSectionIds()} 
        onStateChange={() => {
          // Force a re-render
        }}
      />
      
      {/* Display Research Question first */}
      {questionSection && renderSection(questionSection)}

      {/* Research Approach Toggle */}
      <ResearchApproachToggle
        activeApproach={activeApproach}
        setActiveApproach={handleApproachToggle}
      />

      {/* Display active approach section */}
      {approachSection && renderSection(approachSection)}

      {/* Target Audience section */}
      {audienceSection && renderSection(audienceSection)}

      {/* Related Papers Section */}
      {relatedPapersSection && renderSection(relatedPapersSection)}

      {/* Data Acquisition Toggle */}
      <DataAcquisitionToggle
        activeMethod={activeDataMethod}
        setActiveMethod={handleDataMethodToggle}
      />

      {/* Display active data acquisition section */}
      {dataMethodSection && renderSection(dataMethodSection)}

      {/* Display remaining sections */}
      {remainingSections.map(section => renderSection(section))}
    </div>
  );
};

export default LeftPanel;
