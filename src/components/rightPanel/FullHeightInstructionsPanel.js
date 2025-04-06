// FILE: src/components/rightPanel/FullHeightInstructionsPanel.js
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Enhanced full-height instructions panel
 * UPDATED: Added sticky positioning to keep panel visible while scrolling left side.
 * UPDATED: Adjusted height calculation for sticky positioning.
 */
const FullHeightInstructionsPanel = ({
  currentSection,
  userInputs,
}) => {

  useEffect(() => {
    // Optional debug logging
    // if (currentSection) { console.log("[PANEL] Current section:", currentSection?.id); }
  }, [currentSection]);

  // Removed feedback button handler/state

  /**
   * Returns fallback instructions based on section ID
   */
  function getFallbackInstructions(section) {
     if (!section || !section.id) return '';
     const sectionId = section.id;
     const sectionTitle = section.title || 'Section';
     const baseInstructions = `A good ${sectionTitle} is critical to a strong research paper...`; // Truncated for brevity
     switch(sectionId) { // Content remains the same
       case 'question': return `${baseInstructions}\n\n* Specify your question clearly...`;
       // ... other cases ...
       default: return `${baseInstructions}\n\n* Be specific and clear...`;
     }
  }

  // Check if the text is a placeholder
  const isPlaceholder = (text) => {
    // ... implementation remains the same ...
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

  // Custom styles for markdown
  const customStyles = { /* Styles remain the same */ };
  const instructionsText = getInstructionsText();

  // Define sticky offset (adjust based on actual header height + desired gap)
  // Header py-4 (1rem) + mb-8 (2rem) + Container py-6 (1.5rem top) = 4.5rem total space above panel's padding box.
  // Let's stick 1.5rem (py-6) below the top of the container. top-6 = 1.5rem
  const stickyTopOffset = '1.5rem'; // Tailwind: top-6

  return (
    // Added sticky positioning and calculated max-height
    <div
       className={`sticky top-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-y-auto p-5`}
       style={{ maxHeight: `calc(100vh - ${stickyTopOffset} - 1.5rem)` }} // Calculate max height: viewport - sticky offset - bottom margin/padding (using 1.5rem as approximation for bottom spacing)
       >
      {/* Inner content structure remains the same */}
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

/**
 * Fixes numbered lists
 */
function fixNumberedLists(text) {
   // ... implementation ...
    if (!text) return text;
    const lines = text.split('\n');
    let inNumberedList = false;
    let currentListItems = [];
    let result = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isNumberedItem = /^\d+\.\s/.test(line.trim());
      if (isNumberedItem) {
        const content = line.replace(/^\d+\.\s/, '');
        if (!inNumberedList) {
          inNumberedList = true;
          currentListItems = [content];
        } else {
          currentListItems.push(content);
        }
      } else {
        if (inNumberedList) {
          for (let j = 0; j < currentListItems.length; j++) {
            result.push(`${j + 1}. ${currentListItems[j]}`);
          }
          currentListItems = [];
          inNumberedList = false;
        }
        result.push(line);
      }
    }
    if (inNumberedList && currentListItems.length > 0) {
      for (let j = 0; j < currentListItems.length; j++) {
        result.push(`${j + 1}. ${currentListItems[j]}`);
      }
    }
    return result.join('\n');
}

/**
 * Custom markdown renderer
 */
const StyledMarkdown = ({ content, customStyles }) => {
   // ... implementation ...
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
