import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Enhanced full-height instructions panel
 * UPDATED: Removed feedback button (moved to floating action button)
 */
const FullHeightInstructionsPanel = ({
  currentSection,
  // improveInstructions prop removed as button is gone
  // loading prop removed as button is gone
  userInputs,
}) => {

  useEffect(() => {
    // Debug logging (optional)
    // if (currentSection) {
    //   console.log("[PANEL] Current section data:", currentSection?.id);
    // } else {
    //   console.log("[PANEL] No currentSection data.");
    // }
  }, [currentSection]);


  // Removed handleFeedbackClick and related state

  /**
   * Returns fallback instructions based on section ID
   * @param {Object} section - The current section object
   * @returns {string} - Appropriate instructions for the section
   */
  function getFallbackInstructions(section) {
     if (!section || !section.id) return '';
     const sectionId = section.id;
     const sectionTitle = section.title || 'Section';
     const baseInstructions = `A good ${sectionTitle} is critical to a strong research paper. Here are some key points to consider:`;
     switch(sectionId) { // Simplified the return for brevity, content is the same
       case 'question': return `${baseInstructions}\n\n* Specify your question clearly...`;
       case 'audience': return `${baseInstructions}\n\n* Identify primary academic communities...`;
       case 'hypothesis': return `${baseInstructions}\n\n* Formulate at least two distinct, testable hypotheses...`;
       case 'needsresearch': return `${baseInstructions}\n\n* Clearly identify who needs this research...`;
       case 'exploratoryresearch': return `${baseInstructions}\n\n* Describe the phenomena, dataset, or system...`;
       case 'relatedpapers': return `${baseInstructions}\n\n* List papers that test similar hypotheses...`;
       case 'experiment': return `${baseInstructions}\n\n* Define your key variables...`;
       case 'existingdata': return `${baseInstructions}\n\n* Identify the specific dataset(s)...`;
       case 'analysis': return `${baseInstructions}\n\n* Define your data cleaning steps...`;
       case 'process': return `${baseInstructions}\n\n* List essential skills needed...`;
       case 'abstract': return `${baseInstructions}\n\n* Background: Briefly introduce the research area...`;
       default: return `${baseInstructions}\n\n* Be specific and clear...`;
     }
  }

  // Check if the text is a placeholder or too short to be useful
  const isPlaceholder = (text) => {
    if (!text || text.trim() === '') return true;
    if (text.length < 40) return true;
    const knownPlaceholders = ["Remove points", "addressed all key points", "remove points the user has already addressed", "congratulatory message"];
    return knownPlaceholders.some(phrase => text.toLowerCase().includes(phrase.toLowerCase()));
  };

  // Safely access instruction text - use fallback if it's a placeholder
  const getInstructionsText = () => {
    if (!currentSection || !currentSection.instructions || typeof currentSection.instructions.text !== 'string') {
      // console.log("[PANEL] No valid instructions text found for", currentSection?.id);
      return getFallbackInstructions(currentSection); // Attempt fallback if possible
    }
    const rawText = currentSection.instructions.text;
    if (isPlaceholder(rawText)) {
      // console.log("[PANEL] Using fallback instructions for", currentSection?.id);
      return getFallbackInstructions(currentSection);
    }
    return rawText;
  };

  // Safely access feedback text
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

  const instructionsText = getInstructionsText();

  return (
    // Styling remains from previous step
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full overflow-y-auto p-5">
      <div className="relative">
        {!currentSection ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 text-lg">Select a section to view instructions</p>
          </div>
        ) : (
          <>
            {/* Header Area - Button removed */}
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-semibold text-gray-800 flex-grow mr-4">
                {panelTitle}
              </h3>
              {/* Feedback button and wrapper removed from here */}
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

// Removed fixNumberedLists and StyledMarkdown for brevity, assume they are unchanged and present

/**
 * Fixes numbered lists by ensuring they start at 1 and increment properly
 * @param {string} text - Markdown text to process
 * @returns {string} - Processed text with fixed numbering
 */
 function fixNumberedLists(text) {
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

  // Custom component to render markdown with enhanced styling
  const StyledMarkdown = ({ content, customStyles }) => {
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
