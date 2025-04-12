import React, { useState, useEffect, useRef } from 'react';

/**
 * Enhanced instructions panel with properly formatted tooltips and matching font sizes
 */
const FullHeightInstructionsPanel = ({ currentSection }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);
  
  useEffect(() => {
    // Debug logging
    if (currentSection) {
      console.log("[PANEL] Current section data:", currentSection);
      console.log("[PANEL] Has introText:", !!currentSection.introText);
      console.log("[PANEL] Has subsections:", Array.isArray(currentSection.subsections));
    }
    
    // Close tooltip when section changes
    setShowTooltip(false);
  }, [currentSection]);
  
  // Handle clicks outside the tooltip to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setShowTooltip(false);
      }
    }
    
    function handleEscKey(event) {
      if (event.key === 'Escape') {
        setShowTooltip(false);
      }
    }
    
    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showTooltip]);

  // Create a title that includes the section name
  const sectionTitle = currentSection?.title || "Instructions";
  const panelTitle = `${sectionTitle} Instructions & Feedback`;
  
  // Handle info icon click to show tooltip
  const handleInfoClick = (content, event) => {
    setTooltipContent(content);
    
    // Calculate position - we want it centered but not off-screen
    const buttonRect = event.currentTarget.getBoundingClientRect();
    const position = {
      top: buttonRect.bottom + window.scrollY + 10,
      left: buttonRect.left + window.scrollX - 200 + (buttonRect.width / 2) // Center it relative to button
    };
    
    setTooltipPosition(position);
    setShowTooltip(true);
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
              {/* Intro Text */}
              {currentSection.introText && (
                <div className="text-base mb-5 leading-relaxed">
                  {currentSection.introText}
                </div>
              )}
              
              {/* Subsections with tooltips */}
              {currentSection.subsections && currentSection.subsections.map((subsection, index) => (
                <div key={index} className="mb-5">
                  <div className="text-base leading-relaxed">
                    <strong className="font-bold">{subsection.title}</strong> {/* No line break after title */}
                    {subsection.instruction} {/* Instruction on same line as title */}
                    {subsection.tooltip && (
                      <button 
                        className="info-icon-button ml-1"
                        onClick={(e) => handleInfoClick(subsection.tooltip, e)}
                        aria-label="More information"
                      >
                        ⓘ
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {/* If no subsections but has legacy instructions */}
              {!currentSection.subsections && currentSection.instructions?.text && (
                <div className="text-base leading-relaxed whitespace-pre-line">
                  {currentSection.instructions.text}
                </div>
              )}
            </div>

            {/* Feedback section if it exists */}
            {currentSection.instructions?.feedback && currentSection.instructions.feedback.length > 5 && (
              <div className="mt-6 pt-4 border-t border-blue-300">
                <h4 className="text-lg font-semibold text-blue-700 mb-3">Feedback</h4>
                <div className="border-4 border-blue-500 rounded-lg bg-white p-5">
                  <div className="text-base leading-relaxed whitespace-pre-line">
                    {currentSection.instructions.feedback}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Tooltip Modal for displaying long tooltip content */}
      {showTooltip && (
        <div 
          ref={tooltipRef}
          className="fixed z-50 bg-white rounded-lg shadow-xl p-4 border border-gray-200"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            maxWidth: '500px',
            maxHeight: '300px',
            overflowY: 'auto',
            animation: 'fadeIn 0.2s ease-out forwards'
          }}
        >
          <button 
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowTooltip(false)}
          >
            ✕
          </button>
          <div className="prose prose-blue max-w-none mt-2 text-gray-700 text-base">
            {tooltipContent}
          </div>
        </div>
      )}
      
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
        
        /* Animation for tooltip */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Section styling from PaperPlanner.css */
        .section-instruction-panel .prose p {
          margin-top: 1em;
          margin-bottom: 1em;
        }
      `}</style>
    </div>
  );
};

export default FullHeightInstructionsPanel;
