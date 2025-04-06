// FILE: src/components/rightPanel/FullHeightInstructionsPanel.js
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Enhanced full-height instructions panel
 * UPDATED: Reverted to position:fixed with calculated height and offset.
 * UPDATED: Reverted to original blue styling.
 */
const FullHeightInstructionsPanel = ({
  currentSection,
  userInputs,
  widthClass = 'w-5/12', // Default width, can be passed as prop
  topOffset = '5rem',    // Default top offset, can be passed as prop
  bottomOffset = '2rem' // Space to leave at the bottom
}) => {

  useEffect(() => { /* Optional debug logging */ }, [currentSection]);

  // Removed feedback button handler/state

  function getFallbackInstructions(section) { /* ... implementation ... */ }
  const isPlaceholder = (text) => { /* ... implementation ... */ };
  const getInstructionsText = () => { /* ... implementation ... */ };
  const feedbackText = currentSection?.instructions?.feedback || '';
  const sectionTitle = currentSection?.title || "Instructions";
  const panelTitle = `${sectionTitle} Instructions & Feedback`;
  const customStyles = { /* ... implementation ... */ };
  const instructionsText = getInstructionsText();

  // Calculate height dynamically
  const calculatedHeight = `calc(100vh - ${topOffset} - ${bottomOffset})`;

  return (
    // Using position:fixed, offset props, width prop, and calculated height
    <div
       className={`fixed right-0 overflow-y-auto bg-blue-50 border-l-4 border-blue-500 p-6 ${widthClass} z-10`} // z-index might need adjustment relative to other fixed elements like chat
       style={{
         top: topOffset,
         height: calculatedHeight,
       }}
       >
      {/* Inner content structure remains the same */}
      <div className="relative">
        {!currentSection ? (
          // Centered "Select section" message
          <div className="flex items-center justify-center" style={{minHeight: `calc(${calculatedHeight} - 3rem)`}}> {/* Adjust minHeight if needed */}
            <p className="text-blue-600 text-xl">Select a section to view instructions</p>
          </div>
        ) : (
          <>
            {/* Header Area (no button) */}
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-3xl font-semibold text-blue-800 flex-grow mr-4">
                {panelTitle}
              </h3>
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
              <p className="text-blue-600 text-xl mb-6">Instructions not available for this section.</p> // Blue text style
            )}

            {/* Render Feedback Section */}
            {feedbackText && feedbackText.length > 5 && (
              <div className="mt-6 pt-4 border-t border-blue-300"> {/* Blue border */}
                <h4 className="text-2xl font-semibold text-blue-700 mb-3">Feedback</h4> {/* Blue text */}
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
