// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js
import React, { useState, useEffect, useRef } from 'react';
import sectionContent from '../../data/sectionContent.json'; // Ensure this path is correct
import ConfirmDialog from './ConfirmDialog';
import ExamplesDialog from './ExamplesDialog';
import AppHeader from '../layout/AppHeader';
import SectionCard from '../sections/SectionCard';
import ResearchApproachToggle from '../toggles/ResearchApproachToggle';
import DataAcquisitionToggle from '../toggles/DataAcquisitionToggle';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel'; // Panel will be card-style again
import ModernChatInterface from '../chat/ModernChatInterface';
import {
  improveBatchInstructions,
  updateSectionWithImprovedInstructions
} from '../../services/instructionImprovementService'; // Ensure this path is correct
import '../../styles/PaperPlanner.css'; // Ensure CSS is imported

/**
 * Enhanced Paper Planner
 * REVERTED: Layout back to stable Flexbox side-by-side columns.
 * REVERTED: Feedback button moved back inside right panel.
 * REVERTED: Footer text back to original.
 * KEPT: Functional API fixes, salient PDF button.
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
      if (sectionContent?.sections?.length > 0 && sectionContent.sections[0].id) { return sectionContent.sections[0].id; }
      return 'question'; // Fallback
  };

  // Component State
  const [activeSection, setActiveSection] = useState(getInitialSectionId());
  const [activeApproach, setActiveApproach] = useState('hypothesis');
  const [activeDataMethod, setActiveDataMethod] = useState('experiment');
  const [sectionCompletionStatus, setSectionCompletionStatus] = useState({});
  const sectionRefs = useRef({});
  const [improvingInstructions, setImprovingInstructions] = useState(false); // State for feedback loading

  // --- Effects ---
   useEffect(() => { /* Map refs */ }, [localSectionContent.sections]);
   useEffect(() => { /* Sync activeSection with hook */ }, [currentSectionIdFromHook, activeSection]);
   useEffect(() => { /* Update approach/data method */ }, [userInputs, localSectionContent.sections]);

  // --- Handlers ---
  const setActiveSectionWithManualFlag = (sectionId) => { setActiveSection(sectionId); if (typeof handleSectionChange === 'function') { handleSectionChange(sectionId); } };
  const getSectionCompletionStatus = (sectionId) => { /* ... */ };
  const scrollToSection = (sectionId) => { /* ... */ };
  const getCurrentSectionDataForPanel = () => {
       if (!localSectionContent || !Array.isArray(localSectionContent.sections) || !activeSection) return null;
       const sectionData = localSectionContent.sections.find(s => s && s.id === activeSection);
       return sectionData || null;
   };
  // Handler passed down to the panel again
  const handleFeedbackRequest = async () => { /* ... includes console logs ... */
       if (improvingInstructions) return;
       console.log(`[FEEDBACK_HANDLER] Requesting feedback... (Active section: ${activeSection})`);
       setImprovingInstructions(true);
       try {
         // Functional logic remains the same (calls service, updates state)
         const result = await improveBatchInstructions(localSectionContent.sections, userInputs, sectionContent);
         if (result.success && result.improvedData && result.improvedData.length > 0) {
           const updatedSections = updateSectionWithImprovedInstructions(localSectionContent, result.improvedData);
           setLocalSectionContent(updatedSections);
           const newCompletionStatuses = {};
           result.improvedData.forEach(item => { if (item.completionStatus) newCompletionStatuses[item.id] = item.completionStatus; });
           setSectionCompletionStatus(prevStatus => ({...prevStatus, ...newCompletionStatuses }));
         } else { /* Handle failure */ }
       } catch (error) { /* Handle error */ }
       finally { setImprovingInstructions(false); }
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
    // Restore main flex column layout
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <AppHeader
        activeSection={activeSection} setActiveSection={setActiveSectionWithManualFlag} handleSectionChange={handleSectionChange}
        scrollToSection={scrollToSection} resetProject={() => setShowConfirmDialog(true)} exportProject={exportProject}
        saveProject={saveProject} loadProject={loadProject} importDocumentContent={importDocumentContent}
        setShowExamplesDialog={setShowExamplesDialog}
      />

      {/* Restore Middle Content Area using Flexbox side-by-side */}
      <div className="flex flex-grow w-full">
        {/* Left Side Sections */}
        <div className="w-1/2 px-8 py-6 overflow-y-auto">
             {/* Sections rendering logic */}
             {Array.isArray(localSectionContent?.sections) && localSectionContent.sections.filter(s => s?.id === 'question' || s?.id === 'audience').map(renderSection)}
             <ResearchApproachToggle activeApproach={activeApproach} setActiveApproach={handleApproachToggle} />
             {Array.isArray(localSectionContent?.sections) && localSectionContent.sections.filter(s => ['hypothesis', 'needsresearch', 'exploratoryresearch'].includes(s?.id)).map(renderSection)}
             {Array.isArray(localSectionContent?.sections) && localSectionContent.sections.filter(s => s?.id === 'relatedpapers').map(renderSection)}
             <DataAcquisitionToggle activeMethod={activeDataMethod} setActiveMethod={handleDataMethodToggle} />
             {Array.isArray(localSectionContent?.sections) && localSectionContent.sections.filter(s => ['experiment', 'existingdata'].includes(s?.id)).map(renderSection)}
             {Array.isArray(localSectionContent?.sections) && localSectionContent.sections.filter(s => ['analysis', 'process', 'abstract'].includes(s?.id)).map(renderSection)}
        </div>

        {/* Right Side Instructions Panel Container */}
        <div className="w-1/2 py-6 pl-4 pr-8 overflow-hidden">
             {/* Pass handler and loading state for the internal button */}
            <FullHeightInstructionsPanel
              currentSection={sectionDataForPanel}
              userInputs={userInputs}
              improveInstructions={handleFeedbackRequest} // Pass handler
              loading={improvingInstructions} // Pass loading state
            />
        </div>
      </div>

      {/* Footer - Reverted Text */}
      <div className="w-full text-center text-gray-500 text-base mt-auto border-t border-gray-200 pt-6 pb-6">
        <p>Scientific Paper Planner • Designed for Researchers • {new Date().getFullYear()}</p>
      </div>

      {/* --- Floating Action Buttons --- */}
      {/* Only the Chat Interface remains floating */}
      <ModernChatInterface
          currentSection={currentSectionIdFromHook}
          currentSectionTitle={sectionDataForPanel?.title}
          chatMessages={chatMessages}
          currentMessage={currentMessage}
          setCurrentMessage={setCurrentMessage}
          handleSendMessage={handleSendMessage}
          loading={chatLoading}
          currentSectionData={sectionDataForPanel}
      />

      {/* Dialogs */}
      <ConfirmDialog showConfirmDialog={showConfirmDialog} setShowConfirmDialog={setShowConfirmDialog} resetProject={handleResetRequest} />
      <ExamplesDialog showExamplesDialog={showExamplesDialog} setShowExamplesDialog={setShowExamplesDialog} loadProject={loadProject} />
    </div>
  );
};

export default VerticalPaperPlannerApp;
