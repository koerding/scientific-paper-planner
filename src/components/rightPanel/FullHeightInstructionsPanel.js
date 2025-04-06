import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import ReactMarkdown from 'react-markdown';

/**
 * Enhanced full-height instructions panel
 * UPDATED: Added onboarding highlight/tooltip for feedback button
 */
const FullHeightInstructionsPanel = ({
  currentSection,
  improveInstructions,
  loading,
  userInputs,
  onboardingStep // Receive onboarding state
}) => {
  const [lastClickTime, setLastClickTime] = useState(0);
  const feedbackButtonRef = useRef(null); // Ref for the feedback button wrapper

  // ... (useEffect for debug logging remains the same)
   useEffect(() => {
    if (currentSection) {
      console.log("[PANEL] Current section data:", currentSection);
      console.log("[PANEL] Instructions text:", currentSection?.instructions?.text);
      console.log("[PANEL] Feedback text:", currentSection?.instructions?.feedback);
    }
  }, [currentSection]);


  // Enhanced feedback handler (formerly magic)
  const handleFeedbackClick = () => {
    console.log("Get AI Feedback button clicked!", new Date().toISOString());
    const now = Date.now();
    if (now - lastClickTime < 1500) {
      console.log("Prevented rapid double-click");
      return;
    }
    setLastClickTime(now);

    if (typeof improveInstructions === 'function') {
      try {
        improveInstructions();
      } catch (error) {
        console.error("Error triggering feedback:", error);
      }
    } else {
      console.error("improveInstructions function (for feedback) is not a function");
    }
  };

  // ... (getFallbackInstructions, isPlaceholder, getInstructionsText remain the same)
  function getFallbackInstructions(section) {
     // ... implementation
  }
  const isPlaceholder = (text) => {
     // ... implementation
  }
 const getInstructionsText = () => {
    // ... implementation
  };


  // Safely access feedback text - use null check and proper fallback
  const feedbackText = currentSection?.instructions?.feedback || '';

  // Create a title that includes the section name
  const sectionTitle = currentSection?.title || "Instructions";
  const panelTitle = `${sectionTitle} Instructions & Feedback`;

  // Custom styles for markdown content
  const customStyles = {
    fontSize: 'text-lg leading-relaxed',
    content: 'prose-lg prose-blue max-w-none',
    heading: 'text-xl font-semibold my-3',
    divider: 'border-t border-blue-200 my-4',
    listItem: 'my-2',
  };

  // Get the appropriate instructions text (with fallback if needed)
  const instructionsText = getInstructionsText();

  // Determine if the feedback button should be highlighted
  const showFeedbackHighlight = onboardingStep === 2;

  return (
    // Applied SectionCard-like styling
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full overflow-y-auto p-5">
      <div className="relative">
        {!currentSection ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 text-lg">Select a section to view instructions</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-semibold text-gray-800 flex-grow mr-4">
                {panelTitle}
              </h3>
              {/* Feedback Button Wrapper - Add ref and conditional highlight/tooltip */}
              <div ref={feedbackButtonRef} className={`relative ${showFeedbackHighlight ? 'onboarding-highlight' : ''}`}>
                <button
                  onClick={handleFeedbackClick}
                  disabled={loading || !currentSection}
                  title="AI will review this section and provide feedback."
                  className={`px-4 py-2 rounded-lg text-base font-medium transition-all flex-shrink-0 ${
                    loading || !currentSection
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700 shadow hover:shadow-md'
                    }`}
                >
                  {/* ... (button content conditional rendering) */}
                   {loading ? ( <span className="flex items-center"> {/* Loading */}... Getting Feedback...</span> ) : ( <span className="flex items-center"> {/* Icon */} Get AI Feedback</span> )}
                </button>
                {/* Onboarding Tooltip */}
                {showFeedbackHighlight && (
                  <div className="onboarding-tooltip onboarding-tooltip-panel">
                    Get feedback on your draft here.
                  </div>
                )}
              </div>
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

// ... (fixNumberedLists function remains the same)
 function fixNumberedLists(text) {
   // ... implementation
 }

// Custom component to render markdown with enhanced styling
const StyledMarkdown = ({ content, customStyles }) => {
  // ... (implementation remains the same)
    const processedContent = content?.replace(/\n\* /g, "\n• ") || '';
    return (
      <div className={`${customStyles.fontSize}`}>
        <ReactMarkdown
          components={{
            h1: ({ node, ...props }) => <h1 className="text-2xl font-bold my-4" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-xl font-bold my-3" {...props} />,
            h3: ({ node, ...props }) => <h3 className="text-lg font-bold my-3" {...props} />,
            p: ({ node, ...props }) => <p className="my-3" {...props} />,
            ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-3" {...props} />,
            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-3" {...props} />,
            li: ({ node, ...props }) => <li className={customStyles.listItem} {...props} />,
            hr: ({ node, ...props }) => <hr className={customStyles.divider} {...props} />,
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    );
};

export default FullHeightInstructionsPanel;
