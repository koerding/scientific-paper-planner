// FILE: src/components/rightPanel/FullHeightInstructionsPanel.js
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Enhanced full-height instructions panel
 * UPDATED: Added guard clause for missing initial currentSection prop.
 */
const FullHeightInstructionsPanel = ({
  currentSection,
  userInputs,
}) => {

  // Original fixed positioning logic (constants can be defined outside if preferred)
  const topOffset = '120px'; // Matching original style
  const bottomOffset = '2rem';
  const panelWidth = '50%';
  const calculatedHeight = `calc(100vh - ${topOffset} - ${bottomOffset})`;
  const panelStyle = {
      position: 'fixed', top: 0, right: 0, width: panelWidth,
      paddingTop: topOffset, paddingBottom: bottomOffset,
      zIndex: 10, height: '100vh' // Use 100vh for parent, internal div scrolls
  };
   const innerMinHeight = `calc(100vh - ${topOffset} - ${bottomOffset} - 4rem)`; // Estimate padding for centering placeholder

  // --- GUARD CLAUSE ---
  // If currentSection is not available on initial render, show placeholder
  if (!currentSection || !currentSection.id) {
    console.log("[PANEL GUARD] No currentSection or currentSection.id yet, showing placeholder.");
    return (
      <div
        className="bg-blue-50 border-l-4 border-blue-500 overflow-y-auto" // Keep styling consistent
        style={panelStyle}
      >
         {/* Inner padding applied manually now */}
         <div className="px-6 py-4 relative flex items-center justify-center" style={{minHeight: innerMinHeight}}>
           <p className="text-blue-600 text-xl">Select a section to view instructions</p>
         </div>
      </div>
    );
  }
  // --- END GUARD CLAUSE ---


  // If we get here, currentSection should be valid
  useEffect(() => {
    // Debug logging (optional)
    // console.log(`[PANEL RENDER] Rendering for section ID: ${currentSection?.id}`);
  }, [currentSection]);


  function getFallbackInstructions(section) { /* ... */ }
  const isPlaceholder = (text) => { /* ... */ };

  // Safely access instruction text - less complex now due to guard clause
  const getInstructionsText = () => {
    // currentSection is guaranteed to exist here
    if (!currentSection.instructions || typeof currentSection.instructions.text !== 'string') {
      console.warn(`[getInstructionsText] Instructions text missing/invalid for ${currentSection.id}, using fallback.`);
      return getFallbackInstructions(currentSection);
    }
    const rawText = currentSection.instructions.text;
    if (isPlaceholder(rawText)) {
      console.log(`[getInstructionsText] Text for ${currentSection.id} is placeholder, using fallback.`);
      return getFallbackInstructions(currentSection);
    }
    return rawText;
  };

  const feedbackText = currentSection?.instructions?.feedback || '';
  const sectionTitle = currentSection.title; // Can access directly now
  const panelTitle = `${sectionTitle} Instructions & Feedback`;
  const customStyles = { /* ... */ };
  const instructionsText = getInstructionsText();

  // Logging from previous step (can be removed if issue is resolved)
  // console.log(`[PANEL RENDER LOG] Active Section ID: ${currentSection?.id}`);
  // console.log(`[PANEL RENDER LOG] Prop 'currentSection' object:`, currentSection);
  // console.log(`[PANEL RENDER LOG] Result of getInstructionsText() length:`, instructionsText?.length ?? 'N/A');

  return (
    <div
      className="bg-blue-50 border-l-4 border-blue-500 overflow-y-auto"
      style={panelStyle}
    >
      {/* Inner padding applied manually now */}
      <div className="px-6 py-4 relative">
        {/* No need for !currentSection check here due to guard clause */}
          <>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-3xl font-semibold text-blue-800 flex-grow mr-4">
                {panelTitle}
              </h3>
            </div>

            {/* Render Instructions */}
            {instructionsText && instructionsText.length > 10 ? ( // Basic check for non-empty/non-trivial instructions
              <div className={`${customStyles.content} instructions-content mb-6`}>
                <StyledMarkdown
                  content={instructionsText}
                  customStyles={customStyles}
                />
              </div>
            ) : (
              <p className="text-blue-600 text-xl mb-6">Instructions not available for this section.</p>
            )}

            {/* Render Feedback Section */}
            {feedbackText && feedbackText.length > 5 && (
              <div className="mt-6 pt-4 border-t border-blue-300">
                <h4 className="text-2xl font-semibold text-blue-700 mb-3">Feedback</h4>
                <div className={`${customStyles.content} feedback-content`}>
                  <StyledMarkdown
                    content={fixNumberedLists(feedbackText)}
                    customStyles={customStyles}
                  />
                </div>
              </div>
            )}
          </>
      </div>
    </div>
  );
};


// --- Helper Components (Assume unchanged) ---
function fixNumberedLists(text) { /* ... */ }
const StyledMarkdown = ({ content, customStyles }) => { /* ... */ };

export default FullHeightInstructionsPanel;
