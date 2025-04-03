import React, { useState } from 'react'; // Removed useEffect as it's no longer needed here
// Removed import for callOpenAI as it's handled by the parent now
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown

/**
 * Simplified full-height instructions panel with Improve button
 * Merges the white and blue boxes into a single blue panel
 * UPDATED: Removed local state and handler for improvement, uses prop now.
 */
const FullHeightInstructionsPanel = ({ currentSection, improveInstructions, loading }) => { // Added improveInstructions and loading props
  // Removed local improving state, using the 'loading' prop from parent now
  // Removed local improvedInstructions state

  // REMOVED: handleImprove function is no longer needed here

  return (
    <div
      className="bg-blue-50 border-l-4 border-blue-500 h-full overflow-y-auto"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '50%', // Adjusted width if needed, ensure it matches your layout
        paddingTop: '120px', // Account for header
        paddingBottom: '2rem',
        zIndex: 10 // Ensure it's below the header buttons if they overlap
      }}
    >
      <div className="px-6 py-4 relative">
        {/* Improve button - Now uses the passed 'improveInstructions' prop */}
        {!currentSection ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-blue-600 text-xl">Select a section to view instructions</p>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-semibold text-blue-800 mb-4 pr-24">
              {currentSection.title}
            </h3>
            <button
              onClick={improveInstructions} // *** CHANGED: Use the prop function ***
              disabled={loading || !currentSection} // Use the loading prop from parent
              className={`mb-4 px-4 py-2 rounded-lg text-base font-medium transition-all
                ${loading || !currentSection
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow hover:shadow-md'
                }`}
            >
              {loading ? ( // Use the loading prop for the button state
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Improving...
                </span>
              ) : 'Improve Instructions'} {/* Updated button text for clarity */}
            </button>
            <div className="prose prose-blue max-w-none instructions-content">
              {/* Always render instructions from the currentSection prop */}
              {currentSection.instructions.description.split('\n\n').map((paragraph, i) => (
                <p key={`desc-${i}`} className="mb-3 text-blue-700 text-lg">{paragraph}</p>
              ))}

              {currentSection.instructions.workStep && currentSection.instructions.workStep.title && (
                <h4 className="font-medium text-blue-800 mt-5 mb-2 text-xl">
                  {currentSection.instructions.workStep.title}
                </h4>
              )}

              {currentSection.instructions.workStep && currentSection.instructions.workStep.content && (
                currentSection.instructions.workStep.content.split('\n\n').map((paragraph, i) => (
                  <p key={`step-${i}`} className="mb-3 text-blue-700 text-lg">{paragraph}</p>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FullHeightInstructionsPanel;
