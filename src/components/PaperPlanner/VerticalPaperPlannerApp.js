// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js
import React, { useState, useEffect, useRef } from 'react';
import sectionContent from '../../data/sectionContent.json'; // Ensure this path is correct
import ConfirmDialog from './ConfirmDialog';
import ExamplesDialog from './ExamplesDialog';
import AppHeader from '../layout/AppHeader';
import SectionCard from '../sections/SectionCard';
import ResearchApproachToggle from '../toggles/ResearchApproachToggle';
import DataAcquisitionToggle from '../toggles/DataAcquisitionToggle';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';
import ModernChatInterface from '../chat/ModernChatInterface';
import {
  improveBatchInstructions,
  updateSectionWithImprovedInstructions
} from '../../services/instructionImprovementService'; // Ensure this path is correct
import '../../styles/PaperPlanner.css'; // Ensure CSS is imported

/**
 * Enhanced Paper Planner
 * FIXED: Corrected SVG syntax error in floating feedback button AGAIN.
 */
const VerticalPaperPlannerApp = ({ usePaperPlannerHook }) => {
  // Hook destructuring
  const {
    currentSection: currentSectionIdFromHook,
    userInputs, chatMessages, currentMessage, loading: chatLoading,
    showConfirmDialog, showExamplesDialog, setCurrentMessage, setShowConfirmDialog,
    setShowExamplesDialog, handleSectionChange, handleInputChange, handleSendMessage,
    resetProject: hookResetProject, exportProject, saveProject, loadProject, importDocumentContent
  } = usePaperPlannerHook;

  // Initialize localSectionContent first
   const [localSectionContent, setLocalSectionContent] = useState(() => {
      try { return JSON.parse(JSON.stringify(sectionContent)); }
      catch (e) { console.error("Failed to parse initial sectionContent", e); return { sections: [] }; }
  });

  // Determine a safe initial active section ID
  const getInitialSectionId = () => {
      if (currentSectionIdFromHook) return currentSectionIdFromHook;
      if (sectionContent?.sections?.length > 0 && sectionContent.sections[0].id) {
          return sectionContent.sections[0].id;
      }
      return 'question'; // Fallback
  };

  // Component State using safer initialization
  const [activeSection, setActiveSection] = useState(getInitialSectionId());
  const [activeApproach, setActiveApproach] = useState('hypothesis');
  const [activeDataMethod, setActiveDataMethod] = useState('experiment');
  const [sectionCompletionStatus, setSectionCompletionStatus] = useState({});
  const sectionRefs = useRef({});
  const [improvingInstructions, setImprovingInstructions] = useState(false);

  // --- Effects ---
   useEffect(() => { /* Map refs */
       if (localSectionContent?.sections) {
         localSectionContent.sections.forEach(section => {
           if (section?.id) sectionRefs.current[section.id] = sectionRefs.current[section.id] || React.createRef();
         });
       }
   }, [localSectionContent.sections]);
   useEffect(() => { /* Sync activeSection with hook */
        if (currentSectionIdFromHook && currentSectionIdFromHook !== activeSection) {
            setActiveSection(currentSectionIdFromHook);
        }
   }, [currentSectionIdFromHook, activeSection]);
   useEffect(() => { /* Update approach/data method */
      const placeholders = {};
      if (localSectionContent?.sections) { localSectionContent.sections.forEach(s => { if (s?.id) placeholders[s.id] = s.placeholder || ''; }); }
      const isModified = (sectionId) => { const content = userInputs[sectionId]; return typeof content === 'string' && content.trim() !== '' && content !== placeholders[sectionId]; };
      if (isModified('hypothesis')) setActiveApproach('hypothesis');
      else if (isModified('needsresearch')) setActiveApproach('needsresearch');
      else if (isModified('exploratoryresearch')) setActiveApproach('exploratoryresearch');
      else setActiveApproach('hypothesis');
      if (isModified('experiment')) setActiveDataMethod('experiment');
      else if (isModified('existingdata')) setActiveDataMethod('existingdata');
      else setActiveDataMethod('experiment');
   }, [userInputs, localSectionContent.sections]);

  // --- Handlers ---
  const setActiveSectionWithManualFlag = (sectionId) => { setActiveSection(sectionId); if (typeof handleSectionChange === 'function') { handleSectionChange(sectionId); } };
  const getSectionCompletionStatus = (sectionId) => { /* ... */ };
  const scrollToSection = (sectionId) => { /* ... */ };
  const getCurrentSectionDataForPanel = () => {
       if (!localSectionContent || !Array.isArray(localSectionContent.sections) || !activeSection) return null;
       const sectionData = localSectionContent.sections.find(s => s && s.id === activeSection);
       return sectionData || null;
   };
  const handleFeedbackRequest = async () => { /* ... includes console logs ... */
       if (improvingInstructions) return;
       console.log(`[FEEDBACK_HANDLER] Requesting feedback... (Active section: ${activeSection})`);
       setImprovingInstructions(true);
       try {
         console.log("[FEEDBACK_HANDLER] Calling improveBatchInstructions...");
         const result = await improveBatchInstructions(localSectionContent.sections, userInputs, sectionContent);
         console.log("[FEEDBACK_HANDLER] improveBatchInstructions returned:", result);
         if (result.success && result.improvedData && result.improvedData.length > 0) {
           console.log("[FEEDBACK_HANDLER] Processing successful result...");
           const updatedSections = updateSectionWithImprovedInstructions(localSectionContent, result.improvedData);
           setLocalSectionContent(updatedSections); // Update state
           const newCompletionStatuses = {};
           result.improvedData.forEach(item => { if (item.completionStatus) newCompletionStatuses[item.id] = item.completionStatus; });
           setSectionCompletionStatus(prevStatus => ({...prevStatus, ...newCompletionStatuses }));
            console.log("[FEEDBACK_HANDLER] State updated successfully.");
         } else { console.error("[FEEDBACK_HANDLER] Failed:", result.message || "No improved instructions returned."); alert("Sorry, couldn't get feedback at this time."); }
       } catch (error) { console.error("[FEEDBACK_HANDLER] Error caught:", error); alert("An error occurred while getting feedback."); }
       finally { console.log("[FEEDBACK_HANDLER] Finally block reached. Setting loading to false."); setImprovingInstructions(false); }
   };
  const handleResetRequest = () => { /* ... */ };
  const shouldDisplaySection = (sectionId) => { /* ... */ };
  const handleApproachToggle = (approach) => { /* ... */ };
  const handleDataMethodToggle = (method) => { /* ... */ };

  // --- Render Logic ---
  const renderSection = (section) => {
       if (!section || !section.id || !shouldDisplaySection(section.id)) return null;
       const isCurrentActive = activeSection === section.id;
       const completionStatus = getSectionCompletionStatus(section.id);
       return ( <SectionCard key={section.id} section={section} /* ...props... */ /> );
   };
  const sectionDataForPanel = getCurrentSectionDataForPanel();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <AppHeader /* ...props... */ />

      {/* Main Content Wrapper */}
      <div className={`w-full mx-auto pr-[50%]`}>
          {/* Left Column Content */}
          <div className={`px-8 py-6`}>
              {/* Sections rendering logic */}
              {Array.isArray(localSectionContent?.sections) && localSectionContent.sections.filter(s => s?.id === 'question' || s?.id === 'audience').map(renderSection)}
              <ResearchApproachToggle activeApproach={activeApproach} setActiveApproach={handleApproachToggle} />
              {Array.isArray(localSectionContent?.sections) && localSectionContent.sections.filter(s => ['hypothesis', 'needsresearch', 'exploratoryresearch'].includes(s?.id)).map(renderSection)}
              {Array.isArray(localSectionContent?.sections) && localSectionContent.sections.filter(s => s?.id === 'relatedpapers').map(renderSection)}
              <DataAcquisitionToggle activeMethod={activeDataMethod} setActiveMethod={handleDataMethodToggle} />
              {Array.isArray(localSectionContent?.sections) && localSectionContent.sections.filter(s => ['experiment', 'existingdata'].includes(s?.id)).map(renderSection)}
              {Array.isArray(localSectionContent?.sections) && localSectionContent.sections.filter(s => ['analysis', 'process', 'abstract'].includes(s?.id)).map(renderSection)}
          </div>
      </div>

      {/* Right Panel */}
      <FullHeightInstructionsPanel
            currentSection={sectionDataForPanel}
            userInputs={userInputs}
       />

      {/* Footer */}
      <div className={`w-full text-center text-gray-500 text-base mt-12 border-t border-gray-200 pt-6 pb-6 pr-[50%]`}>
        <p>Scientific Paper Planner • Designed with Love for Researchers by Konrad (@kordinglab)• 2025</p>
      </div>

      {/* --- Floating Action Buttons --- */}
      {/* Floating Feedback Button - Corrected SVG Syntax */}
      <button
          onClick={handleFeedbackRequest}
          disabled={improvingInstructions}
          className={`fixed bottom-24 right-6 z-[51] w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ease-in-out ${
              improvingInstructions ? 'bg-gray-400 cursor-not-allowed scale-95' : 'bg-purple-600 text-white hover:bg-purple-700 hover:scale-105'
          }`}
          title="Get AI Feedback for all sections with content"
      >
          {improvingInstructions ? (
               <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
          ) : (
              // Lightbulb Icon
              <svg className="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
          )}
      </button>

      {/* Chat Interface */}
      <ModernChatInterface
          currentSection={currentSectionIdFromHook} // Pass ID from hook
          currentSectionTitle={sectionDataForPanel?.title} // Get title from panel data
          chatMessages={chatMessages}
          currentMessage={currentMessage}
          setCurrentMessage={setCurrentMessage}
          handleSendMessage={handleSendMessage}
          loading={chatLoading}
          currentSectionData={sectionDataForPanel} // Pass panel data
      />

      {/* Dialogs */}
      <ConfirmDialog showConfirmDialog={showConfirmDialog} setShowConfirmDialog={setShowConfirmDialog} resetProject={handleResetRequest} />
      <ExamplesDialog showExamplesDialog={showExamplesDialog} setShowExamplesDialog={setShowExamplesDialog} loadProject={loadProject} />
    </div>
  );
};

export default VerticalPaperPlannerApp;
