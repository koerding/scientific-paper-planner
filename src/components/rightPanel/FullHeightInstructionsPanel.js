import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Enhanced full-height instructions panel
 * Fixed to properly render tooltips only for italicized text
 * Preserves bold formatting
 * Extra-wide tooltips for better content display
 */
const FullHeightInstructionsPanel = ({ 
  currentSection, 
  improveInstructions, 
  loading,
  userInputs
}) => {
  const [lastClickTime, setLastClickTime] = useState(0);

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

  // Much improved manual markdown renderer that preserves all formatting
  // and only converts *italic* to tooltips
  const renderCustomMarkdown = (content) => {
    if (!content) return null;
    
    // First, create segments by splitting on code blocks, so we don't process markdown inside code
    const segments = content.split(/(```[\s\S]*?```)/g);
    
    return (
      <div>
        {segments.map((segment, segmentIndex) => {
          // If this is a code block, render it directly without processing
          if (segment.startsWith('```') && segment.endsWith('```')) {
            const code = segment.slice(3, -3);
            return (
              <pre key={segmentIndex} className="bg-gray-100 p-3 rounded overflow-auto my-4">
                <code>{code}</code>
              </pre>
            );
          }
          
          // Split the segment into paragraphs first
          const paragraphs = segment.split(/\n\n+/);
          
          return (
            <div key={segmentIndex}>
              {paragraphs.map((paragraph, paragraphIndex) => {
                // Skip empty paragraphs
                if (!paragraph.trim()) return null;
                
                // Check if this is a heading
                if (paragraph.startsWith('# ')) {
                  const headingText = paragraph.substring(2);
                  return <h1 key={paragraphIndex} className="text-3xl font-bold my-5">{headingText}</h1>;
                }
                
                if (paragraph.startsWith('## ')) {
                  const headingText = paragraph.substring(3);
                  return <h2 key={paragraphIndex} className="text-2xl font-bold my-4">{headingText}</h2>;
                }
                
                if (paragraph.startsWith('### ')) {
                  const headingText = paragraph.substring(4);
                  return <h3 key={paragraphIndex} className="text-xl font-bold my-3">{headingText}</h3>;
                }
                
                // Check if this is a list item
                if (paragraph.startsWith('* ') || paragraph.startsWith('- ') || /^\d+\.\s/.test(paragraph)) {
                  // For list items, we'll split by line and create a list
                  const listItems = paragraph.split(/\n/).filter(item => item.trim());
                  
                  // Check if this is a numbered list
                  const isNumbered = /^\d+\.\s/.test(listItems[0]);
                  
                  const ListTag = isNumbered ? 'ol' : 'ul';
                  const listClasses = isNumbered ? 'list-decimal pl-5 my-4' : 'list-disc pl-5 my-4';
                  
                  return (
                    <ListTag key={paragraphIndex} className={listClasses}>
                      {listItems.map((item, itemIndex) => {
                        // Remove the bullet or number
                        let itemText = item;
                        if (isNumbered) {
                          itemText = item.replace(/^\d+\.\s/, '');
                        } else {
                          itemText = item.replace(/^[*-]\s/, '');
                        }
                        
                        // Process the item text for formatting
                        return (
                          <li key={itemIndex} className={customStyles.listItem}>
                            {processTextWithFormatting(itemText)}
                          </li>
                        );
                      })}
                    </ListTag>
                  );
                }
                
                // Regular paragraph
                return (
                  <p key={paragraphIndex} className="my-4">
                    {processTextWithFormatting(paragraph)}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };
  
  // Helper function to process text with bold, italic, and other formatting
  const processTextWithFormatting = (text) => {
    if (!text) return null;
    
    // We'll process the text in chunks to handle nested formatting
    // Strategy: Split by starting/ending format markers and keep track of state
    
    // First, split by bold markers
    const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
    
    // Process each part - either bold or regular text
    return boldParts.map((part, boldIndex) => {
      // Check if this is bold text
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        // Extract the bold text and return as strong
        const boldText = part.substring(2, part.length - 2);
        return <strong key={boldIndex} className="font-bold">{processItalics(boldText)}</strong>;
      } else {
        // Regular text, check for italics
        return processItalics(part, boldIndex);
      }
    });
  };
  
  // Helper to process italic text and convert to tooltips
  const processItalics = (text, keyPrefix = '') => {
    if (!text) return null;
    
    // Split by italic markers
    const italicParts = text.split(/(\*[^*\n]+\*)/g);
    
    return italicParts.map((part, italicIndex) => {
      const key = `${keyPrefix}-${italicIndex}`;
      
      // Check if this is italic text
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        // Extract the italic text and convert to tooltip
        const tooltipText = part.substring(1, part.length - 1);
        
        return (
          <span key={key} className="tooltip-container">
            <span className="info-icon">ⓘ</span>
            <span className="tooltip">
              {tooltipText}
              <span className="tooltip-arrow"></span>
            </span>
          </span>
        );
      } else {
        // Return regular text
        return <span key={key}>{part}</span>;
      }
    });
  };

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
              {/* Magic button removed as requested */}
            </div>

            {/* Example tooltip */}
            <p className="mb-4">
              Example tooltip
              <span className="tooltip-container">
                <span className="info-icon">ⓘ</span>
                <span className="tooltip">
                  This is how tooltips should work
                  <span className="tooltip-arrow"></span>
                </span>
              </span>
            </p>

            {/* Instructions content */}
            <div className="h-full overflow-y-auto pb-6" style={{ maxHeight: 'calc(100% - 48px)' }}>
              {instructionsText ? (
                <div className={`${customStyles.content} instructions-content mb-4`}>
                  {renderCustomMarkdown(processedContent)}
                </div>
              ) : (
                <p className="text-blue-600 text-base mb-4">Instructions not available for this section.</p>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* CSS for tooltips */}
      <style>
      {`
        /* Tooltip styling */
        .tooltip-container {
          position: relative;
          display: inline-block;
          cursor: help;
          margin-right: 4px;
        }
        
        .info-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: #EEF2FF;
          color: #4F46E5;
          font-size: 12px;
          font-weight: bold;
          margin-left: 0;
          vertical-align: middle;
        }
        
        .tooltip {
          visibility: hidden;
          position: absolute;
          width: 650px;
          max-width: 80vw;
          background-color: #1F2937;
          color: white;
          text-align: left;
          padding: 12px 16px;
          border-radius: 6px;
          z-index: 1000;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          transition: opacity 0.3s, visibility 0.3s;
          font-size: 0.9rem;
          line-height: 1.5;
          overflow-y: auto;
          max-height: 350px;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }
        
        .tooltip-container:hover .tooltip {
          visibility: visible;
          opacity: 1;
        }
        
        .tooltip-arrow {
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: #1F2937 transparent transparent transparent;
        }
        
        /* Other important styles */
        .instructions-content strong {
          font-weight: 700 !important;
          color: #1e3a8a !important;
        }
        
        /* Ensure strikethrough is visible */
        .instructions-content del,
        .instructions-content s {
          text-decoration: line-through !important;
          color: #6B7280 !important;
          opacity: 0.7 !important;
        }
      `}
      </style>
    </div>
  );
};

export default FullHeightInstructionsPanel;
