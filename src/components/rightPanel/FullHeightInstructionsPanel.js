// Add this function to FullHeightInstructionsPanel.js to log when the button is clicked
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Simplified full-height instructions panel with Improve button
 * UPDATED: Added debug logging and feedback for button clicks
 */
const FullHeightInstructionsPanel = ({ currentSection, improveInstructions, loading }) => {
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showDebugMessage, setShowDebugMessage] = useState(false);
  const [debugMessage, setDebugMessage] = useState('');

  // Enhanced improve handler with debug logging
  const handleImproveClick = () => {
    console.log("Improve button clicked!", new Date().toISOString());
    
    // Prevent double-clicks
    const now = Date.now();
    if (now - lastClickTime < 1000) {
      console.log("Prevented double-click");
      return;
    }
    setLastClickTime(now);
    
    // Show visual feedback
    setDebugMessage("Processing instruction improvement...");
    setShowDebugMessage(true);
    
    // Call the actual improve function
    if (typeof improveInstructions === 'function') {
      try {
        improveInstructions();
        // The loading state should be managed by the parent
      } catch (error) {
        console.error("Error during improvement:", error);
        setDebugMessage(`Error: ${error.message}`);
      }
    } else {
      console.error("improveInstructions is not a function");
      setDebugMessage("Error: Improve function not available");
    }
    
    // Hide debug message after some time
    setTimeout(() => {
      setShowDebugMessage(false);
    }, 5000);
  };

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
            
            {/* Debug message */}
            {showDebugMessage && (
              <div className="p-2 mb-4 bg-yellow-100 border border-yellow-300 rounded text-yellow-800">
                {debugMessage}
              </div>
            )}
            
            <button
              onClick={handleImproveClick}
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
