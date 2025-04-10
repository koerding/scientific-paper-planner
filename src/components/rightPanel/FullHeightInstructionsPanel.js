import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Enhanced full-height instructions panel
 * Using CSS-only tooltips for maximum compatibility
 */
const FullHeightInstructionsPanel = ({ 
  currentSection, 
  improveInstructions, 
  loading,
  userInputs
}) => {
  const [lastClickTime, setLastClickTime] = useState(0);

  // Enhanced magic handler
  const handleMagicClick = () => {
    const now = Date.now();
    if (now - lastClickTime < 1500) {
      return;
    }
    setLastClickTime(now);

    if (typeof improveInstructions === 'function') {
      try {
        improveInstructions();
      } catch (error) {
        console.error("Error triggering magic:", error);
      }
    }
  };

  /**
   * Returns fallback instructions based on section ID
   */
  function getFallbackInstructions(section) {
    if (!section || !section.id) return '';
    
    const sectionId = section.id;
    const sectionTitle = section.title || 'Section';
    
    // Common base instructions for all sections
    const baseInstructions = `A good ${sectionTitle} is critical to a strong research paper. Here are some key points to consider:`;
    
    // Section-specific instructions
    switch(sectionId) {
      case 'question':
        return `${baseInstructions}

* **Specify your question clearly.**
This helps readers immediately understand your research focus.

* **Be clear about the logic.**
Are you asking how something is? Why it is the way it is? What gives rise to something? How it got their over time?

* **Explain why the question matters to the field.**
How will science be different after your work? Include both theoretical and practical significance.

* **Ensure your question is answerable with your anticipated resources.**
Consider what data, methods, and skills you'll need to address it properly.`;
      
      default:
        return `${baseInstructions}

* **Be specific and clear in your writing.**
Vague statements reduce the impact of your work and may confuse readers.

* **Consider how this section connects to your overall research goals.**
Every part of your paper should contribute to answering your research question.

* **Ensure this section addresses the key requirements for your project.**
Different research approaches have different expectations for how information should be presented.

* **Think about how readers will use this information.**
What do they need to know to understand and evaluate your research properly?`;
    }
  }

  // Check if the text is a placeholder or too short to be useful
  const isPlaceholder = (text) => {
    if (!text || text.trim() === '') return true;
    if (text.length < 40) return true; // Too short to be real instructions
    
    const knownPlaceholders = [
      "Remove points",
      "addressed all key points",
      "remove points the user has already addressed",
      "congratulatory message"
    ];
    
    return knownPlaceholders.some(phrase => 
      text.toLowerCase().includes(phrase.toLowerCase())
    );
  };

  // Safely access instruction text - use fallback if it's a placeholder
  const getInstructionsText = () => {
    const rawText = currentSection?.instructions?.text || '';
    
    if (isPlaceholder(rawText)) {
      return getFallbackInstructions(currentSection);
    }
    
    return rawText;
  };

  // Create a title that includes the section name
  const sectionTitle = currentSection?.title || "Instructions";
  const panelTitle = `${sectionTitle} Instructions & Feedback`;

  // Updated styles
  const customStyles = {
    fontSize: 'text-base leading-relaxed', 
    content: 'prose-base prose-blue max-w-none',
    heading: 'text-lg font-semibold my-2',
    divider: 'border-t border-blue-200 my-3',
    listItem: 'my-1',
    strikethrough: 'line-through text-gray-500 opacity-70'
  };

  // Get the appropriate instructions text (with fallback if needed)
  const instructionsText = getInstructionsText();

  // Process content for consistent bullet points
  const processedContent = instructionsText
    ? instructionsText.replace(/\n\* /g, "\n• ")
    : '';

  return (
    <div
      className="bg-blue-50 border-4 border-blue-500 rounded-lg overflow-y-auto right-panel"
      style={{
        position: 'fixed',
        right: '1rem',
        width: 'calc(50% - 1rem)',
        top: '150px',
        bottom: '50px',
        zIndex: 10,
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
      }}
    >
      <div className="px-4 py-3 h-full">
        {!currentSection ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-blue-600 text-base">Select a section to view instructions</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-blue-800 flex-grow mr-3">
                {panelTitle}
              </h3>
              <button
                onClick={handleMagicClick}
                disabled={loading}
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

            {/* CSS-only tooltip test */}
            <p style={{ marginBottom: '10px' }}>
              <span style={{ position: 'relative', display: 'inline-block' }}>
                Test tooltip
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: '#EEF2FF',
                  color: '#4F46E5',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginLeft: '4px',
                  cursor: 'help',
                  position: 'relative',
                }}>
                  ⓘ
                  <span style={{
                    visibility: 'hidden',
                    position: 'absolute',
                    width: '200px',
                    backgroundColor: '#1F2937',
                    color: 'white',
                    textAlign: 'center',
                    padding: '8px',
                    borderRadius: '6px',
                    zIndex: 1000,
                    bottom: '150%',
                    left: '50%',
                    marginLeft: '-100px',
                    opacity: 0,
                    transition: 'opacity 0.3s',
                  }} className="tooltip-content">
                    This is a test tooltip
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      marginLeft: '-5px',
                      borderWidth: '5px',
                      borderStyle: 'solid',
                      borderColor: '#1F2937 transparent transparent transparent',
                    }}></div>
                  </span>
                </span>
              </span>
            </p>

            {/* Instructions content */}
            <div className="h-full overflow-y-auto pb-6" style={{ maxHeight: 'calc(100% - 48px)' }}>
              {instructionsText ? (
                <div className={`${customStyles.content} instructions-content mb-4`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node, ...props }) => <h1 className="text-3xl font-bold my-5" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-2xl font-bold my-4" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-xl font-bold my-4" {...props} />,
                      p: ({ node, ...props }) => <p className="my-4" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-4" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-4" {...props} />,
                      li: ({ node, ...props }) => <li className={customStyles.listItem} {...props} />,
                      hr: ({ node, ...props }) => <hr className={customStyles.divider} {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                      em: ({ node, ...props }) => <em style={{ fontStyle: 'italic' }} {...props} />,
                    }}
                  >
                    {processedContent}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-blue-600 text-base mb-4">Instructions not available for this section.</p>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Add this CSS for hover effect */}
      <style>
        {`
        [class^="tooltip-content"] {
          visibility: hidden;
          opacity: 0;
        }
        
        span:hover > .tooltip-content {
          visibility: visible;
          opacity: 1;
        }
        `}
      </style>
    </div>
  );
};

export default FullHeightInstructionsPanel;
