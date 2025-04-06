import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Enhanced full-height instructions panel
 * UPDATED: Styling changed to match SectionCard look (bg-white, border, shadow, p-5)
 */
const FullHeightInstructionsPanel = ({
  currentSection,
  improveInstructions,
  loading,
  userInputs
}) => {
  // ... (useState, useEffect, handleMagicClick, getFallbackInstructions, isPlaceholder, etc. remain the same)

  // Safely access instruction text - use fallback if it's a placeholder
  const getInstructionsText = () => {
    // ... (implementation remains the same)
  };

  // Safely access feedback text - use null check and proper fallback
  const feedbackText = currentSection?.instructions?.feedback || '';

  // Create a title that includes the section name
  const sectionTitle = currentSection?.title || "Instructions";
  const panelTitle = `${sectionTitle} Instructions & Feedback`;

  // Custom styles for markdown content
  const customStyles = {
    // Adjusted sizes to better fit p-5 padding
    fontSize: 'text-lg leading-relaxed', // Slightly smaller to fit padding
    content: 'prose-lg prose-blue max-w-none', // Adjusted prose size
    heading: 'text-xl font-semibold my-3', // Adjusted heading size/margin
    divider: 'border-t border-blue-200 my-4', // Adjusted divider margin
    listItem: 'my-2', // Adjusted list item margin
  };

  // Get the appropriate instructions text (with fallback if needed)
  const instructionsText = getInstructionsText();

  return (
    // Applied SectionCard-like styling: bg-white, rounded-lg, shadow-sm, border, p-5
    // Kept h-full and overflow-y-auto for layout
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full overflow-y-auto p-5">
      {/* Removed padding from this inner div as it's now on the parent */}
      <div className="relative">
        {!currentSection ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 text-lg">Select a section to view instructions</p> {/* Adjusted text color/size */}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              {/* Adjusted heading size/color */}
              <h3 className="text-2xl font-semibold text-gray-800 flex-grow mr-4">
                {panelTitle}
              </h3>
              <button
                onClick={handleMagicClick}
                disabled={loading || !currentSection}
                 // Adjusted button style slightly if needed
                className={`px-4 py-2 rounded-lg text-base font-medium transition-all flex-shrink-0 ${
                  loading || !currentSection
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow hover:shadow-md'
                  }`}
              >
                {/* ... (button content remains the same) */}
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

            {/* Render Instructions */}
            {instructionsText ? (
              <div className={`${customStyles.content} instructions-content mb-6`}>
                <StyledMarkdown
                  content={instructionsText}
                  customStyles={customStyles}
                />
              </div>
            ) : (
              <p className="text-gray-500 text-lg mb-6">Instructions not available for this section.</p> // Adjusted text color/size
            )}

            {/* Render Feedback Section */}
            {feedbackText && feedbackText.length > 5 && (
              <div className="mt-6 pt-4 border-t border-gray-300"> {/* Adjusted border color */}
                 {/* Adjusted heading size/color */}
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

// Custom component to render markdown with enhanced styling
const StyledMarkdown = ({ content, customStyles }) => {
 // ... (implementation remains the same, styles are now passed via customStyles prop)
  const processedContent = content
    .replace(/\n\* /g, "\n• ");

  return (
    <div className={`${customStyles.fontSize}`}>
      <ReactMarkdown
        components={{
          // Customize heading styles
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold my-4" {...props} />, // Adjusted size
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold my-3" {...props} />, // Adjusted size
          h3: ({ node, ...props }) => <h3 className="text-lg font-bold my-3" {...props} />, // Adjusted size

          // Style paragraphs and lists
          p: ({ node, ...props }) => <p className="my-3" {...props} />, // Adjusted margin
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-3" {...props} />, // Adjusted margin
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-3" {...props} />, // Adjusted margin
          li: ({ node, ...props }) => <li className={customStyles.listItem} {...props} />,

          // Style horizontal rules as dividers
          hr: ({ node, ...props }) => <hr className={customStyles.divider} {...props} />,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};


export default FullHeightInstructionsPanel;
