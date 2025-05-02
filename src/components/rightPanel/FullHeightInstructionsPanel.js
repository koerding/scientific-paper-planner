// FILE: src/components/rightPanel/FullHeightInstructionsPanel.js
// FIXED: Standardized font sizes to match the root variable definitions
// FIXED: Made styling more consistent throughout the guide panel

import React, { useState, useCallback } from 'react';
import useAppStore from '../../store/appStore';

// --- Helper functions (Defined ONCE here) ---
const getRatingColor = (rating) => {
  if (!rating) return 'text-gray-500';
  if (rating <= 3) return 'text-red-500';
  if (rating <= 5) return 'text-orange-500';
  if (rating <= 7) return 'text-yellow-600';
  if (rating <= 9) return 'text-lime-600';
  return 'text-green-600';
};

const getRatingLabel = (rating) => {
  if (!rating) return '';
  if (rating <= 3) return 'Needs work';
  if (rating <= 5) return 'Average';
  if (rating <= 7) return 'Good';
  if (rating <= 9) return 'Very good';
  return 'Excellent';
};

// Render function for original instructions content
const renderOriginalInstructionsContent = (currentSection, expandedTooltips, toggleTooltip) => {
  if (!currentSection || !currentSection.originalInstructions) return null;
  const subsections = currentSection.originalInstructions;
  return (
    <>
      {Array.isArray(subsections) && subsections.map((subsection, index) => {
        // Add null check for subsection itself
        if (!subsection || !subsection.id) return <div key={`orig-err-${index}`}>Invalid subsection data</div>;

        return (
          <div key={subsection.id} className="mb-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-base leading-relaxed">
              <strong className="font-bold text-gray-800">{subsection.title || 'Subsection'}:</strong>{' '}
              {subsection.instruction || 'No instruction text.'}
              {subsection.tooltip && (
                <button
                  className="info-icon-button ml-1 text-blue-500 hover:text-blue-700"
                  onClick={() => toggleTooltip(subsection.id)}
                  aria-label={expandedTooltips[subsection.id] ? "Hide details" : "Show details"}
                >
                  {expandedTooltips[subsection.id] ? '−' : 'ⓘ'}
                </button>
              )}
            </div>
            {subsection.tooltip && expandedTooltips[subsection.id] && (
              <div className="mt-2 mb-3 pl-3 border-l-2 border-blue-300 text-base italic text-gray-700 bg-blue-50 p-3 rounded">
                {subsection.tooltip}
              </div>
            )}
          </div>
        )
      })}
    </>
  );
};

// Render function for improved instructions content
const renderImprovedInstructionsContent = (currentSection, expandedTooltips, toggleTooltip) => {
   if (!currentSection || !currentSection.aiInstructions) return null;
   const improvement = currentSection.aiInstructions;
   const originalSubsections = currentSection.originalInstructions || [];
   const rating = improvement.rating ? Math.round(improvement.rating) : null;
   const ratingColor = getRatingColor(rating);
   const ratingLabel = getRatingLabel(rating);

   return (
     <>
       {/* Overall feedback - using standardized font size */}
       <div className="mb-4 font-medium text-purple-700 p-4 bg-purple-50 rounded-lg border border-purple-100 shadow-sm">
         {improvement.overallFeedback || "Feedback:"}
       </div>
       
       {/* Rating - using standardized font size */}
       {rating && (
         <div className={`mb-5 font-bold ${ratingColor} flex items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm`}>
           Rating: {rating}/10 <span className="ml-2 font-normal">({ratingLabel})</span>
         </div>
       )}
       
       {/* Subsection feedback - using standardized font sizes */}
       {Array.isArray(originalSubsections) && originalSubsections.map((origSubsection, index) => {
         // Add null check for origSubsection itself
         if (!origSubsection || !origSubsection.id) return <div key={`imp-err-${index}`}>Invalid original subsection data</div>;

         const subsectionFeedback = improvement.subsections?.find(fb => fb && fb.id === origSubsection.id);
         // Provide defaults if feedback is missing for a subsection
         const isComplete = subsectionFeedback?.isComplete || false;
         const feedbackText = subsectionFeedback?.feedback || "No specific feedback provided for this point.";

         return (
           <div key={origSubsection.id} className={`mb-6 bg-white p-4 rounded-lg border ${isComplete ? 'border-green-200' : 'border-gray-200'} shadow-sm`}>
             <div className="leading-relaxed">
               <strong className={`font-bold ${isComplete ? 'text-green-600' : 'text-gray-800'}`}>{origSubsection.title || 'Subsection'}:</strong>{' '}
               <span className={isComplete ? 'text-green-600' : ''}>{origSubsection.instruction || 'No instruction text.'}</span>
               {origSubsection.tooltip && (
                 <button className="info-icon-button ml-1 text-blue-500 hover:text-blue-700" onClick={() => toggleTooltip(origSubsection.id)} aria-label={expandedTooltips[origSubsection.id] ? "Hide details" : "Show details"}>
                   {expandedTooltips[origSubsection.id] ? '−' : 'ⓘ'}
                 </button>
               )}
             </div>
             
             {/* Subsection feedback with standardized font size */}
             <div className="mt-3 ml-0 text-purple-700 p-3 bg-purple-50 rounded-md">{feedbackText}</div>
             
             {origSubsection.tooltip && expandedTooltips[origSubsection.id] && (
               <div className="mt-3 mb-0 ml-0 pl-3 border-l-2 border-blue-300 italic text-gray-700 bg-blue-50 p-3 rounded-md">
                 {subsection.tooltip}
               </div>
             )}
           </div>
         );
       })}
     </>
   );
};
// --- End Helper functions ---


// --- Component ---
const FullHeightInstructionsPanel = ({ 
  activeSectionId, 
  improveInstructions, 
  loading,
  onRequestWrite // Callback to switch to write mode
}) => {
  // Note: This component will completely remount whenever activeSectionId changes
  // because the parent component adds a key={activeSectionId}
  
  // Get current section directly from store using activeSectionId
  const currentSection = useAppStore(state => 
    activeSectionId && state.sections ? state.sections[activeSectionId] : null
  );
  
  const [expandedTooltips, setExpandedTooltips] = useState({});
  
  // Debug logging
  console.log(`Rendering guide panel for section: ${activeSectionId}`, {
    hasSection: !!currentSection,
    title: currentSection?.title,
    hasFeedback: !!currentSection?.aiInstructions
  });

  const toggleTooltip = useCallback((id) => {
    setExpandedTooltips(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // If no section data is found, show an error message
  if (!currentSection) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-red-500">
        <div className="text-center">
          <p className="mb-2 font-semibold">Error loading section content</p>
          <p className="text-sm text-gray-600">
            Section ID: {activeSectionId || "none"}
          </p>
        </div>
      </div>
    );
  }

  return (
    // Root div with improved background color
    <div className="w-full h-full overflow-y-auto pb-8 box-border flex-shrink-0 bg-gray-50">
      {/* Main content area - using class to standardize font sizes */}
      <div className="instructions-content p-2">
        {currentSection.aiInstructions
            ? renderImprovedInstructionsContent(currentSection, expandedTooltips, toggleTooltip)
            : renderOriginalInstructionsContent(currentSection, expandedTooltips, toggleTooltip)}
      </div>
    </div>
  );
};

export default FullHeightInstructionsPanel;
