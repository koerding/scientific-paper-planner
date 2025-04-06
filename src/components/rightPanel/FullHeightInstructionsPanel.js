// FILE: src/components/rightPanel/FullHeightInstructionsPanel.js
import React, { useState, useEffect } from 'react'; // Removed useState as lastClickTime is gone
import ReactMarkdown from 'react-markdown';

/**
 * Enhanced full-height instructions panel
 * REVERTED: Using original fixed positioning logic.
 * REMOVED: Internal feedback button (now floating).
 */
const FullHeightInstructionsPanel = ({
  currentSection,
  userInputs,
  // Removed improveInstructions and loading props
}) => {

  // Removed lastClickTime state

  useEffect(() => {
    // Debug logging (optional)
    // if (currentSection) { console.log("[PANEL Original] Current section data:", currentSection?.id); }
  }, [currentSection]);

  // Removed handleMagicClick handler

  /**
   * Returns fallback instructions based on section ID
   */
  function getFallbackInstructions(section) {
    if (!section || !section.id) return '';
    const sectionId = section.id;
    const sectionTitle = section.title || 'Section';
    const baseInstructions = `A good ${sectionTitle} is critical to a strong research paper...`; // Truncated for brevity
    // Switch statement with cases for different sections (content as in original file)
    switch(sectionId) {
       case 'question': return `${baseInstructions}\n\n* Specify your question clearly...`;
       // ... other cases from original file ...
       default: return `${baseInstructions}\n\n* Be specific and clear...`;
     }
  }

  // Check if the text is a placeholder
  const isPlaceholder = (text) => {
    if (!text || text.trim() === '') return true;
    if (text.length < 40) return true;
    const knownPlaceholders = ["Remove points", "addressed all key points", "remove points the user has already addressed", "congratulatory message"];
    return knownPlaceholders.some(phrase => text.toLowerCase().includes(phrase.toLowerCase()));
  };

  // Safely access instruction text
  const getInstructionsText = () => {
    if (!currentSection || !currentSection.instructions || typeof currentSection.instructions.text !== 'string') {
      return getFallbackInstructions(currentSection);
    }
    const rawText = currentSection.instructions.text;
    if (isPlaceholder(rawText)) {
      return getFallbackInstructions(currentSection);
    }
    return rawText;
  };

  // Safely access feedback text
  const feedbackText = currentSection?.instructions?.feedback || '';

  // Create panel title
  const sectionTitle = currentSection?.title || "Instructions";
  const panelTitle = `${sectionTitle} Instructions & Feedback`;

  // Custom styles for markdown (using original values)
  const customStyles = {
    fontSize: 'text-xl leading-relaxed',
    content: 'prose-xl prose-blue max-w-none',
    heading: 'text-2xl font-semibold my-4',
    divider: 'border-t border-blue-200 my-6',
    listItem: 'my-3',
  };

  const instructionsText = getInstructionsText();

  // Original fixed positioning logic
  const panelStyle = {
      position: 'fixed',
      top: 0,
      right: 0,
      width: '50%', // Original width
      paddingTop: '120px', // Original padding top
      paddingBottom: '2rem', // Original padding bottom
      zIndex: 10, // Original z-index
      height: '100vh' // Ensure it takes full viewport height before internal scroll
  };

  return (
    // Using original classes and calculated style
    <div
      className="bg-blue-50 border-l-4 border-blue-500 overflow-y-auto" // Original classes + overflow
      style={panelStyle}
    >
      {/* Using original inner padding */}
      <div className="px-6 py-4 relative">
        {!currentSection ? (
           <div className="flex items-center justify-center h-full" style={{minHeight: 'calc(100vh - 120px - 2rem - 2rem)'}}> {/* Approx calculation for centering */}
            <p className="text-blue-600 text-xl">Select a section to view instructions</p>
          </div>
        ) : (
          <>
            {/* Header Area - Button is removed */}
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-3xl font-semibold text-blue-800 flex-grow mr-4">
                {panelTitle}
              </h3>
              {/* Removed the button element */}
            </div>

            {/* Render Instructions */}
            {instructionsText ? (
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
        )}
      </div>
    </div>
  );
};


// --- Helper Components (Assume unchanged from original file) ---

function fixNumberedLists(text) { /* ... implementation from original file ... */ }
const StyledMarkdown = ({ content, customStyles }) => { /* ... implementation from original file ... */ };

export default FullHeightInstructionsPanel;
