// FILE: src/components/rightPanel/FullHeightInstructionsPanel.js
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Enhanced full-height instructions panel
 * REVERTED: Styling back to card-like to match flexbox layout.
 * REVERTED: Feedback button moved back inside this panel.
 */
const FullHeightInstructionsPanel = ({
  currentSection,
  userInputs,
  improveInstructions, // Renamed prop for the handler
  loading,             // Prop for loading state
}) => {

  // Restore state for button debounce if needed (or remove if debounce not desired)
  const [lastClickTime, setLastClickTime] = useState(0);

  useEffect(() => { /* Optional debug logging */ }, [currentSection]);

  // Renamed handler to match prop, kept debounce logic
  const handleFeedbackClick = () => {
    const now = Date.now();
    if (now - lastClickTime < 1500) { // Debounce
      console.log("Prevented rapid double-click on feedback button");
      return;
    }
    setLastClickTime(now);

    if (typeof improveInstructions === 'function') {
      try {
        improveInstructions(); // Call the handler passed via prop
      } catch (error) {
        console.error("Error triggering feedback from panel:", error);
      }
    } else {
      console.error("improveInstructions function prop is not valid");
    }
  };

  function getFallbackInstructions(section) { /* ... implementation ... */ }
  const isPlaceholder = (text) => { /* ... implementation ... */ };
  const getInstructionsText = () => {
    // Added guard for safety
    if (!currentSection) return getFallbackInstructions(null);
     if (!currentSection.instructions || typeof currentSection.instructions.text !== 'string') {
      return getFallbackInstructions(currentSection);
    }
    const rawText = currentSection.instructions.text;
    if (isPlaceholder(rawText)) {
      return getFallbackInstructions(currentSection);
    }
    return rawText;
  };
  const feedbackText = currentSection?.instructions?.feedback || '';
  const sectionTitle = currentSection?.title || "Instructions";
  const panelTitle = `${sectionTitle} Instructions & Feedback`;
  // Restore styles consistent with card layout
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
            {/* Header Area - Button re-added */}
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-semibold text-gray-800 flex-grow mr-4">
                {panelTitle}
              </h3>
              {/* Feedback Button re-added here */}
              <button
                  onClick={handleFeedbackClick} // Use renamed handler
                  disabled={loading || !currentSection} // Use loading prop
                  title="Get AI Feedback for all sections with content"
                  className={`px-4 py-2 rounded-lg text-base font-medium transition-all flex-shrink-0 ${
                      loading
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-600 text-white hover:bg-purple-700 shadow hover:shadow-md'
                  }`}
              >
                  {loading ? (
                      <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Getting Feedback...
                      </span>
                  ) : (
                      <span className="flex items-center">
                          <svg className="h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          Get AI Feedback
                      </span>
                  )}
              </button>
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
