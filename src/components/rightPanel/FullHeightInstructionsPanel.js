import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Enhanced full-height instructions panel with inline feedback formatting
 * UPDATED: Now renders instructions in bold and inline feedback in regular text
 * FIXED: Correct positioning relative to header and footer
 * FIXED: Fixed scrolling behavior
 * FIXED: Improved border-radius consistency
 * FIXED: Better z-index handling
 * FIXED: Consistent font styles with left panel
 * FIXED: Using unique class for right panel only
 * FIXED: Added proper support for strikethrough in markdown formatting
 */
const FullHeightInstructionsPanel = ({ 
  currentSection, 
  improveInstructions, 
  loading,
  userInputs
}) => {
  const [lastClickTime, setLastClickTime] = useState(0);

  // Enhanced magic handler - retained for external use
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
Are you asking how something is? Why it is the way it is? What gives rise to something? How it got there over time?

* **Explain why the question matters to the field.**
How will science be different after your work? Include both theoretical and practical significance.

* **Ensure your question is answerable with your anticipated resources.**
Consider what data, methods, and skills you'll need to address it properly.`;
      
      case 'audience':
        return `${baseInstructions}

* **Identify primary academic communities who would benefit most directly.**
Be specific about which subfields or research areas will find your work valuable.

* **For each community, note how your research might impact their work.**
Explain what gap you're filling or what problem you're solving for them.

* **Specify 3-5 individual researchers or research groups representing your audience.**
These should be people actively working in areas related to your question.

* **Consider how your findings might be communicated effectively to this audience.**
Think about their background knowledge, methodological preferences, and terminology.`;
      
      // Additional cases omitted for brevity - would include all other sections
      
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

  // FIXED: Updated styles for consistent fonts with left panel
  const customStyles = {
    fontSize: 'text-base leading-relaxed', // Consistent with left panel
    content: 'prose-base prose-blue max-w-none',
    heading: 'text-lg font-semibold my-2',
    divider: 'border-t border-blue-200 my-3',
    listItem: 'my-1',
    strikethrough: 'line-through text-gray-500 opacity-70', // Style for strikethrough text
  };

  // Get the appropriate instructions text (with fallback if needed)
  const instructionsText = getInstructionsText();

  // FIXED: Add a unique class that won't conflict with left panel
  // The 'right-panel' class is unique to this component
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
            </div>

            {/* Improved layout for instructions content */}
            <div className="h-full overflow-y-auto pb-6" style={{ maxHeight: 'calc(100% - 48px)' }}>
              {instructionsText ? (
                <div className={`${customStyles.content} instructions-content mb-4`}>
                  <StyledMarkdown 
                    content={instructionsText} 
                    customStyles={customStyles}
                  />
                </div>
              ) : (
                <p className="text-blue-600 text-base mb-4">Instructions not available for this section.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Custom component to render markdown with enhanced styling for bold instructions and regular feedback
const StyledMarkdown = ({ content, customStyles }) => {
  // Process content to enhance list item styling
  const processedContent = content
    ? content.replace(/\n\* /g, "\n• ")
    : '';
  
  return (
    <div className={`${customStyles.fontSize}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]} // Enable GitHub Flavored Markdown (including strikethrough)
        components={{
          // Customize heading styles
          h1: ({ node, ...props }) => <h1 className="text-xl font-bold my-3" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-bold my-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-bold my-2" {...props} />,
          
          // Style paragraphs and lists
          p: ({ node, ...props }) => <p className="my-2 text-base" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-4 my-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-4 my-2" {...props} />,
          li: ({ node, ...props }) => <li className={`${customStyles.listItem} text-base`} {...props} />,
          
          // Style horizontal rules as dividers
          hr: ({ node, ...props }) => <hr className={customStyles.divider} {...props} />,
          
          // Style strikethrough text (this will be applied to ~~text~~ syntax)
          del: ({ node, ...props }) => <del className={customStyles.strikethrough} {...props} />,
          
          // Handle strong (bold) elements - this is critical for the new format
          strong: ({ node, children, ...props }) => {
            // Check if it's a strikethrough instruction (bold + strikethrough)
            const text = node.children && node.children[0] && node.children[0].value;
            const isStricken = text && text.startsWith('~~') && text.endsWith('~~');
            
            if (isStricken) {
              // For bold + strikethrough, return both styles
              return (
                <strong className="font-bold" {...props}>
                  <del className={customStyles.strikethrough}>{children}</del>
                </strong>
              );
            }
            
            return <strong className="font-bold" {...props}>{children}</strong>;
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default FullHeightInstructionsPanel;
