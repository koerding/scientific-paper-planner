// FILE: src/components/layout/LeftPanel.js

import React from 'react';
import HeaderCard from '../sections/HeaderCard';
import SectionControls from '../controls/SectionControls';
import SectionCard from '../sections/SectionCard';
import ResearchApproachToggle from '../toggles/ResearchApproachToggle';
import DataAcquisitionToggle from '../toggles/DataAcquisitionToggle';

/**
 * Left panel component that manages rendering sections and toggles
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
  handleSignificantEdit
}) => {
  // Helper to get all visible section IDs for the section controls
  const getAllVisibleSectionIds = () => {
    const visibleIds = [];
    
    if (Array.isArray(localSectionContent?.sections)) {
      localSectionContent.sections.forEach(section => {
        if (section?.id && shouldDisplaySection(section.id)) {
          visibleIds.push(section.id);
        }
      });
    }
    
    return visibleIds;
  };
  
  // Section display logic
  const shouldDisplaySection = (sectionId) => {
    if (sectionId === 'hypothesis' || sectionId === 'needsresearch' || sectionId === 'exploratoryresearch') {
      return sectionId === activeApproach;
    }

    if (sectionId === 'experiment' || sectionId === 'existingdata' || sectionId === 'theorysimulation') {
      return sectionId === activeDataMethod;
    }

    return true; // All other sections are always displayed
  };
  
  // Rendering function for a section
  const renderSection = (section) => {
    if (!section || !section.id) return null;
    if (!shouldDisplaySection(section.id)) return null;

    const isCurrentActive = activeSection === section.id;
    
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
      />
    );
  };
  
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
      {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
        .filter(section => section?.id === 'question')
        .map(section => renderSection(section))}

      {/* Research Approach Toggle */}
      <ResearchApproachToggle
        activeApproach={activeApproach}
        setActiveApproach={handleApproachToggle}
      />

      {/* Display active approach section */}
      {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
        .filter(section => (section?.id === 'hypothesis' || section?.id === 'needsresearch' || section?.id === 'exploratoryresearch'))
        .map(section => renderSection(section))}

      {/* Target Audience section */}
      {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
        .filter(section => section?.id === 'audience')
        .map(section => renderSection(section))}

      {/* Related Papers Section */}
      {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
        .filter(section => section?.id === 'relatedpapers')
        .map(section => renderSection(section))}

      {/* Data Acquisition Toggle */}
      <DataAcquisitionToggle
        activeMethod={activeDataMethod}
        setActiveMethod={handleDataMethodToggle}
      />

      {/* Display active data acquisition section */}
      {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
        .filter(section => (section?.id === 'experiment' || section?.id === 'existingdata' || section?.id === 'theorysimulation'))
        .map(section => renderSection(section))}

      {/* Display remaining sections */}
      {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
        .filter(section => section?.id === 'analysis' || section?.id === 'process' || section?.id === 'abstract')
        .map(section => renderSection(section))}
    </div>
  );
};

export default LeftPanel;
