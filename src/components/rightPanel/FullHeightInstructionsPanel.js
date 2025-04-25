// FILE: src/components/rightPanel/FullHeightInstructionsPanel.js
// MODIFIED: Changed the format of the panel title.

import React, { useState, useEffect, useCallback } from 'react';
import useAppStore from '../../store/appStore';
import { logSectionData, validateImprovementData } from '../../utils/debugUtils';

// --- Helper functions moved outside the component ---
const getRatingColor = (rating) => { /* ... (no changes needed) ... */ if (!rating) return 'text-gray-500'; if (rating <= 3) return 'text-red-500'; if (rating <= 5) return 'text-orange-500'; if (rating <= 7) return 'text-yellow-600'; if (rating <= 9) return 'text-lime-600'; return 'text-green-600'; };
const getRatingLabel = (rating) => { /* ... (no changes needed) ... */ if (!rating) return ''; if (rating <= 3) return 'Needs work'; if (rating <= 5) return 'Average'; if (rating <= 7) return 'Good'; if (rating <= 9) return 'Very good'; return 'Excellent'; };

// Render function for original instructions content
const renderOriginalInstructionsContent = (currentSection, expandedTooltips, toggleTooltip) => {
  // ... (function remains the same) ...
  if (!currentSection || !currentSection.originalInstructions) return null;
  const subsections = currentSection.originalInstructions;
  return (
    <>
      {Array.isArray(subsections) && subsections.map((subsection, index) => (
        <div key={subsection?.id || index} className="mb-5">
          <div className="text-base leading-relaxed">
            <strong className="font-bold">{subsection?.title}:</strong>{' '}
            {subsection?.instruction}
            {subsection?.tooltip && (
              <button
                className="info-icon-button ml-1"
                onClick={() => toggleTooltip(subsection.id)}
                aria-label={expandedTooltips[subsection.id] ? "Hide details" : "Show details"}
              >
                {expandedTooltips[subsection.id] ? '−' : 'ⓘ'}
              </button>
            )}
          </div>
          {subsection?.tooltip && expandedTooltips[subsection.id] && (
            <div className="mt-2 mb-3 pl-3 border-l-2 border-blue-300 text-base italic text-gray-700 bg-blue-50 p-3 rounded">
              {subsection.tooltip}
            </div>
          )}
        </div>
      ))}
    </>
  );
};

// Render function for improved instructions content
const renderImprovedInstructionsContent = (currentSection, expandedTooltips, toggleTooltip) => {
  // ... (function remains the same) ...
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
         if (!origSubsection || !origSubsection.id) return null;
         const subsectionFeedback = improvement.subsections?.find(fb => fb && fb.id === origSubsection.id);
         const isComplete = subsectionFeedback?.isComplete || false;
         const feedbackText = subsectionFeedback?.feedback || "No specific feedback provided.";
         return (
           <div key={origSubsection.id || index} className={`mb-5 ${isComplete ? 'opacity-90' : ''}`}>
             <div className="text-base leading-relaxed">
               <strong className={`font-bold ${isComplete ? 'text-green-600' : ''}`}>{origSubsection.title}:</strong>{' '}
               <span className={isComplete ? 'text-green-600' : ''}>{origSubsection.instruction}</span>
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

// --- Component ---
const FullHeightInstructionsPanel = ({ activeSectionId, improveInstructions, loading }) => {
  // --- Select State from Zustand Store ---
  const currentSection = useAppStore(useCallback(
      (state) => activeSectionId ? state.sections[activeSectionId] : null,
      [activeSectionId]
  ));

  // --- Local State ---
  const [expandedTooltips, setExpandedTooltips] = useState({});

  // Reset tooltips when the active section changes
  useEffect(() => { setExpandedTooltips({}); }, [activeSectionId]);

  // --- Logic ---
  const sectionTitle = currentSection?.title || "Selected Section"; // Default title if none found

  // *** MODIFIED: Changed panel title format ***
  const panelTitle = `Instructions / Feedback on ${sectionTitle}`;
  // *** END MODIFICATION ***

  const toggleTooltip = useCallback((id) => {
    setExpandedTooltips(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return (
    <div
      style={{
        width: '50%', // Takes width from flex parent
        height: '100%', // Takes height from flex parent
        overflowY: 'auto', // Scrolls its own content
        paddingTop: '20px',
        background: 'transparent',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        paddingBottom: '2rem',
      }}
    >
      <div className="relative">
        {/* Render the updated title */}
        <h3 className="text-lg font-semibold text-blue-800 mb-4">
          {panelTitle}
        </h3>

        {!currentSection ? (
          <div className="flex items-center justify-center h-[300px] text-gray-500 border-4 border-blue-600 rounded-lg bg-white p-5 mb-6">
            Select a section on the left to view its instructions or feedback.
          </div>
        ) : (
          <>
            {/* Content area */}
            <div className="border-4 border-blue-600 rounded-lg bg-white p-5 mb-6">
              <div className="text-base leading-relaxed instructions-content">
                {currentSection.aiInstructions
                    ? renderImprovedInstructionsContent(currentSection, expandedTooltips, toggleTooltip)
                    : renderOriginalInstructionsContent(currentSection, expandedTooltips, toggleTooltip)}
              </div>
            </div>
             {/* Optional: Improve Instructions Button (if needed) */}
             {/* <button onClick={() => improveInstructions(activeSectionId)} disabled={loading} className="...">Improve Instructions</button> */}
          </>
        )}
      </div>
    </div>
  );
};

export default FullHeightInstructionsPanel;
