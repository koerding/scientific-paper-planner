// FILE: src/components/layout/LeftPanel.js

import React from 'react';
import HeaderCard from '../sections/HeaderCard';
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
 * UPDATED: Removed unused SectionControls component
 * UPDATED: Now passes last feedback times to track edits after feedback
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
  feedbackRatings = {}, // Object mapping section IDs to ratings
  lastFeedbackTimes = {} // Object mapping section IDs to last feedback timestamp
}) => {
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
    const lastFeedbackTime = lastFeedbackTimes[section.id] || null; // Get last feedback time
    
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
        feedbackRating={feedbackRating}
        lastFeedbackTime={lastFeedbackTime} // Pass last feedback time
        hasOnlyPlaceholder={hasOnlyPlaceholder}
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
