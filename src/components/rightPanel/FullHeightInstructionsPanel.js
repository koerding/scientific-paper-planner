import React, { useEffect } from 'react';

/**
 * Debug version to check JSON structure and content access
 */
const FullHeightInstructionsPanel = ({ currentSection }) => {
  // Extensive debugging on mount and when section changes
  useEffect(() => {
    console.log("=====================================");
    console.log("FULL HEIGHT PANEL - DETAILED DEBUGGING");
    console.log("=====================================");
    
    if (!currentSection) {
      console.warn("No currentSection provided to FullHeightInstructionsPanel");
      return;
    }
    
    // Check section structure
    console.log("Current section ID:", currentSection.id);
    console.log("Current section title:", currentSection.title);
    console.log("Full section object structure:", currentSection);
    
    // Looking at JSON structure based on what you shared
    console.log("Does section have 'introText'?", !!currentSection.introText);
    console.log("introText content:", currentSection.introText);
    
    console.log("Does section have 'subsections'?", Array.isArray(currentSection.subsections));
    if (Array.isArray(currentSection.subsections)) {
      console.log("Number of subsections:", currentSection.subsections.length);
      console.log("First subsection sample:", currentSection.subsections[0]);
    }
    
    // Check the legacy structure too
    console.log("Does section have 'instructions' object?", !!currentSection.instructions);
    if (currentSection.instructions) {
      console.log("instructions.text:", currentSection.instructions.text);
      console.log("instructions.feedback:", currentSection.instructions.feedback);
    }
    
    // Let's see what happens if we try to access both structures
    const introPart = currentSection.introText || "No introText found";
    console.log("Intro part (first 50 chars):", introPart.substring(0, 50));
    
    // Check what we're actually supposed to render
    console.log("What we're supposed to render:");
    if (currentSection.subsections) {
      console.log("- Intro text + subsection array with titles/instructions");
    } else if (currentSection.instructions && currentSection.instructions.text) {
      console.log("- Legacy format with instructions.text");
    } else {
      console.log("- UNKNOWN FORMAT - no clear content to render");
    }
    
    console.log("=====================================");
  }, [currentSection]);

  // Create a title that includes the section name
  const sectionTitle = currentSection?.title || "Instructions";
  const panelTitle = `${sectionTitle} Instructions & Feedback`;

  // Render function to handle both possible JSON structures
  const renderContent = () => {
    if (!currentSection) return null;
    
    // NEW JSON STRUCTURE
    if (currentSection.introText && Array.isArray(currentSection.subsections)) {
      return (
        <>
          {/* Intro Text */}
          <div className="text-xl mb-5 leading-relaxed">
            {currentSection.introText}
          </div>
          
          {/* Subsections */}
          {currentSection.subsections.map((subsection, index) => (
            <div key={index} className="mb-5">
              <div className="text-2xl font-bold text-blue-800 mb-2">
                <strong>{subsection.title}</strong>
              </div>
              <div className="text-xl leading-relaxed">
                {subsection.instruction}
              </div>
            </div>
          ))}
        </>
      );
    }
    
    // LEGACY JSON STRUCTURE
    else if (currentSection.instructions && currentSection.instructions.text) {
      // For legacy structure, just render the raw text with line breaks
      return (
        <div className="text-xl leading-relaxed whitespace-pre-line">
          {currentSection.instructions.text}
        </div>
      );
    }
    
    // NO VALID CONTENT STRUCTURE
    else {
      return (
        <div className="text-red-500">
          <p>No renderable content found in the section data.</p>
          <p>Debug info:</p>
          <pre className="bg-gray-100 p-2 text-xs overflow-auto">
            {JSON.stringify(currentSection, null, 2)}
          </pre>
        </div>
      );
    }
  };

  return (
    <div
      className="bg-blue-50 h-full overflow-y-auto section-instruction-panel"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '50%',
        paddingTop: '120px', // Adjusted for header height
        paddingBottom: '2rem',
        zIndex: 10, // Ensure it's below header buttons if they overlap
      }}
    >
      <div className="px-6 py-4 relative">
        {!currentSection ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-blue-600 text-xl">Select a section to view instructions</p>
          </div>
        ) : (
          <>
            <h3 className="text-3xl font-semibold text-blue-800 mb-4">
              {panelTitle}
            </h3>

            {/* Debug information displayed in UI */}
            <div className="border-2 border-red-300 bg-red-50 rounded-lg p-2 mb-4 text-xs">
              <p><strong>Debug Info:</strong></p>
              <p>Section ID: {currentSection.id || 'missing'}</p>
              <p>Has introText: {currentSection.introText ? 'Yes' : 'No'}</p>
              <p>Has subsections: {Array.isArray(currentSection.subsections) ? `Yes (${currentSection.subsections?.length})` : 'No'}</p>
              <p>Has instructions: {currentSection.instructions ? 'Yes' : 'No'}</p>
              <p>
                Structure type: {
                  (currentSection.introText && Array.isArray(currentSection.subsections)) ? 'NEW JSON' :
                  (currentSection.instructions && currentSection.instructions.text) ? 'LEGACY JSON' : 
                  'UNKNOWN'
                }
              </p>
            </div>

            {/* Instructions panel - handles both JSON structures */}
            <div className="border-4 border-blue-600 rounded-lg bg-white p-5 mb-6">
              {renderContent()}
            </div>

            {/* Feedback section if it exists */}
            {currentSection.instructions?.feedback && currentSection.instructions.feedback.length > 5 && (
              <div className="mt-6 pt-4 border-t border-blue-300">
                <h4 className="text-2xl font-semibold text-blue-700 mb-3">Feedback</h4>
                <div className="border-4 border-blue-500 rounded-lg bg-white p-5">
                  <div className="text-xl leading-relaxed whitespace-pre-line">
                    {currentSection.instructions.feedback}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FullHeightInstructionsPanel;
