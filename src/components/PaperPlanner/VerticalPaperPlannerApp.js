// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js
import React, { useState, useEffect, useRef } from 'react';
import sectionContent from '../../data/sectionContent.json';
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
} from '../../services/instructionImprovementService';
import '../../styles/PaperPlanner.css'; // Ensure CSS is imported

/**
 * Enhanced Paper Planner
 * UPDATED: Moved feedback button to float near chat icon.
 * UPDATED: Restored Question placeholder instruction text.
 */
const VerticalPaperPlannerApp = ({ usePaperPlannerHook }) => {
  // Hook destructuring
  const {
    currentSection: currentSectionIdForChat,
    currentSectionData, // Note: May be stale if localSectionContent is modified
    userInputs,
    chatMessages,
    currentMessage,
    loading: chatLoading, // Loading state specifically for chat
    showConfirmDialog,
    showExamplesDialog,
    setCurrentMessage,
    setShowConfirmDialog,
    setShowExamplesDialog,
    handleSectionChange,
    handleInputChange,
    handleSendMessage,
    resetProject: hookResetProject,
    exportProject,
    saveProject,
    loadProject,
    importDocumentContent
  } = usePaperPlannerHook;

  // Component State
  const [activeSection, setActiveSection] = useState(currentSectionIdForChat);
  const [activeApproach, setActiveApproach] = useState('hypothesis');
  const [activeDataMethod, setActiveDataMethod] = useState('experiment');
  const [sectionCompletionStatus, setSectionCompletionStatus] = useState({});
  const sectionRefs = useRef({});
  const [localSectionContent, setLocalSectionContent] = useState(() => {
      try { return JSON.parse(JSON.stringify(sectionContent)); }
      catch (e) { console.error("Failed to parse initial sectionContent", e); return { sections: [] }; }
  });
  const [improvingInstructions, setImprovingInstructions] = useState(false); // Renamed state for feedback loading

  // --- Effects ---
  useEffect(() => { // Map refs
    if (localSectionContent?.sections) {
      localSectionContent.sections.forEach(section => {
        if (section?.id) sectionRefs.current[section.id] = sectionRefs.current[section.id] || React.createRef();
      });
    }
  }, [localSectionContent.sections]);

  useEffect(() => { // Initial active section
      setActiveSection(currentSectionIdForChat);
  }, [currentSectionIdForChat]);

  useEffect(() => { // Update approach/data method based on user inputs
    const placeholders = {};
    if (localSectionContent?.sections) {
      localSectionContent.sections.forEach(s => { if (s?.id) placeholders[s.id] = s.placeholder || ''; });
    }
    const isModified = (sectionId) => {
      const content = userInputs[sectionId];
      return typeof content === 'string' && content.trim() !== '' && content !== placeholders[sectionId];
    };
    // Logic to set active approach/method based on modifications
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
    setActiveSection(sectionId);
    handleSectionChange(sectionId); // Ensure hook's current section is updated
  };

  // Simplified completion status (can be refined)
  const getSectionCompletionStatus = (sectionId) => {
    if (sectionCompletionStatus[sectionId]) return sectionCompletionStatus[sectionId];
    const content = userInputs[sectionId];
    if (!content || content.trim() === '') return 'unstarted';
    const section = localSectionContent.sections.find(s => s?.id === sectionId);
    const placeholder = section?.placeholder || '';
    if (content === placeholder) return 'unstarted';
    if (content.length > (placeholder.length * 1.1) || content.length > 50) return 'complete'; // Basic length check
    return 'progress';
  };

  const scrollToSection = (sectionId) => {
    if (sectionRefs.current[sectionId]?.current) {
      sectionRefs.current[sectionId].current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Get data for the right panel based on the *local* activeSection state
  const getCurrentSectionDataForPanel = () => {
    if (!localSectionContent || !Array.isArray(localSectionContent.sections)) return null;
    const sectionData = localSectionContent.sections.find(s => s && s.id === activeSection);
    return sectionData || null;
  };

  // Handler for the feedback request (now triggered by floating button)
  const handleFeedbackRequest = async () => {
    // Prevent triggering if already loading or no active section
    if (improvingInstructions || !activeSection) return;

    console.log("Requesting feedback for section:", activeSection);
    setImprovingInstructions(true);
    try {
       // Pass the *current* state of localSectionContent
      const result = await improveBatchInstructions(localSectionContent.sections, userInputs, sectionContent);
      if (result.success && result.improvedData && result.improvedData.length > 0) {
         // Crucially update the localSectionContent state with the *new* data
        const updatedSections = updateSectionWithImprovedInstructions(localSectionContent, result.improvedData);
        setLocalSectionContent(updatedSections);

        // Update completion status if provided
        const newCompletionStatuses = {};
        result.improvedData.forEach(item => { if (item.completionStatus) newCompletionStatuses[item.id] = item.completionStatus; });
        setSectionCompletionStatus(prevStatus => ({...prevStatus, ...newCompletionStatuses }));
         console.log("Feedback received and content updated for section:", activeSection);
      } else {
        console.error("[handleFeedbackRequest] Failed:", result.message || "No improved instructions returned.");
        // Optionally show an error to the user via an alert or toast
         alert("Sorry, couldn't get feedback at this time.");
      }
    } catch (error) {
      console.error("[handleFeedbackRequest] Error:", error);
       alert("An error occurred while getting feedback.");
    } finally {
      setImprovingInstructions(false);
    }
  };

  const handleResetRequest = () => { // Reset handler
    hookResetProject();
    try { setLocalSectionContent(JSON.parse(JSON.stringify(sectionContent))); }
    catch(e) { console.error("Failed to reset local section content:", e); setLocalSectionContent({ sections: [] }); }
    setActiveSection(sectionContent?.sections?.[0]?.id || 'question');
    setActiveApproach('hypothesis');
    setActiveDataMethod('experiment');
    setSectionCompletionStatus({});
  };

  // Check if a section should be displayed based on toggles
  const shouldDisplaySection = (sectionId) => {
    if (['hypothesis', 'needsresearch', 'exploratoryresearch'].includes(sectionId)) return sectionId === activeApproach;
    if (['experiment', 'existingdata'].includes(sectionId)) return sectionId === activeDataMethod;
    return true;
  };

  const handleApproachToggle = (approach) => { setActiveApproach(approach); setActiveSectionWithManualFlag(approach); };
  const handleDataMethodToggle = (method) => { setActiveDataMethod(method); setActiveSectionWithManualFlag(method); };

  // --- Render Logic ---
  const renderSection = (section) => {
    if (!section || !section.id || !shouldDisplaySection(section.id)) return null;
    const isCurrentActive = activeSection === section.id;
    const completionStatus = getSectionCompletionStatus(section.id);
    return (
      <SectionCard
        key={section.id} section={section} isCurrentSection={isCurrentActive} completionStatus={completionStatus}
        userInputs={userInputs} handleInputChange={handleInputChange} loading={false} // Section cards don't show chat loading
        sectionRef={sectionRefs.current[section.id]} onClick={() => setActiveSectionWithManualFlag(section.id)} useLargerFonts={true}
      />
    );
  };

  const sectionDataForPanel = getCurrentSectionDataForPanel(); // Use the correct getter

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <AppHeader
        activeSection={activeSection} setActiveSection={setActiveSectionWithManualFlag} handleSectionChange={handleSectionChange}
        scrollToSection={scrollToSection} resetProject={() => setShowConfirmDialog(true)} exportProject={exportProject}
        saveProject={saveProject} loadProject={loadProject} importDocumentContent={importDocumentContent}
        setShowExamplesDialog={setShowExamplesDialog}
      />

      {/* Main Content Area */}
      <div className="flex flex-grow w-full">
        {/* Left Side Sections */}
        <div className="w-1/2 px-8 py-6 overflow-y-auto">
            {/* Sections rendering logic remains */}
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
             {/* Pass potentially updated section data */}
            <FullHeightInstructionsPanel
              currentSection={sectionDataForPanel}
              userInputs={userInputs} // Pass user inputs for context if needed by panel/fallback
              // Removed props related to the feedback button
            />
        </div>
      </div>

      {/* Footer */}
      <div className="w-full text-center text-gray-500 text-base mt-auto border-t border-gray-200 pt-6 pb-6">
        <p>Scientific Paper Planner • Designed with Love for Researchers by Konrad (@kordinglab)• 2025</p>
      </div>

      {/* --- Floating Action Buttons --- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
         {/* Floating Feedback Button */}
        <button
            onClick={handleFeedbackRequest}
            disabled={improvingInstructions || !activeSection} // Disable if loading or no section selected
            className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-colors ${
                improvingInstructions
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
            title={activeSection ? `Get AI Feedback for ${activeSection}` : "Select a section first"}
        >
            {improvingInstructions ? (
                 <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                // Lightbulb Icon
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            )}
        </button>

        {/* Chat Interface (Renders its own floating button when minimized) */}
        <ModernChatInterface
            currentSection={currentSectionIdForChat}
            currentSectionTitle={getCurrentSectionDataForPanel()?.title} // Get title dynamically
            chatMessages={chatMessages}
            currentMessage={currentMessage}
            setCurrentMessage={setCurrentMessage}
            handleSendMessage={handleSendMessage}
            loading={chatLoading} // Pass chat-specific loading
            currentSectionData={getCurrentSectionDataForPanel()} // Pass potentially updated section data
        />
      </div>


      {/* Dialogs */}
      <ConfirmDialog showConfirmDialog={showConfirmDialog} setShowConfirmDialog={setShowConfirmDialog} resetProject={handleResetRequest} />
      <ExamplesDialog showExamplesDialog={showExamplesDialog} setShowExamplesDialog={setShowExamplesDialog} loadProject={loadProject} />
    </div>
  );
};

export default VerticalPaperPlannerApp;
