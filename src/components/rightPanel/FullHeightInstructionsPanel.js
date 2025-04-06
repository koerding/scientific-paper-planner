// FILE: src/components/rightPanel/FullHeightInstructionsPanel.js
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Enhanced full-height instructions panel
 * UPDATED: Added console logging to debug instruction rendering.
 */
const FullHeightInstructionsPanel = ({
  currentSection,
  userInputs,
}) => {

  useEffect(() => {
    // Optional: Log when the prop *changes*
    // console.log(`[PANEL PROP CHANGE] Received new currentSection prop with ID: ${currentSection?.id}`);
  }, [currentSection]);

  /**
   * Returns fallback instructions based on section ID
   */
  function getFallbackInstructions(section) {
    if (!section || !section.id) return 'Fallback instructions could not be determined (no section).'; // More informative fallback
    const sectionId = section.id;
    const sectionTitle = section.title || 'Section';
    const baseInstructions = `A good ${sectionTitle} is critical...`; // Truncated
    switch(sectionId) {
       // ... cases ...
       default: return `${baseInstructions}\n\n* Be specific...`;
     }
  }

  // Check if the text is a placeholder
  const isPlaceholder = (text) => {
     if (!text || text.trim() === '') return true;
     if (text.length < 40) return true;
     const knownPlaceholders = ["Remove points", "addressed all key points", /* ... */ ];
     return knownPlaceholders.some(phrase => text.toLowerCase().includes(phrase.toLowerCase()));
  };

  // Safely access instruction text
  const getInstructionsText = () => {
    // Add logging inside this function too
    if (!currentSection) {
        console.log("[getInstructionsText] No currentSection provided.");
        return getFallbackInstructions(null);
    }
    if (!currentSection.instructions) {
        console.log(`[getInstructionsText] currentSection (ID: ${currentSection.id}) has no 'instructions' object.`);
        return getFallbackInstructions(currentSection);
    }
     if (typeof currentSection.instructions.text !== 'string') {
         console.log(`[getInstructionsText] currentSection (ID: ${currentSection.id}) instructions.text is not a string.`);
         return getFallbackInstructions(currentSection);
     }

    const rawText = currentSection.instructions.text;
    if (isPlaceholder(rawText)) {
      console.log(`[getInstructionsText] Text for ${currentSection.id} identified as placeholder, using fallback.`);
      return getFallbackInstructions(currentSection);
    }
    // console.log(`[getInstructionsText] Returning raw text for ${currentSection.id}, length: ${rawText.length}`);
    return rawText;
  };

  // Safely access feedback text
  const feedbackText = currentSection?.instructions?.feedback || '';

  // Create panel title
  const sectionTitle = currentSection?.title || "Instructions";
  const panelTitle = `${sectionTitle} Instructions & Feedback`;

  // Custom styles for markdown
  const customStyles = { /* ... */ };

  // *** Add Logging Here ***
  const instructionsText = getInstructionsText(); // Call it once
  console.log(`[PANEL RENDER LOG] Active Section ID: ${currentSection?.id}`);
  console.log(`[PANEL RENDER LOG] Prop 'currentSection' object:`, currentSection); // Log the whole object
  console.log(`[PANEL RENDER LOG] Does prop have instructions object?`, !!(currentSection?.instructions));
  console.log(`[PANEL RENDER LOG] Does prop have instructions.text?`, !!(currentSection?.instructions?.text));
  console.log(`[PANEL RENDER LOG] Length of instructions.text:`, currentSection?.instructions?.text?.length ?? 'N/A');
  console.log(`[PANEL RENDER LOG] Result of getInstructionsText() length:`, instructionsText?.length ?? 'N/A');
  console.log(`[PANEL RENDER LOG] Does prop have feedback text?`, !!feedbackText);
  console.log(`[PANEL RENDER LOG] Length of feedback text:`, feedbackText?.length ?? 'N/A');
  // *** End Logging ***

  // Original fixed positioning logic from the initial fetch
  const panelStyle = {
      position: 'fixed', top: 0, right: 0, width: '50%',
      paddingTop: '120px', paddingBottom: '2rem', zIndex: 10, height: '100vh'
  };

  return (
    <div
      className="bg-blue-50 border-l-4 border-blue-500 overflow-y-auto"
      style={panelStyle}
    >
      <div className="px-6 py-4 relative">
        {!currentSection ? (
           <div className="flex items-center justify-center h-full" style={{minHeight: 'calc(100vh - 120px - 4rem)'}}>
            <p className="text-blue-600 text-xl">Select a section to view instructions</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-3xl font-semibold text-blue-800 flex-grow mr-4">
                {panelTitle}
              </h3>
            </div>

            {/* Render Instructions - Use the variable that includes fallback logic */}
            {instructionsText && instructionsText !== 'Fallback instructions could not be determined (no section).' ? ( // Check if we have valid text
              <div className={`${customStyles.content} instructions-content mb-6`}>
                <StyledMarkdown
                  content={instructionsText}
                  customStyles={customStyles}
                />
              </div>
            ) : (
               // Show this specific message if instructionsText is empty or fallback failed
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
        )}
      </div>
    </div>
  );
};


// --- Helper Components (Assume unchanged) ---
function fixNumberedLists(text) { /* ... */ }
const StyledMarkdown = ({ content, customStyles }) => { /* ... */ };

export default FullHeightInstructionsPanel;
