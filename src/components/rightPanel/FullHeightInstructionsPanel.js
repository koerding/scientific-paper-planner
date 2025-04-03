import React from 'react';
import ReactMarkdown from 'react-markdown'; // Keep ReactMarkdown for rendering the merged text

/**
 * Simplified full-height instructions panel with Improve button
 * UPDATED: Renders single 'instructions.text' field using ReactMarkdown.
 */
const FullHeightInstructionsPanel = ({ currentSection, improveInstructions, loading }) => {

  // Log the received currentSection prop (optional, can remove if debugging is done)
  // console.log("[PANEL log] FullHeightInstructionsPanel received currentSection:", JSON.stringify(currentSection?.instructions, null, 2));

  return (
    <div
      className="bg-blue-50 border-l-4 border-blue-500 h-full overflow-y-auto"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '50%',
        paddingTop: '120px',
        paddingBottom: '2rem',
        zIndex: 10
      }}
    >
      <div className="px-6 py-4 relative">
        {!currentSection ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-blue-600 text-xl">Select a section to view instructions</p>
          </div>
        ) : (
          <>
            {/* Use the main instructions title if available */}
            <h3 className="text-2xl font-semibold text-blue-800 mb-4 pr-24">
              {currentSection.instructions?.title || currentSection.title || 'Instructions'}
            </h3>
            <button
              onClick={improveInstructions}
              disabled={loading || !currentSection}
              className={`mb-4 px-4 py-2 rounded-lg text-base font-medium transition-all
                ${loading || !currentSection
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow hover:shadow-md'
                }`}
            >
              {loading ? (
                <span className="flex items-center">
                  {/* SVG spinner */}
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Improving...
                </span>
              ) : 'Improve Instructions'}
            </button>

            {/* Render the single instructions.text field using ReactMarkdown */}
            {currentSection.instructions?.text ? (
              <div className="prose prose-blue max-w-none instructions-content">
                {/* ReactMarkdown will handle paragraph breaks and markdown headings (like ###) */}
                <ReactMarkdown>{currentSection.instructions.text}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-blue-600">Instructions not available for this section.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FullHeightInstructionsPanel;
