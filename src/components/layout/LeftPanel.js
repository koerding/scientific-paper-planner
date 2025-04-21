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
 * UPDATED: Added support for feedback ratings
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
  handleMagic,
  sectionsWithFeedback = [], // Array of section IDs with feedback
  feedbackRatings = {} // New prop: Object mapping section IDs to ratings
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
  
  // Check if the section content is just the placeholder
  const isPlaceholderContent = (sectionId) => {
    const content = userInputs[sectionId] || '';
    const section = localSectionContent?.sections?.find(s => s.id === sectionId);
    const placeholder = section?.placeholder || '';
    return content === placeholder || content.trim() === '';
  };
  
  // Rendering function for a section
  const renderSection = (section) => {
    if (!section || !section.id) return null;
    
    const isCurrentActive = activeSection === section.id;
    const hasFeedback = sectionsWithFeedback.includes(section.id);
    const feedbackRating = feedbackRatings[section.id]; // Get rating if available
    
    // Check if this section has only placeholder content
    const hasOnlyPlaceholder = isPlaceholderContent(section.id);
    
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
        feedbackRating={feedbackRating} // Pass the rating to the section card
        hasOnlyPlaceholder={hasOnlyPlaceholder} // Pass whether it's just placeholder content
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
