// FILE: src/components/rightPanel/FullHeightInstructionsPanel.js
// UPDATED: Removed header and borders, adapted to new card design

import React, { useState, useEffect, useCallback } from 'react';
import useAppStore from '../../store/appStore';
import { logSectionData, validateImprovementData } from '../../utils/debugUtils';

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
          <div key={subsection.id} className="mb-5">
            <div className="text-base leading-relaxed">
              <strong className="font-bold">{subsection.title || 'Subsection'}:</strong>{' '}
              {subsection.instruction || 'No instruction text.'}
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
       <div className="text-base mb-2 leading-relaxed font-medium text-purple-700 p-2 bg-purple-50 rounded border border-purple-100">
         {improvement.overallFeedback || "Feedback:"}
       </div>
       {rating && (
         <div className={`text-base mb-5 font-bold ${ratingColor} flex items-center`}>
           Rating: {rating}/10 <span className="ml-2 font-normal">({ratingLabel})</span>
         </div>
       )}
       {Array.isArray(originalSubsections) && originalSubsections.map((origSubsection, index) => {
         // Add null check for origSubsection itself
         if (!origSubsection || !origSubsection.id) return <div key={`imp-err-${index}`}>Invalid original subsection data</div>;

         const subsectionFeedback = improvement.subsections?.find(fb => fb && fb.id === origSubsection.id);
         // Provide defaults if feedback is missing for a subsection
         const isComplete = subsectionFeedback?.isComplete || false;
         const feedbackText = subsectionFeedback?.feedback || "No specific feedback provided for this point.";

         return (
           <div key={origSubsection.id} className={`mb-5 ${isComplete ? 'opacity-90' : ''}`}>
             <div className="text-base leading-relaxed">
               <strong className={`font-bold ${isComplete ? 'text-green-600' : ''}`}>{origSubsection.title || 'Subsection'}:</strong>{' '}
               <span className={isComplete ? 'text-green-600' : ''}>{origSubsection.instruction || 'No instruction text.'}</span>
               {origSubsection.tooltip && (
                 <button className="info-icon-button ml-1" onClick={() => toggleTooltip(origSubsection.id)} aria-label={expandedTooltips[origSubsection.id] ? "Hide details" : "Show details"}>
                   {expandedTooltips[origSubsection.id] ? '−' : 'ⓘ'}
                 </button>
               )}
             </div>
             <div className="mt-1 ml-4 text-purple-700 p-1 bg-purple-50 rounded">{feedbackText}</div>
             {origSubsection.tooltip && expandedTooltips[origSubsection.id] && (
               <div className="mt-2 mb-3 ml-6 pl-3 border-l-2 border-blue-300 text-base italic text-gray-700 bg-blue-50 p-3 rounded">
                 {origSubsection.tooltip}
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
  const currentSection = useAppStore(useCallback(
      (state) => activeSectionId ? state.sections[activeSectionId] : null,
      [activeSectionId]
  ));
  const [expandedTooltips, setExpandedTooltips] = useState({});
  const setUiMode = useAppStore((state) => state.setUiMode);
  
  useEffect(() => { setExpandedTooltips({}); }, [activeSectionId]);

  const toggleTooltip = useCallback((id) => {
    setExpandedTooltips(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return (
    // Root div - removed padding as it's handled by the parent card
    <div className="w-full h-full overflow-y-auto pb-8 box-border flex-shrink-0">
        {/* Conditional rendering directly inside the container */}
        {!currentSection ? (
          // Placeholder when no section is selected
          <div className="flex items-center justify-center h-[200px] text-gray-500">
            Select a section to view its instructions or feedback.
          </div>
        ) : (
          // Main content area - removed border/padding as it's handled by the parent card
          <div className="text-base leading-relaxed instructions-content">
            {currentSection.aiInstructions
                ? renderImprovedInstructionsContent(currentSection, expandedTooltips, toggleTooltip)
                : renderOriginalInstructionsContent(currentSection, expandedTooltips, toggleTooltip)}
          </div>
        )}
    </div> // End of root div
  );
};

export default FullHeightInstructionsPanel;
