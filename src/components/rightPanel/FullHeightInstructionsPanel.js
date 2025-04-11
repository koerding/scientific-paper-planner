import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Enhanced full-height instructions panel
 * - Fixed to properly render tooltips only for italicized text
 * - Preserves bold formatting
 * - Extra-wide tooltips with position adjustment for right-side tooltips
 * - Fixed strikethrough rendering to work with all content
 * - Removed example tooltip
 * - FIXED: Properly handles strikethrough for both bold and regular text
 * - FIXED: Tooltip width fixed to 60% of blue panel width
 * - FIXED: Preserves tooltips in strikethrough text
 * - FIXED: Removed dollar signs from strikethrough rendering
 * - FIXED: Removed extra bullet points before non-bold text
 * - FIXED: Tooltip width increased to 400px with proper max-width
 * - FIXED: Tooltip height now adjusts automatically with scrolling
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

  // Helper to process italic text and convert to tooltips
  const processItalics = (text, keyPrefix = '') => {
    if (!text) return null;
    
    // Split by italic markers
    const italicParts = text.split(/(\*[^*\n]+\*)/g);
    
    return italicParts.map((part, italicIndex) => {
      const key = `${keyPrefix}-italic-${italicIndex}`;
      
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
  
  // Process bold and italic formatting, but not strikethrough
  const processFormattingExceptStrikethrough = (text, keyPrefix) => {
    if (!text) return null;
    
    // We'll process the text in chunks to handle nested formatting
    // First, split by bold markers
    const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
    
    // Process each part - either bold or regular text
    return boldParts.map((part, boldIndex) => {
      const partKey = `${keyPrefix}-bold-${boldIndex}`;
      
      // Check if this is bold text
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        // Extract the bold text and return as strong
        const boldText = part.substring(2, part.length - 2);
        return <strong key={partKey} className="font-bold">{processItalics(boldText, partKey)}</strong>;
      } else {
        // Regular text, check for italics
        return processItalics(part, partKey);
      }
    });
  };
  
  // Main helper for rendering formatted content with bold, italic (tooltips), strikethrough
  const renderFormattedContent = (text) => {
    if (!text) return null;
    
    // FIXED: Clean up any dollar signs around strikethrough
    const cleanedText = text.replace(/\$\$~~|\$\$/g, '~~');
    
    // Process strikethrough first, before other formatting
    const strikethroughParts = cleanedText.split(/(~~[^~]+~~)/g);
    
    return strikethroughParts.map((part, strikeIndex) => {
      // Check if this is strikethrough text
      if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
        // Extract the strikethrough text and process remaining formatting
        const strikeText = part.substring(2, part.length - 2);
        return (
          <span key={`strike-${strikeIndex}`} className="line-through text-gray-500 opacity-70">
            {processFormattingExceptStrikethrough(strikeText, `strike-${strikeIndex}`)}
          </span>
        );
      } else {
        // Regular text, process other formatting
        return processFormattingExceptStrikethrough(part, `regular-${strikeIndex}`);
      }
    });
  };

  // Custom processor for list items to handle bullet points and strikethrough correctly
  const processListItems = (listItems, isNumbered) => {
    return listItems.map((item, index) => {
      // First, clean up the item by removing the bullet or number prefix
      let itemText = item.trim();
      if (isNumbered) {
        itemText = itemText.replace(/^\d+\.\s+/, '');
      } else {
        itemText = itemText.replace(/^[*•-]\s+/, '');
      }
      
      // Check if this is a completed/strikethrough item
      const hasStrikethrough = 
        itemText.includes('~~') || 
        (itemText.includes('**~~') && itemText.includes('~~**'));
      
      // FIXED: Handle the case where we have both bold instruction and following text
      const boldRegex = /\*\*([^*]+)\*\*/;
      const boldMatch = itemText.match(boldRegex);
      
      if (hasStrikethrough) {
        // Clean up strikethrough markers and extract content
        let cleanedItem = itemText.replace(/\$\$~~|\$\$/g, '~~');
        
        // For items with strikethrough, apply strikethrough to the entire content
        return (
          <li key={index} className="line-through text-gray-500 opacity-70 my-1">
            {renderFormattedContent(cleanedItem.replace(/~~([^~]+)~~/g, '$1'))}
          </li>
        );
      } else if (boldMatch) {
        // For items with bold formatting but no strikethrough
        // Split into the bold instruction and the following text
        const instruction = boldMatch[1];
        const textAfterBold = itemText.replace(boldRegex, '').trim();
        
        // Return a single list item with the bold instruction followed by text
        return (
          <li key={index} className="my-1">
            <strong className="font-bold">{processItalics(instruction, `item-${index}-bold`)}</strong>
            {textAfterBold && processItalics(textAfterBold, `item-${index}-text`)}
          </li>
        );
      } else {
        // Regular item with no special formatting
        return (
          <li key={index} className="my-1">
            {renderFormattedContent(itemText)}
          </li>
        );
      }
    });
  };

  // Improved manual markdown renderer that preserves all formatting,
  // converts *italic* to tooltips, and handles strikethrough properly
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
                
                // Check if paragraph has strikethrough (~~text~~)
                const hasStrikethrough = paragraph.includes('~~');
                
                // Process strikethrough for entire paragraph if needed
                if (hasStrikethrough) {
                  // Check if the entire paragraph is strikethrough
                  if (paragraph.startsWith('~~') && paragraph.endsWith('~~')) {
                    const innerContent = paragraph.substring(2, paragraph.length - 2);
                    return (
                      <p key={paragraphIndex} className="my-4 line-through text-gray-500 opacity-70">
                        {renderFormattedContent(innerContent)}
                      </p>
                    );
                  }
                }
                
                // Check if this is a heading
                if (paragraph.startsWith('# ')) {
                  const headingText = paragraph.substring(2);
                  return <h1 key={paragraphIndex} className="text-3xl font-bold my-5">{renderFormattedContent(headingText)}</h1>;
                }
                
                if (paragraph.startsWith('## ')) {
                  const headingText = paragraph.substring(3);
                  return <h2 key={paragraphIndex} className="text-2xl font-bold my-4">{renderFormattedContent(headingText)}</h2>;
                }
                
                if (paragraph.startsWith('### ')) {
                  const headingText = paragraph.substring(4);
                  return <h3 key={paragraphIndex} className="text-xl font-bold my-3">{renderFormattedContent(headingText)}</h3>;
                }
                
                // FIXED: Better handling of list items with strikethrough
                // Check if this is a list item
                if (paragraph.startsWith('* ') || paragraph.startsWith('-') || paragraph.startsWith('• ') || /^\d+\.\s/.test(paragraph)) {
                  // For list items, we'll split by line and create a list
                  const listItems = paragraph.split(/\n/).filter(item => item.trim());
                  
                  // Check if this is a numbered list
                  const isNumbered = /^\d+\.\s/.test(listItems[0]);
                  
                  const ListTag = isNumbered ? 'ol' : 'ul';
                  const listClasses = isNumbered ? 'list-decimal pl-5 my-4' : 'list-disc pl-5 my-4';
                  
                  // FIXED: Use custom list item processor to ensure proper formatting
                  return (
                    <ListTag key={paragraphIndex} className={listClasses}>
                      {processListItems(listItems, isNumbered)}
                    </ListTag>
                  );
                }
                
                // Regular paragraph - FIXED: Handle strikethrough at paragraph level too
                if (hasStrikethrough && paragraph.match(/~~[^~]+~~/)) {
                  // Replace dollar signs from strikethrough if present
                  const cleanedParagraph = paragraph.replace(/\$\$~~|\$\$/g, '~~');
                  
                  // This paragraph contains strikethrough sections
                  return (
                    <p key={paragraphIndex} className="my-4">
                      {renderFormattedContent(cleanedParagraph)}
                    </p>
                  );
                } else {
                  return (
                    <p key={paragraphIndex} className="my-4">
                      {renderFormattedContent(paragraph)}
                    </p>
                  );
                }
              })}
            </div>
          );
        })}
      </div>
    );
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

            {/* Example tooltip removed as requested */}

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
      
      {/* FIXED: CSS for tooltips with improved sizing and positioning */}
      <style>
      {`
        /* Tooltip styling */
        .tooltip-container {
          position: relative;
          display: inline-block;
          cursor: help;
          margin: 0 2px;
          vertical-align: middle;
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
          vertical-align: middle;
        }
        
        /* FIXED: Make tooltips 400px with proper max width */
        .tooltip {
          visibility: hidden;
          position: absolute;
          width: 400px;
          min-width: 300px;
          max-width: 60%;
          background-color: #1F2937;
          color: white;
          text-align: left;
          padding: 10px 14px;
          border-radius: 6px;
          z-index: 1000;
          bottom: 125%;
          left: -20px;
          opacity: 0;
          transition: opacity 0.3s;
          font-size: 0.875rem;
          line-height: 1.5;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow-y: auto;
          max-height: 300px;
        }
        
        /* Show tooltip on hover */
        .tooltip-container:hover .tooltip {
          visibility: visible;
          opacity: 1;
        }
        
        /* FIXED: Adjust position for tooltips near right edge */
        @media (min-width: 1024px) {
          .tooltip-container:nth-last-child(-n+3) .tooltip {
            left: auto;
            right: 0;
          }
        }
        
        .tooltip-arrow {
          position: absolute;
          top: 100%;
          left: 25px;
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
        .instructions-content s,
        .line-through {
          text-decoration: line-through !important;
          color: #6B7280 !important;
          opacity: 0.7 !important;
        }
        
        /* Make sure all strikethrough text has the right appearance */
        .instructions-content del,
        .instructions-content s,
        .instructions-content .line-through,
        .instructions-content strong del,
        .instructions-content del strong,
        .instructions-content strong.line-through,
        .instructions-content li.line-through,
        .instructions-content p.line-through {
          text-decoration: line-through !important;
          color: #6B7280 !important; /* gray-500 */
          opacity: 0.7 !important;
        }
        
        /* Ensure the line goes through bold text */
        .instructions-content strong del,
        .instructions-content del strong,
        .instructions-content strong.line-through {
          text-decoration: line-through !important;
          font-weight: 700 !important;
        }
        
        /* FIXED: Make sure tooltips within strikethrough text remain visible */
        .instructions-content .line-through .tooltip-container,
        .instructions-content del .tooltip-container {
          display: inline-block !important;
          opacity: 1 !important;
          text-decoration: none !important;
        }
        
        .instructions-content .line-through .tooltip-container .info-icon,
        .instructions-content del .tooltip-container .info-icon {
          opacity: 0.8 !important;
          background-color: #F3F4F6 !important;
          color: #6B7280 !important;
        }
        
        /* FIXED: Removed unnecessary bullets for feedback text */
        .instructions-content li + p {
          list-style-type: none !important;
          margin-top: 0.25rem !important;
          margin-bottom: 0.5rem !important;
          margin-left: 0 !important;
          color: #4b5563 !important; /* Gray-600 for feedback */
          opacity: 1 !important;
        }
        
        /* List styling fixes */
        .instructions-content ul li,
        .instructions-content ol li {
          margin-bottom: 0.75rem !important;
        }
        
        /* FIXED: Make sure list items don't have extra bullet points */
        .instructions-content li::before {
          content: none !important;
        }

        /* FIXED: Ensure tooltips are properly styled in all contexts */
        .tooltip p, .tooltip em, .tooltip i, .tooltip b, .tooltip strong {
          color: white !important;
          font-size: inherit;
          line-height: inherit;
        }
      `}
      </style>
    </div>
  );
};

export default FullHeightInstructionsPanel;
