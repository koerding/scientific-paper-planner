// src/components/rightPanel/FullHeightInstructionsPanel.js
import React, { useState, useEffect } from 'react';
import { logSectionData, validateImprovementData } from '../../utils/debugUtils';

const FullHeightInstructionsPanel = ({ currentSection, improveInstructions, loading }) => {
  // Track which tooltips are expanded
  const [expandedTooltips, setExpandedTooltips] = useState({});
  
  useEffect(() => {
    // Reset expanded tooltips when section changes
    setExpandedTooltips({});
  }, [currentSection]);
  
  // Listen for global reset events to clear local state
  useEffect(() => {
    const handleProjectReset = () => {
      console.log(`[FullHeightInstructionsPanel] Resetting local state due to global reset event`);
      setExpandedTooltips({});
    };
    
    const handleProjectDataLoaded = () => {
      console.log(`[FullHeightInstructionsPanel] Resetting local state due to project data load`);
      setExpandedTooltips({});
    };
    
    const handleDocumentImported = () => {
      console.log(`[FullHeightInstructionsPanel] Resetting local state due to document import`);
      setExpandedTooltips({});
    };
    
    // Listen for various events that should trigger a reset
    window.addEventListener('projectStateReset', handleProjectReset);
    window.addEventListener('projectDataLoaded', handleProjectDataLoaded);
    window.addEventListener('documentImported', handleDocumentImported);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('projectStateReset', handleProjectReset);
      window.removeEventListener('projectDataLoaded', handleProjectDataLoaded);
      window.removeEventListener('documentImported', handleDocumentImported);
    };
  }, []);
  
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

  // Get color based on rating
  const getRatingColor = (rating) => {
    if (!rating) return 'text-gray-500';
    
    if (rating <= 3) return 'text-red-500';
    if (rating <= 5) return 'text-orange-500';
    if (rating <= 7) return 'text-yellow-600';
    if (rating <= 9) return 'text-lime-600';
    return 'text-green-600';
  };

  // Get the label for a rating
  const getRatingLabel = (rating) => {
    if (!rating) return '';
    
    if (rating <= 3) return 'Needs work';
    if (rating <= 5) return 'Average';
    if (rating <= 7) return 'Good';
    if (rating <= 9) return 'Very good';
    return 'Excellent';
  };

  /**
   * Renders instruction content based on whether improvement feedback exists
   */
  const renderInstructionContent = () => {
    if (!currentSection) return null;
    
    // For debugging - log the current section structure using our debug utility
    logSectionData(currentSection, "FullHeightInstructionsPanel rendering");
    
    // Check if we have improvement feedback data
    const hasImprovement = currentSection.instructions && 
                          currentSection.instructions.improvement;
    
    if (hasImprovement) {
      // Validate the improvement data structure
      const validationResult = validateImprovementData(currentSection);
      if (!validationResult.valid) {
        console.error("Invalid improvement data structure:", validationResult.reason, validationResult.details || '');
        console.log("Falling back to original instructions due to invalid improvement data");
        return renderOriginalInstructions();
      }
      
      console.log("Found valid improvement data, rendering improved instructions");
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
    
    // Extract the numerical rating (if available)
    const rating = improvement.rating ? Math.round(improvement.rating) : null;
    const ratingColor = getRatingColor(rating);
    const ratingLabel = getRatingLabel(rating);
    
    // Console.error if critical data is missing
    if (!improvement.overallFeedback) {
      console.error("Missing overallFeedback in improvement data!");
    }
    if (!improvement.subsections || !Array.isArray(improvement.subsections)) {
      console.error("Missing or invalid subsections array in improvement data!");
    }
    
    return (
      <>
        {/* Overall feedback in purple with enhanced styling */}
        <div className="text-base mb-2 leading-relaxed font-medium text-purple-700 p-2 bg-purple-50 rounded border border-purple-100">
          {improvement.overallFeedback || "Great work on this section! Here's some feedback to consider."}
        </div>
        
        {/* Show the numeric rating if available */}
        {rating && (
          <div className={`text-base mb-5 font-bold ${ratingColor} flex items-center`}>
            Rating: {rating}/10
            <span className="ml-2 font-normal">({ratingLabel})</span>
            <div className={`ml-auto w-16 h-3 rounded-full bg-gradient-to-r ${
              rating <= 3 ? 'from-red-600 to-red-300' :
              rating <= 5 ? 'from-orange-600 to-orange-300' :
              rating <= 7 ? 'from-yellow-600 to-yellow-300' :
              rating <= 9 ? 'from-lime-600 to-lime-300' :
              'from-green-600 to-green-300'
            }`}></div>
          </div>
        )}
        
        {/* Intro Text */}
        {currentSection.introText && (
          <div className="text-base mb-5 leading-relaxed">
            {currentSection.introText}
          </div>
        )}
        
        {/* Subsections with feedback and expandable tooltips */}
        {currentSection.subsections && currentSection.subsections.map((subsection, index) => {
          if (!subsection || !subsection.id) {
            console.error(`Invalid subsection at index ${index}:`, subsection);
            return null; // Skip invalid subsections
          }
          
          // Find the corresponding feedback for this subsection
          let subsectionFeedback;
          let isComplete = false;
          let feedback = "Consider addressing this aspect in more detail.";
          
          try {
            // Only attempt to find feedback if subsections array exists and is valid
            if (improvement.subsections && Array.isArray(improvement.subsections)) {
              subsectionFeedback = improvement.subsections.find(fb => fb && fb.id === subsection.id);
              
              if (subsectionFeedback) {
                isComplete = !!subsectionFeedback.isComplete; // Convert to boolean
                feedback = subsectionFeedback.feedback || feedback;
              } else {
                console.warn(`No feedback found for subsection ${subsection.id}`);
              }
            } else {
              console.warn("improvement.subsections is not a valid array:", improvement.subsections);
            }
          } catch (error) {
            console.error(`Error processing feedback for subsection ${subsection.id}:`, error);
          }
          
          return (
            <div key={index} className={`mb-5 ${isComplete ? 'opacity-90' : ''}`}>
              <div className="text-base leading-relaxed">
                {/* Use green text for completed items */}
                <strong className={`font-bold ${isComplete ? 'text-green-600' : ''}`}>
                  {subsection.title}:
                </strong>{' '}
                <span className={isComplete ? 'text-green-600' : ''}>
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
      className="section-instruction-panel"
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
    </div>
  );
};

export default FullHeightInstructionsPanel;
