// FILE: src/components/rightPanel/FullHeightInstructionsPanel.js
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Enhanced full-height instructions panel
 * REVERTED: Styling back to card-like to match flexbox layout.
 * REVERTED: Removed fixed positioning. Feedback button is external.
 */
const FullHeightInstructionsPanel = ({
  currentSection,
  userInputs,
  // Removed props related to feedback button (improveInstructions, loading)
}) => {

  useEffect(() => { /* Optional debug logging */ }, [currentSection]);

  // Removed feedback button handler/state

  function getFallbackInstructions(section) { /* ... implementation ... */ }
  const isPlaceholder = (text) => { /* ... implementation ... */ };
  const getInstructionsText = () => { /* ... implementation ... */ };
  const feedbackText = currentSection?.instructions?.feedback || '';
  const sectionTitle = currentSection?.title || "Instructions";
  const panelTitle = `${sectionTitle} Instructions & Feedback`;
  // Restore custom styles consistent with card layout
  const customStyles = {
    fontSize: 'text-lg leading-relaxed',
    content: 'prose-lg prose-blue max-w-none',
    heading: 'text-xl font-semibold my-3',
    divider: 'border-t border-blue-200 my-4',
    listItem: 'my-2',
  };
  const instructionsText = getInstructionsText();

  return (
    // Card-like styling matching SectionCard, fills container height
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full overflow-y-auto p-5">
      <div className="relative">
        {!currentSection ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 text-lg">Select a section to view instructions</p>
          </div>
        ) : (
          <>
            {/* Header Area (no button) */}
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-semibold text-gray-800 flex-grow mr-4">
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
              <p className="text-gray-500 text-lg mb-6">Instructions not available for this section.</p>
            )}

            {/* Render Feedback Section */}
            {feedbackText && feedbackText.length > 5 && (
              <div className="mt-6 pt-4 border-t border-gray-300">
                <h4 className="text-xl font-semibold text-gray-700 mb-3">Feedback</h4>
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
