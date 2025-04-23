// FILE: src/components/rightPanel/FullHeightInstructionsPanel.js
import React, { useState, useEffect, useCallback } from 'react';
import useAppStore from '../../store/appStore'; // Import the Zustand store
import { logSectionData, validateImprovementData } from '../../utils/debugUtils'; // Keep debug utils

const FullHeightInstructionsPanel = ({ activeSectionId, improveInstructions, loading }) => {
  // --- Select State from Zustand Store ---
  // Use a selector that depends on activeSectionId to get the current section's data
  const currentSection = useAppStore(useCallback(
      (state) => activeSectionId ? state.sections[activeSectionId] : null,
      [activeSectionId]
  ));

  // --- Local State ---
  const [expandedTooltips, setExpandedTooltips] = useState({});

  // Reset tooltips when the active section changes
  useEffect(() => {
    setExpandedTooltips({});
  }, [activeSectionId]);

  // --- Logic ---
  const sectionTitle = currentSection?.title || "Instructions";
  const panelTitle = `${sectionTitle} Instructions & Feedback`;

  const toggleTooltip = (id) => {
    setExpandedTooltips(prev => ({ ...prev, [id]: !prev[id] }));
  };

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

   // --- Render Functions ---

   const renderOriginalInstructions = () => {
     if (!currentSection || !currentSection.originalInstructions) return null;
     // Use originalInstructions from the store state
     const subsections = currentSection.originalInstructions;

     return (
       <>
         {/* Intro Text - Assuming introText is stored elsewhere or not needed here */}
         {/* {currentSection.introText && <div className="text-base mb-5 leading-relaxed">{currentSection.introText}</div>} */}

         {/* Render subsections using originalInstructions */}
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

   const renderImprovedInstructions = () => {
     if (!currentSection || !currentSection.aiInstructions) return null;

     // Use aiInstructions from the store state
     const improvement = currentSection.aiInstructions;
      // Use original instructions structure for titles etc.
     const originalSubsections = currentSection.originalInstructions || [];

     // Validate structure (optional, but good practice)
     // const validationResult = validateImprovementData({ instructions: { improvement } });
     // if (!validationResult.valid) { ... handle error ... }

     const rating = improvement.rating ? Math.round(improvement.rating) : null;
     const ratingColor = getRatingColor(rating);
     const ratingLabel = getRatingLabel(rating);

     return (
       <>
         {/* Overall Feedback */}
         <div className="text-base mb-2 leading-relaxed font-medium text-purple-700 p-2 bg-purple-50 rounded border border-purple-100">
           {improvement.overallFeedback || "Feedback:"}
         </div>

         {/* Rating */}
         {rating && (
           <div className={`text-base mb-5 font-bold ${ratingColor} flex items-center`}>
             Rating: {rating}/10
             <span className="ml-2 font-normal">({ratingLabel})</span>
             {/* Gradient bar can be added here if desired */}
           </div>
         )}

         {/* Render subsections using original structure but with feedback */}
          {Array.isArray(originalSubsections) && originalSubsections.map((origSubsection, index) => {
              if (!origSubsection || !origSubsection.id) return null; // Skip if original subsection is invalid

              // Find corresponding feedback in aiInstructions
              const subsectionFeedback = improvement.subsections?.find(fb => fb && fb.id === origSubsection.id);
              const isComplete = subsectionFeedback?.isComplete || false;
              const feedbackText = subsectionFeedback?.feedback || "No specific feedback provided.";

              return (
                 <div key={origSubsection.id || index} className={`mb-5 ${isComplete ? 'opacity-90' : ''}`}>
                    <div className="text-base leading-relaxed">
                       <strong className={`font-bold ${isComplete ? 'text-green-600' : ''}`}>
                         {origSubsection.title}:
                       </strong>{' '}
                       <span className={isComplete ? 'text-green-600' : ''}>
                         {origSubsection.instruction}
                       </span>
                       {origSubsection.tooltip && (
                         <button
                           className="info-icon-button ml-1"
                           onClick={() => toggleTooltip(origSubsection.id)}
                           aria-label={expandedTooltips[origSubsection.id] ? "Hide details" : "Show details"}
                         >
                           {expandedTooltips[origSubsection.id] ? '−' : 'ⓘ'}
                         </button>
                       )}
                     </div>
                      {/* AI Feedback */}
                     <div className="mt-1 ml-4 text-purple-700 p-1 bg-purple-50 rounded">
                        {feedbackText}
                      </div>
                     {/* Tooltip */}
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


   // --- Main Render ---
   return (
     <div
       className="section-instruction-panel" // Keep existing class for styling
       style={{
         position: 'fixed',
         top: 0,
         right: 0,
         width: '50%',
         paddingTop: '120px', // Adjust as needed for header
         paddingBottom: '2rem',
         zIndex: 10,
         background: 'transparent', // Or a subtle background like 'bg-gray-50'
         overflowY: 'auto', // Make panel scrollable
         height: '100vh', // Ensure it takes full height
       }}
     >
       <div className="px-6 py-4 relative">
         {!currentSection ? (
           <div className="flex items-center justify-center h-full text-gray-500">
             Select a section to view instructions.
           </div>
         ) : (
           <>
             <h3 className="text-lg font-semibold text-blue-800 mb-4">
               {panelTitle}
             </h3>
             <div className="border-4 border-blue-600 rounded-lg bg-white p-5 mb-6">
               <div className="text-base leading-relaxed instructions-content">
                 {/* Render improved instructions if available, otherwise original */}
                 {currentSection.aiInstructions ? renderImprovedInstructions() : renderOriginalInstructions()}
               </div>
             </div>
           </>
         )}
       </div>
     </div>
   );
};

export default FullHeightInstructionsPanel;
