// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js
import React, { useState, useEffect, useRef } from 'react';
import sectionContent from '../../data/sectionContent.json';
import ConfirmDialog from './ConfirmDialog';
import ExamplesDialog from './ExamplesDialog';
import AppHeader from '../layout/AppHeader';
import SectionCard from '../sections/SectionCard';
import ResearchApproachToggle from '../toggles/ResearchApproachToggle';
import DataAcquisitionToggle from '../toggles/DataAcquisitionToggle';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel'; // Component itself will be fixed
import ModernChatInterface from '../chat/ModernChatInterface';
import {
  improveBatchInstructions,
  updateSectionWithImprovedInstructions
} from '../../services/instructionImprovementService';
import '../../styles/PaperPlanner.css'; // Ensure CSS is imported

/**
 * Enhanced Paper Planner
 * UPDATED: Reverted to position:fixed for right panel, adjusted layout.
 */
const VerticalPaperPlannerApp = ({ usePaperPlannerHook }) => {
  // Hook destructuring (remains the same)
  const {
    currentSection: currentSectionIdForChat,
    userInputs, chatMessages, currentMessage, loading: chatLoading,
    showConfirmDialog, showExamplesDialog, setCurrentMessage, setShowConfirmDialog,
    setShowExamplesDialog, handleSectionChange, handleInputChange, handleSendMessage,
    resetProject: hookResetProject, exportProject, saveProject, loadProject, importDocumentContent
  } = usePaperPlannerHook;

  // Component State (remains the same)
  const [activeSection, setActiveSection] = useState(currentSectionIdForChat);
  const [activeApproach, setActiveApproach] = useState('hypothesis');
  const [activeDataMethod, setActiveDataMethod] = useState('experiment');
  const [sectionCompletionStatus, setSectionCompletionStatus] = useState({});
  const sectionRefs = useRef({});
  const [localSectionContent, setLocalSectionContent] = useState(() => {
      try { return JSON.parse(JSON.stringify(sectionContent)); }
      catch (e) { console.error("Failed to parse initial sectionContent", e); return { sections: [] }; }
  });
  const [improvingInstructions, setImprovingInstructions] = useState(false);

  // --- Effects --- (remain the same)
   useEffect(() => { /* Map refs */ }, [localSectionContent.sections]);
   useEffect(() => { /* Initial active section */ }, [currentSectionIdForChat]);
   useEffect(() => { /* Update approach/data method */ }, [userInputs, localSectionContent.sections]);

  // --- Handlers --- (remain the same)
  const setActiveSectionWithManualFlag = (sectionId) => { /* ... */ };
  const getSectionCompletionStatus = (sectionId) => { /* ... */ };
  const scrollToSection = (sectionId) => { /* ... */ };
  const handleFeedbackRequest = async () => { /* ... includes console logs */ };
  const handleResetRequest = () => { /* ... */ };
  const shouldDisplaySection = (sectionId) => { /* ... */ };
  const handleApproachToggle = (approach) => { /* ... */ };
  const handleDataMethodToggle = (method) => { /* ... */ };

  // Get data for the panel based on the *local* activeSection state
  // This function becomes more critical now, ensuring panel gets data even if it's rendered "outside" the flow
  const getCurrentSectionDataForPanel = () => {
    if (!localSectionContent || !Array.isArray(localSectionContent.sections)) return null;
    const sectionData = localSectionContent.sections.find(s => s && s.id === activeSection);
    // Add console log if section data isn't found, helps debug panel issues
    if (!sectionData) {
        console.warn(`[getCurrentSectionDataForPanel] No section data found for activeSection: ${activeSection}`);
    }
    return sectionData || null;
  };


  // --- Render Logic ---
  const renderSection = (section) => {
    if (!section || !section.id || !shouldDisplaySection(section.id)) return null;
    const isCurrentActive = activeSection === section.id;
    const completionStatus = getSectionCompletionStatus(section.id);
    return (
      <SectionCard
        key={section.id} section={section} isCurrentSection={isCurrentActive} completionStatus={completionStatus}
        userInputs={userInputs} handleInputChange={handleInputChange} loading={false}
        sectionRef={sectionRefs.current[section.id]} onClick={() => setActiveSectionWithManualFlag(section.id)} useLargerFonts={true}
      />
    );
  };

  const sectionDataForPanel = getCurrentSectionDataForPanel();

  // Define widths - giving left side slightly more space
  const leftColumnWidth = "w-7/12"; // ~58%
  const rightPanelWidth = "w-5/12"; // ~42%

  return (
    // Main container allows scrolling
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <AppHeader
        activeSection={activeSection} setActiveSection={setActiveSectionWithManualFlag} handleSectionChange={handleSectionChange}
        scrollToSection={scrollToSection} resetProject={() => setShowConfirmDialog(true)} exportProject={exportProject}
        saveProject={saveProject} loadProject={loadProject} importDocumentContent={importDocumentContent}
        setShowExamplesDialog={setShowExamplesDialog}
      />

      {/* Main Content Wrapper - limits width and provides space for fixed panel */}
      {/* Added padding-right equivalent to the panel width */}
      <div className={`max-w-screen-2xl mx-auto pr-[41.666667%]`}> {/* pr-[w-5/12] */}
          {/* Left Column - Main scrollable content */}
          <div className={`px-8 py-6`}> {/* Removed width class, relies on parent's padding */}
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


      {/* Right Panel - Rendered outside main flow, uses fixed positioning via its own component */}
      <FullHeightInstructionsPanel
            currentSection={sectionDataForPanel}
            userInputs={userInputs}
            // Pass width class for consistency
            widthClass={rightPanelWidth}
            // Define top offset based on header height (adjust as needed)
            topOffset="5rem" // Approx header height + gap
       />


      {/* Footer - Now placed simply at the end, will be below scrollable content */}
       {/* Might need margin-right adjustment if window is very narrow */}
      <div className={`w-full text-center text-gray-500 text-base mt-12 border-t border-gray-200 pt-6 pb-6 pr-[41.666667%]`}> {/* Add padding-right */}
        <p>Scientific Paper Planner • Designed with Love for Researchers by Konrad (@kordinglab)• 2025</p>
      </div>

      {/* --- Floating Action Buttons --- */}
      {/* Rendered independently at bottom right */}
      <button
          onClick={handleFeedbackRequest}
          disabled={improvingInstructions}
          className={`fixed bottom-24 right-6 z-[51] w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ease-in-out ${
              improvingInstructions ? 'bg-gray-400 cursor-not-allowed scale-95' : 'bg-purple-600 text-white hover:bg-purple-700 hover:scale-105'
          }`}
          title="Get AI Feedback for all sections with content"
      >
          {improvingInstructions ? ( <svg className="animate-spin h-8 w-8 text-white" ... /> ) : ( <svg className="h-8 w-8 text-white" ... /> )}
      </button>

      {/* Chat Interface */}
      <ModernChatInterface
          currentSection={currentSectionIdForChat} currentSectionTitle={sectionDataForPanel?.title} chatMessages={chatMessages}
          currentMessage={currentMessage} setCurrentMessage={setCurrentMessage} handleSendMessage={handleSendMessage}
          loading={chatLoading} currentSectionData={sectionDataForPanel}
      />

      {/* Dialogs */}
      <ConfirmDialog showConfirmDialog={showConfirmDialog} setShowConfirmDialog={setShowConfirmDialog} resetProject={handleResetRequest} />
      <ExamplesDialog showExamplesDialog={showExamplesDialog} setShowExamplesDialog={setShowExamplesDialog} loadProject={loadProject} />
    </div>
  );
};

export default VerticalPaperPlannerApp;
