// FILE: src/components/rightPanel/FullHeightInstructionsPanel.js
import React, { useState, useEffect, useCallback } from 'react';
import useAppStore from '../../store/appStore';
import { logSectionData, validateImprovementData } from '../../utils/debugUtils';

// Assuming header height is approx 64px (adjust if necessary)
const HEADER_HEIGHT = '64px'; // Or get dynamically if possible

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
  const sectionTitle = currentSection?.title || "Instructions";
  const panelTitle = `${sectionTitle} Instructions & Feedback`;
  const toggleTooltip = (id) => { /* ... */ };
  const getRatingColor = (rating) => { /* ... */ };
  const getRatingLabel = (rating) => { /* ... */ };
  const renderOriginalInstructions = () => { /* ... (Keep implementation) ... */ };
  const renderImprovedInstructions = () => { /* ... (Keep implementation) ... */ };

  // --- Main Render ---
  return (
    <div
      // className="section-instruction-panel" // Class might no longer be needed or need adjustment
      style={{
        // Removed fixed positioning, top, right, zIndex
        width: '50%', // Let flexbox handle width distribution (or use flex-1 class)
        // Set height relative to viewport minus header, allow scrolling
        height: `calc(100vh - ${HEADER_HEIGHT})`, // Adjust header height if needed
        overflowY: 'auto', // Make this panel scroll independently
        paddingTop: '20px', // Add some top padding (adjust as needed)
        // Keep background transparent or set explicitly e.g., backgroundColor: '#f9fafb' (gray-50)
        background: 'transparent',
        // Add padding to match LeftPanel if desired
        paddingLeft: '1rem', // px-4
        paddingRight: '1rem', // px-4
        paddingBottom: '2rem', // py-8 or similar
      }}
    >
      {/* Keep inner container for padding if needed */}
      <div className="relative"> {/* Removed px-6 py-4 if added to outer div */}
        {!currentSection ? (
          <div className="flex items-center justify-center h-[300px] text-gray-500"> {/* Added height */}
            Select a section to view instructions.
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              {panelTitle}
            </h3>
            <div className="border-4 border-blue-600 rounded-lg bg-white p-5 mb-6">
              <div className="text-base leading-relaxed instructions-content">
                {currentSection.aiInstructions ? renderImprovedInstructions() : renderOriginalInstructions()}
              </div>
            </div>
             {/* Optional: Improve Instructions Button */}
             {/* <button onClick={() => improveInstructions(activeSectionId)} disabled={loading} className="...">Improve Instructions</button> */}
          </>
        )}
      </div>
    </div>
  );
};

// --- Re-add render functions (kept for completeness, no changes needed within them) ---
const getRatingColor = (rating) => { if (!rating) return 'text-gray-500'; if (rating <= 3) return 'text-red-500'; if (rating <= 5) return 'text-orange-500'; if (rating <= 7) return 'text-yellow-600'; if (rating <= 9) return 'text-lime-600'; return 'text-green-600'; };
const getRatingLabel = (rating) => { if (!rating) return ''; if (rating <= 3) return 'Needs work'; if (rating <= 5) return 'Average'; if (rating <= 7) return 'Good'; if (rating <= 9) return 'Very good'; return 'Excellent'; };
const renderOriginalInstructions = (currentSection, expandedTooltips, toggleTooltip) => { if (!currentSection || !currentSection.originalInstructions) return null; const subsections = currentSection.originalInstructions; return ( <> {Array.isArray(subsections) && subsections.map((subsection, index) => ( <div key={subsection?.id || index} className="mb-5"> <div className="text-base leading-relaxed"> <strong className="font-bold">{subsection?.title}:</strong>{' '} {subsection?.instruction} {subsection?.tooltip && ( <button className="info-icon-button ml-1" onClick={() => toggleTooltip(subsection.id)} aria-label={expandedTooltips[subsection.id] ? "Hide details" : "Show details"}>{expandedTooltips[subsection.id] ? '−' : 'ⓘ'}</button> )} </div> {subsection?.tooltip && expandedTooltips[subsection.id] && ( <div className="mt-2 mb-3 pl-3 border-l-2 border-blue-300 text-base italic text-gray-700 bg-blue-50 p-3 rounded"> {subsection.tooltip} </div> )} </div> ))} </> ); };
const renderImprovedInstructions = (currentSection, expandedTooltips, toggleTooltip) => { if (!currentSection || !currentSection.aiInstructions) return null; const improvement = currentSection.aiInstructions; const originalSubsections = currentSection.originalInstructions || []; const rating = improvement.rating ? Math.round(improvement.rating) : null; const ratingColor = getRatingColor(rating); const ratingLabel = getRatingLabel(rating); return ( <> <div className="text-base mb-2 leading-relaxed font-medium text-purple-700 p-2 bg-purple-50 rounded border border-purple-100">{improvement.overallFeedback || "Feedback:"}</div> {rating && ( <div className={`text-base mb-5 font-bold ${ratingColor} flex items-center`}> Rating: {rating}/10 <span className="ml-2 font-normal">({ratingLabel})</span> </div> )} {Array.isArray(originalSubsections) && originalSubsections.map((origSubsection, index) => { if (!origSubsection || !origSubsection.id) return null; const subsectionFeedback = improvement.subsections?.find(fb => fb && fb.id === origSubsection.id); const isComplete = subsectionFeedback?.isComplete || false; const feedbackText = subsectionFeedback?.feedback || "No specific feedback provided."; return ( <div key={origSubsection.id || index} className={`mb-5 ${isComplete ? 'opacity-90' : ''}`}> <div className="text-base leading-relaxed"> <strong className={`font-bold ${isComplete ? 'text-green-600' : ''}`}>{origSubsection.title}:</strong>{' '} <span className={isComplete ? 'text-green-600' : ''}>{origSubsection.instruction}</span> {origSubsection.tooltip && ( <button className="info-icon-button ml-1" onClick={() => toggleTooltip(origSubsection.id)} aria-label={expandedTooltips[origSubsection.id] ? "Hide details" : "Show details"}>{expandedTooltips[origSubsection.id] ? '−' : 'ⓘ'}</button> )} </div> <div className="mt-1 ml-4 text-purple-700 p-1 bg-purple-50 rounded">{feedbackText}</div> {origSubsection.tooltip && expandedTooltips[origSubsection.id] && ( <div className="mt-2 mb-3 ml-6 pl-3 border-l-2 border-blue-300 text-base italic text-gray-700 bg-blue-50 p-3 rounded">{origSubsection.tooltip}</div> )} </div> ); })} </> ); };


// --- Update render calls within the component ---
FullHeightInstructionsPanel.prototype.renderOriginalInstructions = function() { return renderOriginalInstructions(this.props.currentSection, this.state.expandedTooltips, this.toggleTooltip); };
FullHeightInstructionsPanel.prototype.renderImprovedInstructions = function() { return renderImprovedInstructions(this.props.currentSection, this.state.expandedTooltips, this.toggleTooltip); };


export default FullHeightInstructionsPanel;
