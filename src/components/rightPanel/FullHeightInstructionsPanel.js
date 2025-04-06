// FILE: src/components/rightPanel/FullHeightInstructionsPanel.js
import React, { useState, useEffect } from 'react'; // Import useState even if not used, good practice if hooks are involved
import ReactMarkdown from 'react-markdown';

/**
 * Enhanced full-height instructions panel
 * FIXED: Moved useEffect hook call to comply with Rules of Hooks.
 */
const FullHeightInstructionsPanel = ({
  currentSection,
  userInputs,
}) => {

  // --- HOOKS CALLED AT TOP LEVEL ---
  useEffect(() => {
    // This useEffect now runs on every render before any checks
    // Debug logging (optional)
    // if (currentSection) { console.log(`[PANEL EFFECT] currentSection prop changed/updated: ${currentSection?.id}`);}
  }, [currentSection]); // Dependency array ensures it runs when currentSection changes

  // Removed useState for lastClickTime as button is external

  // --- Original fixed positioning logic ---
  const topOffset = '120px';
  const bottomOffset = '2rem';
  const panelWidth = '50%';
  const panelStyle = {
      position: 'fixed', top: 0, right: 0, width: panelWidth,
      paddingTop: topOffset, paddingBottom: bottomOffset,
      zIndex: 10, height: '100vh'
  };
  const innerMinHeight = `calc(100vh - ${topOffset} - ${bottomOffset} - 4rem)`;

  // --- GUARD CLAUSE ---
  // If currentSection is not available, return placeholder. This is now safe AFTER hooks.
  if (!currentSection || !currentSection.id) {
    // console.log("[PANEL GUARD] No currentSection or currentSection.id, showing placeholder.");
    return (
      <div
        className="bg-blue-50 border-l-4 border-blue-500 overflow-y-auto"
        style={panelStyle}
      >
         <div className="px-6 py-4 relative flex items-center justify-center" style={{minHeight: innerMinHeight}}>
           <p className="text-blue-600 text-xl">Select a section to view instructions</p>
         </div>
      </div>
    );
  }
  // --- END GUARD CLAUSE ---


  // --- Component Logic (Runs only if currentSection is valid) ---
  function getFallbackInstructions(section) {
    // Should receive a valid section here due to guard clause
    const sectionId = section.id;
    const sectionTitle = section.title || 'Section';
    const baseInstructions = `A good ${sectionTitle} is critical...`; // Truncated
    switch(sectionId) { /* ... cases ... */ }
  }

  const isPlaceholder = (text) => { /* ... */ };

  const getInstructionsText = () => {
    // currentSection is guaranteed by guard clause
    if (!currentSection.instructions || typeof currentSection.instructions.text !== 'string') {
      // console.warn(`[getInstructionsText] Instructions text missing/invalid for ${currentSection.id}, using fallback.`);
      return getFallbackInstructions(currentSection);
    }
    const rawText = currentSection.instructions.text;
    if (isPlaceholder(rawText)) {
      // console.log(`[getInstructionsText] Text for ${currentSection.id} is placeholder, using fallback.`);
      return getFallbackInstructions(currentSection);
    }
    return rawText;
  };

  const feedbackText = currentSection?.instructions?.feedback || '';
  const sectionTitle = currentSection.title; // Safe due to guard clause
  const panelTitle = `${sectionTitle} Instructions & Feedback`;
  const customStyles = { /* Original styles */
    fontSize: 'text-xl leading-relaxed',
    content: 'prose-xl prose-blue max-w-none',
    heading: 'text-2xl font-semibold my-4',
    divider: 'border-t border-blue-200 my-6',
    listItem: 'my-3',
  };
  const instructionsText = getInstructionsText();


  // --- Render Output (Runs only if currentSection is valid) ---
  return (
    <div
      className="bg-blue-50 border-l-4 border-blue-500 overflow-y-auto"
      style={panelStyle}
    >
      <div className="px-6 py-4 relative">
        {/* No need for !currentSection check here */}
          <>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-3xl font-semibold text-blue-800 flex-grow mr-4">
                {panelTitle}
              </h3>
            </div>

            {/* Render Instructions */}
            {instructionsText && instructionsText.length > 10 ? (
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
