// Modified section of VerticalPaperPlannerApp.js

// Inside the render function, replace the left panel div with this updated version:

{/* RESTORED: Left panel with full half-width */}
<div className="w-half px-4 py-2" style={{ width: '50%' }}>
  {/* NEW: Research Plan Header */}
  <h1 className="text-2xl font-bold text-gray-800 mb-4 mt-2">Research Plan</h1>
  
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
    .filter(section => (section?.id === 'hypothesis' || section?.id === 'needsresearch' || section?.id === 'exploratoryresearch') && section?.id === activeApproach)
    .map(section => renderSection(section))}

  {/* MOVED: Target Audience section after Research Approach block */}
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

  {/* Display active data acquisition section - FIXED: Added theorysimulation */}
  {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
    .filter(section => (section?.id === 'experiment' || section?.id === 'existingdata' || section?.id === 'theorysimulation') && section?.id === activeDataMethod)
    .map(section => renderSection(section))}

  {/* Display remaining sections: Analysis, Process, Abstract */}
  {Array.isArray(localSectionContent?.sections) && localSectionContent.sections
    .filter(section => section?.id === 'analysis' || section?.id === 'process' || section?.id === 'abstract')
    .map(section => renderSection(section))}
</div>
