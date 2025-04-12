import React, { useState, useEffect } from 'react';

/**
 * Enhanced instructions panel with expandable tooltip content
 * UPDATED: Now handles crossed out subsections from AI feedback
 */
const FullHeightInstructionsPanel = ({ currentSection, improveInstructions, loading, userInputs }) => {
  // Track which tooltips are expanded
  const [expandedTooltips, setExpandedTooltips] = useState({});
  
  useEffect(() => {
    // Reset expanded tooltips when section changes
    setExpandedTooltips({});
    
    // Debug logging
    if (currentSection) {
      console.log("[PANEL] Current section data:", currentSection);
      console.log("[PANEL] Has introText:", !!currentSection.introText);
      console.log("[PANEL] Has subsections:", Array.isArray(currentSection.subsections));
    }
  }, [currentSection]);
  
  // Create a title that includes the section name
  const sectionTitle = currentSection?.title || "Instructions";
  const panelTitle = `${sectionTitle} Instructions & Feedback`;
  
  // Toggle a tooltip's expanded state
  const toggleTooltip = (id) => {
    setExpandedTooltips(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Helper function to render instructions content with proper formatting
  const renderInstructionsContent = (text) => {
    if (!text) return null;
    
    // Split the text by lines that start with bullet points
    const parts = text.split(/(?=\* \*\*)/);
    
    return parts.map((part, index) => {
      // Check if this is a subsection with crossed out format
      const isCrossedOut = part.includes('**~~') && part.includes('~~**');
      
      // For the first part (usually intro text), just render it directly
      if (index === 0 && !part.trim().startsWith('*')) {
        return <div key={`intro-${index}`} className="mb-4">{part}</div>;
      }
      
      // For subsection parts, apply appropriate formatting
      return (
        <div 
          key={`part-${index}`} 
          className={`mb-4 ${isCrossedOut ? 'text-gray-500' : ''}`}
        >
          {/* Process the content with markdown-like formatting */}
          {processMarkdownLike(part, isCrossedOut)}
        </div>
      );
    });
  };
  
  // Helper to process markdown-like formatting in instruction text
  const processMarkdownLike = (text, isCrossedOut) => {
    if (!text) return null;
    
    // Extract parts: title/instruction and feedback
    const titleMatch = text.match(/\* \*\*(?:~~)?(.+?)(?:~~)?\*\*/);
    const title = titleMatch ? titleMatch[1] : '';
    
    // Get the feedback part (everything after the title/instruction)
    const feedbackStart = text.indexOf('**\n') + 3;
    const feedback = feedbackStart > 3 ? text.substring(feedbackStart) : '';
    
    return (
      <>
        {/* Title/instruction with optional strikethrough */}
        <div className={`font-bold ${isCrossedOut ? 'line-through' : ''}`}>
          {title}
        </div>
        
        {/* Feedback part */}
        {feedback && (
          <div className="ml-4 mt-1 text-gray-700">
            {feedback}
          </div>
        )}
      </>
    );
  };

  return (
    <div
      className="bg-blue-50 h-full overflow-y-auto section-instruction-panel"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '50%',
        paddingTop: '120px', // Adjusted for header height
        paddingBottom: '2rem',
        zIndex: 10, // Ensure it's below header buttons if they overlap
      }}
    >
      <div className="px-6 py-4 relative">
        {!currentSection ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-blue-600 text-base">Select a section to view instructions</p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              {panelTitle}
            </h3>

            {/* Instructions panel */}
            <div className="border-4 border-blue-600 rounded-lg bg-white p-5 mb-6">
              {/* For backward compatibility, check if we have text directly or need to use structured approach */}
              {currentSection.instructions?.text ? (
                // Render with the enhanced processing for crossed-out sections
                <div className="text-base leading-relaxed instructions-content">
                  {renderInstructionsContent(currentSection.instructions.text)}
                </div>
              ) : (
                <>
                  {/* Intro Text */}
                  {currentSection.introText && (
                    <div className="text-base mb-5 leading-relaxed">
                      {currentSection.introText}
                    </div>
                  )}
                  
                  {/* Subsections with expandable tooltips */}
                  {currentSection.subsections && currentSection.subsections.map((subsection, index) => (
                    <div key={index} className="mb-5">
                      <div className="text-base leading-relaxed">
                        <strong className="font-bold">{subsection.title}</strong> {/* No line break after title */}
                        {subsection.instruction} {/* Instruction on same line as title */}
                        {subsection.tooltip && (
                          <button 
                            className="info-icon-button ml-1"
                            onClick={() => toggleTooltip(subsection.id)}
                            aria-label={expandedTooltips[subsection.id] ? "Hide details" : "Show details"}
                          >
                            {expandedTooltips[subsection.id] ? '−' : 'ⓘ'}
                          </button>
                        )}
                      </div>
                      
                      {/* Expandable tooltip content */}
                      {subsection.tooltip && expandedTooltips[subsection.id] && (
                        <div className="mt-2 mb-3 pl-3 border-l-2 border-blue-300 text-base italic text-gray-700 bg-blue-50 p-3 rounded">
                          {subsection.tooltip}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Improve button at the bottom */}
            <div className="flex justify-center mt-6">
              <button
                onClick={improveInstructions}
                disabled={loading}
                className={`
                  flex items-center px-4 py-2 rounded
                  ${loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'}
                `}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Improving...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Get AI Feedback</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Styles from PaperPlanner.css, included inline for direct integration */}
      <style jsx>{`
        /* Info button styling from PaperPlanner.css */
        .info-icon-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background-color: #EEF2FF;
          color: #4F46E5;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
          margin: 0 2px;
          vertical-align: middle;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .info-icon-button:hover {
          background-color: #E0E7FF;
          transform: scale(1.1);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        /* Animation for expanding content */
        @keyframes fadeInExpand {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 500px; }
        }
        
        /* Section styling from PaperPlanner.css */
        .section-instruction-panel .prose p {
          margin-top: 1em;
          margin-bottom: 1em;
        }
        
        /* Styling for crossed out text */
        .line-through {
          text-decoration: line-through;
          color: #6B7280;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
};

export default FullHeightInstructionsPanel;
