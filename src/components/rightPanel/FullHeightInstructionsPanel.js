// FILE: src/components/rightPanel/FullHeightInstructionsPanel.js

import React, { useState, useEffect } from 'react';

/**
 * Enhanced instructions panel with expandable tooltip content
 * FIXED: Properly displays improvement feedback in purple
 */
const FullHeightInstructionsPanel = ({ currentSection, improveInstructions, loading }) => {
  // Track which tooltips are expanded
  const [expandedTooltips, setExpandedTooltips] = useState({});
  
  useEffect(() => {
    // Reset expanded tooltips when section changes
    setExpandedTooltips({});
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

  /**
   * Renders instruction content based on whether improvement feedback exists
   */
  const renderInstructionContent = () => {
    if (!currentSection) return null;
    
    // For debugging - log the current section structure
    console.log("FullHeightInstructionsPanel rendering with section:", currentSection);
    
    // Check if we have improvement feedback data
    const hasImprovement = currentSection.instructions && 
                          currentSection.instructions.improvement;
    
    if (hasImprovement) {
      console.log("Found improvement data:", currentSection.instructions.improvement);
      return renderImprovedInstructions();
    } else {
      console.log("No improvement data found, rendering original instructions");
      return renderOriginalInstructions();
    }
  };
  
  /**
   * Renders the original instructions with no AI feedback
   */
  const renderOriginalInstructions = () => {
    if (!currentSection) return null;
    
    return (
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
    );
  };
  
  /**
   * Renders improved instructions with AI feedback
   * All AI-generated content is styled with purple text
   */
  const renderImprovedInstructions = () => {
    if (!currentSection || !currentSection.instructions?.improvement) return null;
    
    const improvement = currentSection.instructions.improvement;
    console.log("Rendering improved instructions with:", improvement);
    
    return (
      <>
        {/* Overall feedback in purple with enhanced styling */}
        <div className="text-base mb-5 leading-relaxed font-medium text-purple-700 p-2 bg-purple-50 rounded border border-purple-100">
          {improvement.overallFeedback}
        </div>
        
        {/* Intro Text */}
        {currentSection.introText && (
          <div className="text-base mb-5 leading-relaxed">
            {currentSection.introText}
          </div>
        )}
        
        {/* Subsections with feedback and expandable tooltips */}
        {currentSection.subsections && currentSection.subsections.map((subsection, index) => {
          // Find the corresponding feedback for this subsection
          const subsectionFeedback = improvement.subsections?.find(fb => fb.id === subsection.id);
          const isComplete = subsectionFeedback?.isComplete || false;
          const feedback = subsectionFeedback?.feedback || "Consider addressing this aspect in more detail.";
          
          return (
            <div key={index} className={`mb-5 ${isComplete ? 'opacity-70' : ''}`}>
              <div className="text-base leading-relaxed">
                {/* Render title and instruction with strikethrough if completed */}
                <strong className={`font-bold ${isComplete ? 'line-through text-gray-500' : ''}`}>
                  {subsection.title}:
                </strong>{' '}
                <span className={isComplete ? 'line-through text-gray-500' : ''}>
                  {subsection.instruction}
                </span>
                
                {/* Always show tooltip button */}
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
              
              {/* Feedback from AI in purple with enhanced styling */}
              <div className="mt-1 ml-4 text-purple-700 p-1 bg-purple-50 rounded">
                {feedback}
              </div>
              
              {/* Expandable tooltip content */}
              {subsection.tooltip && expandedTooltips[subsection.id] && (
                <div className="mt-2 mb-3 ml-6 pl-3 border-l-2 border-blue-300 text-base italic text-gray-700 bg-blue-50 p-3 rounded">
                  {subsection.tooltip}
                </div>
              )}
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div
      className="h-full overflow-y-auto section-instruction-panel"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '50%',
        paddingTop: '120px', // Adjusted for header height
        paddingBottom: '2rem',
        zIndex: 10, // Ensure it's below header buttons if they overlap
        background: 'transparent' // Removed the blue background color
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

            {/* Instructions panel - kept the border for clear separation */}
            <div className="border-4 border-blue-600 rounded-lg bg-white p-5 mb-6">
              <div className="text-base leading-relaxed instructions-content">
                {renderInstructionContent()}
              </div>
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
        }
        
        /* Enhanced Purple styling for AI-generated content */
        .text-purple-700 {
          color: #6D28D9;
        }
        
        /* Add a subtle background to highlight AI feedback */
        .instructions-content .text-purple-700 {
          background-color: rgba(237, 233, 254, 0.3);
          border-radius: 4px;
          padding: 2px 4px;
        }
      `}</style>
    </div>
  );
};

export default FullHeightInstructionsPanel;
