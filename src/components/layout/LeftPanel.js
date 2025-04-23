// src/components/layout/LeftPanel.js
import React, { useState, useEffect } from 'react';
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
import {
  getUnlockedSections,
  isToggleUnlocked,
  isProModeEnabled
} from '../../services/progressionStateService';

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
  // State to track unlocked sections based on progression state
  const [unlockedSections, setUnlockedSections] = useState(['question']);
  const [isApproachToggleUnlocked, setIsApproachToggleUnlocked] = useState(false);
  const [isDataToggleUnlocked, setIsDataToggleUnlocked] = useState(false);
  const [isProMode, setIsProMode] = useState(false);
  
  // Update unlocked sections when progression state changes
  useEffect(() => {
    // Initialize state
    updateUnlockedState();
    
    // Listen for progression state changes
    const handleProgressionChange = () => {
      updateUnlockedState();
    };
    
    const handleProModeChange = (event) => {
      setIsProMode(event.detail.enabled);
      updateUnlockedState(); // Update unlocked state when Pro Mode changes
    };
    
    // Update the unlocked state whenever feedback is provided
    window.addEventListener('progressionStateChanged', handleProgressionChange);
    window.addEventListener('progressionStateReset', handleProgressionChange);
    window.addEventListener('proModeChanged', handleProModeChange);
    
    return () => {
      window.removeEventListener('progressionStateChanged', handleProgressionChange);
      window.removeEventListener('progressionStateReset', handleProgressionChange);
      window.removeEventListener('proModeChanged', handleProModeChange);
    };
  }, []);
  
  // Update the unlocked state
  const updateUnlockedState = () => {
    setUnlockedSections(getUnlockedSections());
    setIsApproachToggleUnlocked(isToggleUnlocked('approach_toggle'));
    setIsDataToggleUnlocked(isToggleUnlocked('data_toggle'));
    setIsProMode(isProModeEnabled());
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
  
  // Check if section should be visible based on progression state
  const isSectionVisible = (sectionId) => {
    // In Pro Mode, all sections are visible
    if (isProMode) return true;
    
    // Otherwise, check if it's in the unlockedSections array
    return unlockedSections.includes(sectionId);
  };
  
// Updated renderSection function in LeftPanel.js
const renderSection = (section) => {
  if (!section || !section.id) return null;
  
  // Check if section should be visible
  if (!isSectionVisible(section.id)) {
    return null; // Skip this section
  }
  
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
      onRequestFeedback={handleSectionFeedback} // Pass the feedback handler
      hasFeedback={hasFeedback}
      feedbackRating={feedbackRating}
      lastFeedbackTime={lastFeedbackTime}
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

      {/* Research Approach Toggle - only if unlocked */}
      {isApproachToggleUnlocked && (
        <ResearchApproachToggle
          activeApproach={activeApproach}
          setActiveApproach={handleApproachToggle}
        />
      )}

      {/* Display active approach section if unlocked */}
      {approachSection && renderSection(approachSection)}

      {/* Target Audience section if unlocked */}
      {audienceSection && renderSection(audienceSection)}

      {/* Related Papers Section if unlocked */}
      {relatedPapersSection && renderSection(relatedPapersSection)}

      {/* Data Acquisition Toggle - only if unlocked */}
      {isDataToggleUnlocked && (
        <DataAcquisitionToggle
          activeMethod={activeDataMethod}
          setActiveMethod={handleDataMethodToggle}
        />
      )}

      {/* Display active data acquisition section if unlocked */}
      {dataMethodSection && renderSection(dataMethodSection)}

      {/* Display remaining sections if unlocked */}
      {remainingSections.map(section => renderSection(section))}
      
      {/* Pro Mode Info - Only shown when Pro Mode is disabled and sections are still locked */}
      {!isProMode && unlockedSections.length < 11 && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 mt-6">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Progressive Mode:</span> New sections unlock as you complete each part with a score of 6 or higher.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Enable "Pro Mode" in the header to see all sections.
          </p>
        </div>
      )}
    </div>
  );
};

export default LeftPanel;
