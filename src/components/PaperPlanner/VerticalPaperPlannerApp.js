// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js
import React, { useState, useEffect, useRef } from 'react';
import sectionContent from '../../data/sectionContent.json';
import ConfirmDialog from './ConfirmDialog';
import ExamplesDialog from './ExamplesDialog';
import AppHeader from '../layout/AppHeader';
import SectionCard from '../sections/SectionCard';
import ResearchApproachToggle from '../toggles/ResearchApproachToggle'; // Keeping original toggles
import DataAcquisitionToggle from '../toggles/DataAcquisitionToggle'; // Keeping original toggles
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';
import ModernChatInterface from '../chat/ModernChatInterface';
import {
  improveBatchInstructions,
  updateSectionWithImprovedInstructions
} from '../../services/instructionImprovementService';
import '../../styles/PaperPlanner.css'; // Ensure CSS is imported

/**
 * Enhanced Paper Planner with research approach and data acquisition toggles
 * REVERTED: Removed onboarding highlight/tooltip feature
 * KEPT: Layout fixes, footer update, panel styling, button rename/highlight
 */
const VerticalPaperPlannerApp = ({ usePaperPlannerHook }) => {
  // Hook destructuring
  const {
    currentSection: currentSectionIdForChat,
    currentSectionData,
    userInputs,
    chatMessages,
    currentMessage,
    loading: chatLoading,
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
      try {
          return JSON.parse(JSON.stringify(sectionContent));
      } catch (e) {
          console.error("Failed to parse initial sectionContent", e);
          return { sections: [] };
      }
  });
  const [improvingInstructions, setImprovingInstructions] = useState(false);

  // Removed Onboarding State

  // --- Effects --- (Removed onboarding effect)
  useEffect(() => { // Map refs
    if (localSectionContent?.sections) {
        localSectionContent.sections.forEach(section => {
            if (section?.id) {
               sectionRefs.current[section.id] = sectionRefs.current[section.id] || React.createRef();
            }
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
    handleSectionChange(sectionId);
  };

  const getSectionCompletionStatus = (sectionId) => {
    if (sectionCompletionStatus[sectionId]) return sectionCompletionStatus[sectionId];
    const content = userInputs[sectionId];
    if (!content || content.trim() === '') return 'unstarted';
    const section = localSectionContent.sections.find(s => s?.id === sectionId);
    const placeholder = section?.placeholder || '';
    if (content === placeholder) return 'unstarted';
    if (content !== placeholder && content.trim().length > 0) return 'progress'; // Simplified back
    return 'unstarted';
  };

  const scrollToSection = (sectionId) => {
    if (sectionRefs.current[sectionId]?.current) {
      sectionRefs.current[sectionId].current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getCurrentSectionData = () => { // Get data for right panel
    if (!localSectionContent || !Array.isArray(localSectionContent.sections)) return null;
    // Finding based on activeSection state, which seems correct.
    const sectionData = localSectionContent.sections.find(s => s && s.id === activeSection);
    // if (!sectionData) {
    //    console.warn(`[VerticalPaperPlannerApp] Could not find section data for activeSection: ${activeSection}`);
    // } else if (!sectionData.instructions || !sectionData.instructions.text) {
    //    console.warn(`[VerticalPaperPlannerApp] Found section data for ${activeSection}, but instructions/text is missing.`);
    // }
    return sectionData || null;
  };

  const handleFeedbackRequest = async () => { // Renamed from handleMagic, triggers feedback
    setImprovingInstructions(true);
    try {
      const result = await improveBatchInstructions(localSectionContent.sections, userInputs, sectionContent);
      if (result.success && result.improvedData && result.improvedData.length > 0) {
        const updatedSections = updateSectionWithImprovedInstructions(localSectionContent, result.improvedData);
        setLocalSectionContent(updatedSections); // This might be where instruction data gets lost
        const newCompletionStatuses = {};
        result.improvedData.forEach(item => { if (item.completionStatus) newCompletionStatuses[item.id] = item.completionStatus; });
        setSectionCompletionStatus(prevStatus => ({...prevStatus, ...newCompletionStatuses }));
      } else { console.error("[handleFeedbackRequest] Failed:", result.message || "No improved instructions."); }
    } catch (error) { console.error("[handleFeedbackRequest] Error:", error); }
    finally { setImprovingInstructions(false); }
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

  const shouldDisplaySection = (sectionId) => { // Check toggles
    if (['hypothesis', 'needsresearch', 'exploratoryresearch'].includes(sectionId)) return sectionId === activeApproach;
    if (['experiment', 'existingdata'].includes(sectionId)) return sectionId === activeDataMethod;
    return true;
  };

  const handleApproachToggle = (approach) => { setActiveApproach(approach); setActiveSectionWithManualFlag(approach); };
  const handleDataMethodToggle = (method) => { setActiveDataMethod(method); setActiveSectionWithManualFlag(method); };

  // --- Render Logic ---
  const renderSection = (section) => {
    if (!section || !section.id || !shouldDisplaySection(section.id)) return null; // Added display check
    const isCurrentActive = activeSection === section.id;
    const completionStatus = getSectionCompletionStatus(section.id);
    return (
      <SectionCard
        key={section.id} section={section} isCurrentSection={isCurrentActive} completionStatus={completionStatus}
        userInputs={userInputs} handleInputChange={handleInputChange} loading={chatLoading && currentSectionIdForChat === section.id}
        sectionRef={sectionRefs.current[section.id]} onClick={() => setActiveSectionWithManualFlag(section.id)} useLargerFonts={true}
      />
    );
  };

  const sectionDataForPanel = getCurrentSectionData(); // Get data for the panel

  return (
    // Corrected Flexbox layout from previous successful turn
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      {/* Header - Removed onboardingStep prop */}
      <AppHeader
        activeSection={activeSection} setActiveSection={setActiveSectionWithManualFlag} handleSectionChange={handleSectionChange}
        scrollToSection={scrollToSection} resetProject={() => setShowConfirmDialog(true)} exportProject={exportProject}
        saveProject={saveProject} loadProject={loadProject} importDocumentContent={importDocumentContent}
        setShowExamplesDialog={setShowExamplesDialog}
        // onboardingStep removed
      />

      {/* Main Content Area */}
      <div className="flex flex-grow w-full">
        {/* Left Side Sections */}
        <div className="w-1/2 px-8 py-6 overflow-y-auto">
            {/* Using original Toggle components */}
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
        {/* Correct padding from previous successful turn */}
        <div className="w-1/2 py-6 pl-4 pr-8 overflow-hidden">
             {/* Removed onboardingStep prop */}
            <FullHeightInstructionsPanel
              currentSection={sectionDataForPanel}
              improveInstructions={handleFeedbackRequest} // Pass the correct handler
              loading={improvingInstructions}
              userInputs={userInputs}
              // onboardingStep removed
            />
        </div>
      </div>

      {/* Footer - Kept updated text */}
      <div className="w-full text-center text-gray-500 text-base mt-auto border-t border-gray-200 pt-6 pb-6">
        <p>Scientific Paper Planner • Designed with Love for Researchers by Konrad (@kordinglab)• 2025</p>
      </div>

      {/* Chat Interface - Removed onboardingStep prop */}
      <ModernChatInterface
        currentSection={currentSectionIdForChat} currentSectionTitle={sectionDataForPanel?.title} chatMessages={chatMessages}
        currentMessage={currentMessage} setCurrentMessage={setCurrentMessage} handleSendMessage={handleSendMessage}
        loading={chatLoading} currentSectionData={sectionDataForPanel}
        // onboardingStep removed
      />

      {/* Dialogs */}
      <ConfirmDialog showConfirmDialog={showConfirmDialog} setShowConfirmDialog={setShowConfirmDialog} resetProject={handleResetRequest} />
      <ExamplesDialog showExamplesDialog={showExamplesDialog} setShowExamplesDialog={setShowExamplesDialog} loadProject={loadProject} />
    </div>
  );
};

export default VerticalPaperPlannerApp;
