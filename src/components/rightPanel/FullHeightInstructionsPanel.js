import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Enhanced full-height instructions panel with support for structured content and tooltips
 * UPDATED: Simplified to focus on rendering subsections with tooltips
 */
const FullHeightInstructionsPanel = ({ currentSection }) => {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    // Debug logging to help diagnose instruction content issues
    if (currentSection) {
      console.log("[PANEL] Current section data:", currentSection);
      console.log("[PANEL] Intro text:", currentSection?.introText);
      console.log("[PANEL] Subsections:", currentSection?.subsections?.length || 0);
    }
    
    // Reset active tooltip when section changes
    setActiveTooltip(null);
  }, [currentSection]);

  // Handle clicks outside of tooltips to dismiss them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setActiveTooltip(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle tooltip visibility
  const toggleTooltip = (subsectionId) => {
    setActiveTooltip(activeTooltip === subsectionId ? null : subsectionId);
  };

  // Check if the subsections are empty or missing
  const hasValidSubsections = 
    currentSection?.subsections && 
    Array.isArray(currentSection.subsections) && 
    currentSection.subsections.length > 0;

  // Create a title that includes the section name
  const sectionTitle = currentSection?.title || "Instructions";
  const panelTitle = `${sectionTitle} Instructions`;

  // Custom styles for markdown content to match left side fonts
  const customStyles = {
    fontSize: 'text-xl leading-relaxed', // Larger font to match left side
    content: 'prose-xl prose-blue max-w-none', // Increase prose size
    heading: 'text-2xl font-semibold my-4', // Larger headings
    divider: 'border-t border-blue-200 my-6', // Style for dividers (---)
    listItem: 'my-3', // Add more space between list items
  };

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
            <div className="mb-4">
              <h3 className="text-3xl font-semibold text-blue-800">
                {panelTitle}
              </h3>
            </div>

            {/* Render Intro Text (if available) */}
            {currentSection.introText && (
              <div className={`${customStyles.content} mb-6`}>
                <StyledMarkdown 
                  content={currentSection.introText} 
                  customStyles={customStyles}
                />
              </div>
            )}

            {/* Render Subsections with Tooltips */}
            {hasValidSubsections && (
              <div className="space-y-6">
                {currentSection.subsections.map((subsection, index) => (
                  <div key={subsection.id || index} className="subsection-container">
                    <div className="flex items-center">
                      <h4 className={`${customStyles.heading} flex-grow`}>
                        {subsection.title}
                        {subsection.tooltip && (
                          <button 
                            onClick={() => toggleTooltip(subsection.id)}
                            className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-blue-500 rounded-full hover:bg-blue-600"
                            aria-label="Show tooltip"
                          >
                            ?
                          </button>
                        )}
                      </h4>
                    </div>
                    
                    {/* Tooltip */}
                    {subsection.tooltip && activeTooltip === subsection.id && (
                      <div 
                        ref={tooltipRef}
                        className="relative bg-white border border-blue-200 rounded-md p-4 my-2 shadow-md"
                      >
                        <button 
                          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                          onClick={() => setActiveTooltip(null)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <p className="text-sm text-gray-700 pr-5">{subsection.tooltip}</p>
                      </div>
                    )}
                    
                    {/* Subsection instruction content */}
                    <div className={`${customStyles.content}`}>
                      <StyledMarkdown 
                        content={subsection.instruction} 
                        customStyles={customStyles}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Custom component to render markdown with enhanced styling
const StyledMarkdown = ({ content, customStyles }) => {
  // Process content to enhance list item styling
  const processedContent = content
    // Replace asterisks with bullet points for consistency
    .replace(/\n\* /g, "\n• ");
  
  return (
    <div className={`${customStyles.fontSize}`}>
      <ReactMarkdown
        components={{
          // Customize heading styles
          h1: ({ node, ...props }) => <h1 className="text-3xl font-bold my-5" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-2xl font-bold my-4" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-xl font-bold my-4" {...props} />,
          
          // Style paragraphs and lists
          p: ({ node, ...props }) => <p className="my-4" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-4" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-4" {...props} />,
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
