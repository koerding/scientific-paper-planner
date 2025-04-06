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
 * UPDATED: Added safer initialization for activeSection state.
 */
const VerticalPaperPlannerApp = ({ usePaperPlannerHook }) => {
  // Hook destructuring
  const {
    currentSection: currentSectionIdFromHook, // Renamed to avoid conflict
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
      // Prioritize ID from hook if available
      if (currentSectionIdFromHook) return currentSectionIdFromHook;
      // Otherwise, try the first section from the static JSON data
      if (sectionContent?.sections?.length > 0 && sectionContent.sections[0].id) {
          return sectionContent.sections[0].id;
      }
      // Fallback if JSON is weirdly structured or empty
      return 'question';
  };

  // Component State using safer initialization
  const [activeSection, setActiveSection] = useState(getInitialSectionId()); // Use the helper function
  const [activeApproach, setActiveApproach] = useState('hypothesis');
  const [activeDataMethod, setActiveDataMethod] = useState('experiment');
  const [sectionCompletionStatus, setSectionCompletionStatus] = useState({});
  const sectionRefs = useRef({});
  const [improvingInstructions, setImprovingInstructions] = useState(false); // State for feedback loading


  // --- Effects ---
   useEffect(() => { /* Map refs */
       if (localSectionContent?.sections) {
         localSectionContent.sections.forEach(section => {
           if (section?.id) sectionRefs.current[section.id] = sectionRefs.current[section.id] || React.createRef();
         });
       }
   }, [localSectionContent.sections]);

   // Effect to sync activeSection with hook potentially changing *after* initial load
    useEffect(() => {
        if (currentSectionIdFromHook && currentSectionIdFromHook !== activeSection) {
            setActiveSection(currentSectionIdFromHook);
        }
   }, [currentSectionIdFromHook, activeSection]); // Depend on both

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
  const setActiveSectionWithManualFlag = (sectionId) => {
      // Don't set if it's already active? Optional optimization.
      // if (sectionId === activeSection) return;
      setActiveSection(sectionId);
      // Also call the hook's handler if needed, ensures consistency if hook manages external state
      if (typeof handleSectionChange === 'function') {
        handleSectionChange(sectionId);
      }
  };
  const getSectionCompletionStatus = (sectionId) => { /* ... */ };
  const scrollToSection = (sectionId) => { /* ... */ };
  const getCurrentSectionDataForPanel = () => {
      if (!localSectionContent || !Array.isArray(localSectionContent.sections)) return null;
      // Ensure activeSection has a value before trying to find
      if (!activeSection) return null;
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <AppHeader /* ...props... */ />

      {/* Main Content Wrapper */}
      {/* Using padding-right again to accommodate fixed panel */}
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
            // Panel uses its internal fixed positioning logic
       />

      {/* Footer */}
      <div className={`w-full text-center text-gray-500 text-base mt-12 border-t border-gray-200 pt-6 pb-6 pr-[50%]`}>
        <p>Scientific Paper Planner • Designed with Love for Researchers by Konrad (@kordinglab)• 2025</p>
      </div>

      {/* --- Floating Action Buttons --- */}
      <button onClick={handleFeedbackRequest} disabled={improvingInstructions} className={`fixed bottom-24 right-6 z-[51] ...`} title="Get AI Feedback...">
          {improvingInstructions ? ( <svg className="animate-spin ..." /> ) : ( <svg ... /> )}
      </button>
      <ModernChatInterface /* ...props... */ />

      {/* Dialogs */}
      <ConfirmDialog /* ...props... */ />
      <ExamplesDialog /* ...props... */ />
    </div>
  );
};

export default VerticalPaperPlannerApp;
