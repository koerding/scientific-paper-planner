import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Enhanced full-height instructions panel with section title in header
 * and prefilled analysis of user's current content
 */
const FullHeightInstructionsPanel = ({ 
  currentSection, 
  improveInstructions, 
  loading,
  userInputs // NEW: Pass user inputs to analyze current content
}) => {
  const [lastClickTime, setLastClickTime] = useState(0);
  const [analysisGenerated, setAnalysisGenerated] = useState(false);

  // Function to generate initial analysis of user's content for this section
  useEffect(() => {
    if (currentSection && currentSection.id && userInputs && userInputs[currentSection.id]) {
      // Reset analysis flag when section changes
      setAnalysisGenerated(false);
    }
  }, [currentSection?.id]);

  // Enhanced magic handler (previously improve handler)
  const handleMagicClick = () => {
    console.log("Magic button clicked!", new Date().toISOString());
    const now = Date.now();
    if (now - lastClickTime < 1500) { // Increase debounce slightly
      console.log("Prevented rapid double-click");
      return;
    }
    setLastClickTime(now);

    if (typeof improveInstructions === 'function') {
      try {
        improveInstructions();
        // After magic is clicked, set that analysis has been generated
        setAnalysisGenerated(true);
      } catch (error) {
        console.error("Error triggering magic:", error);
        // Optionally show an error message to the user here
      }
    } else {
      console.error("improveInstructions is not a function");
    }
  };

  // Get the section content for analysis
  const userContent = currentSection && currentSection.id && userInputs ? 
    userInputs[currentSection.id] : '';

  // Basic analysis of user content length compared to template
  const getBasicContentAnalysis = () => {
    if (!userContent || !currentSection || !currentSection.placeholder) {
      return "Please begin working on this section.";
    }

    if (userContent === currentSection.placeholder) {
      return "You haven't started this section yet. The template is provided to help you get started.";
    }

    // Check how much they've written compared to template
    const templateLength = currentSection.placeholder.length;
    const contentLength = userContent.length;
    
    if (contentLength < templateLength * 1.2) {
      return "You've begun work on this section, but there's still room to expand your content. Consider using the magic button for more specific feedback.";
    } else if (contentLength < templateLength * 2) {
      return "You've made good progress on this section. Use the magic button for detailed feedback on how to improve it further.";
    } else {
      return "You've written substantial content for this section. Use the magic button to check if you've addressed all requirements.";
    }
  };

  const instructionsText = currentSection?.instructions?.text;
  const feedbackText = currentSection?.instructions?.feedback; // Get potential feedback

  // Create a title that includes the section name
  const sectionTitle = currentSection?.title || "Instructions";
  const panelTitle = `${sectionTitle} Instructions & Feedback`;

  return (
    <div
      className="bg-blue-50 border-l-4 border-blue-500 h-full overflow-y-auto"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '50%',
        paddingTop: '120px', // Adjusted for header height
        paddingBottom: '2rem',
        zIndex: 10 // Ensure it's below header buttons if they overlap
      }}
    >
      <div className="px-6 py-4 relative">
        {!currentSection ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-blue-600 text-xl">Select a section to view instructions</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-semibold text-blue-800 flex-grow mr-4">
                {panelTitle}
              </h3>
              <button
                onClick={handleMagicClick}
                disabled={loading || !currentSection}
                className={`px-4 py-2 rounded-lg text-base font-medium transition-all flex-shrink-0 ${ // Prevent button shrinking
                  loading || !currentSection
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
                    Magic in progress...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Magic
                  </span>
                )}
              </button>
            </div>

            {/* Auto-generated Analysis/Status (before Magic is clicked) */}
            {!analysisGenerated && !feedbackText && (
              <div className="mb-6 p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
                <h4 className="text-lg font-medium text-blue-700 mb-2">Current Status:</h4>
                <p className="text-gray-700">
                  {getBasicContentAnalysis()}
                </p>
              </div>
            )}

            {/* Render Instructions */}
            {instructionsText ? (
              <div className="prose prose-blue max-w-none instructions-content mb-6">
                <ReactMarkdown>{instructionsText}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-blue-600 mb-6">Instructions not available for this section.</p>
            )}

            {/* Render Feedback Section if it exists */}
            {feedbackText && (
              <div className="mt-6 pt-4 border-t border-blue-300">
                 {/* Use h3 or h4 for semantic structure, ReactMarkdown handles # */}
                <h4 className="text-xl font-semibold text-blue-700 mb-3">Feedback</h4>
                <div className="prose prose-blue max-w-none feedback-content">
                  <ReactMarkdown>{feedbackText}</ReactMarkdown>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FullHeightInstructionsPanel;
