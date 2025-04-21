// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js

import React, { useEffect, useRef, useState } from 'react';
import ReactGA from 'react-ga4';
import sectionContent from '../../data/sectionContent.json';
import LeftPanel from '../layout/LeftPanel';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';
import ModernChatInterface from '../chat/ModernChatInterface';
import FloatingMagicButton from '../buttons/FloatingMagicButton';
import ImprovementReminderToast from '../toasts/ImprovementReminderToast';
import AppHeader from '../layout/AppHeader';
import ModalManager from '../modals/ModalManager';
import { ForwardedSplashScreenManager } from '../modals/SplashScreenManager';
import { initializeSectionStates } from '../../services/sectionStateService';
import {
  improveBatchInstructions,
  updateSectionWithImprovedInstructions
} from '../../services/instructionImprovementService';
import {
  trackSectionChange,
  trackInstructionImprovement,
  trackApproachToggle,
  trackDataMethodToggle,
  trackExport,
  trackSave,
  trackEvent
} from '../../utils/analyticsUtils';
import '../../styles/PaperPlanner.css';

/**
 * Enhanced Project Planner with improved structure
 * Now uses specialized components for different areas
 */
const VerticalPaperPlannerApp = ({ usePaperPlannerHook }) => {
  // Destructure the hook data
  const {
    // State
    userInputs,
    chatMessages,
    currentSection: currentSectionIdForChat,
    currentMessage,
    loading: hookLoading,
    activeApproach,
    activeDataMethod,
    
    // Modal state
    showConfirmDialog,
    showExamplesDialog,
    showReviewModal,
    showPrivacyPolicy,
    showSaveDialog,
    reviewData,
    
    // Methods
    setCurrentMessage,
    handleSectionChange,
    handleInputChange,
    handleSendMessage,
    resetProject,
    exportProject,
    loadProject,
    importDocumentContent,
    handleReviewPaper,
    handleSaveProject,
    saveWithFilename,
    onConfirmReset,
    openExamplesDialog,
    openReviewModal,
    openPrivacyPolicy,
    
    // Modal actions for closing
    setShowConfirmDialog: closeConfirmDialog,
    setShowExamplesDialog: closeExamplesDialog,
    
    // For current section data
    getCurrentSectionData
  } = usePaperPlannerHook;

  // Local state
  const [activeSection, setActiveSection] = useState(currentSectionIdForChat);
  const [improvingInstructions, setImprovingInstructions] = useState(false);
  
  // Improvement reminder state
  const [lastImprovementTime, setLastImprovementTime] = useState(Date.now());
  const [editEvents, setEditEvents] = useState([]);
  const [significantEditsMade, setSignificantEditsMade] = useState(false);
  
  // Local section content that can be modified by the AI
  const [localSectionContent, setLocalSectionContent] = useState(() => {
    try {
      return JSON.parse(JSON.stringify(sectionContent));
    } catch (e) {
      console.error("Failed to parse initial sectionContent", e);
      return { sections: [] };
    }
  });
  
  // Refs
  const sectionRefs = useRef({});
  const splashManagerRef = useRef(null);

  // Initialize section states as minimized when the component first mounts
  useEffect(() => {
    // Initialize section states as minimized for new projects
    initializeSectionStates(true);
  }, []);

  // Make splash screen ref globally available
  useEffect(() => {
    window.splashManagerRef = splashManagerRef;
  }, []);

  // Effect to map refs
  useEffect(() => {
    if (localSectionContent?.sections) {
      localSectionContent.sections.forEach(section => {
        if (section?.id) {
          sectionRefs.current[section.id] = sectionRefs.current[section.id] || React.createRef();
        }
      });
    }
  }, [localSectionContent.sections]);

  // Effect for initial active section setting
  useEffect(() => {
    setActiveSection(currentSectionIdForChat);
  }, [currentSectionIdForChat]);

  // Track initial pageview
  useEffect(() => {
    ReactGA.send({ 
      hitType: "pageview", 
      page: `/section/${activeSection}` 
    });
  }, []);

  // Section handling functions
  const setActiveSectionWithManualFlag = (sectionId) => {
    setActiveSection(sectionId);
    handleSectionChange(sectionId);
    
    // Track this section change in analytics
    const sectionTitle = localSectionContent.sections.find(s => s?.id === sectionId)?.title || 'Unknown';
    trackSectionChange(sectionId, sectionTitle);
  };

  // Edit tracking
  const handleEdit = (sectionId, timestamp) => {
    setEditEvents(prev => [...prev, { sectionId, timestamp, type: 'edit' }]);
  };

  const handleSignificantEdit = (sectionId, timestamp) => {
    setEditEvents(prev => [...prev, { sectionId, timestamp, type: 'significant' }]);
    setSignificantEditsMade(true);
  };

  // Handle magic (improving instructions)
  const handleMagic = async () => {
    if (isAnyAiLoading) return;
    
    trackInstructionImprovement(activeSection);
    setLastImprovementTime(Date.now());
    setSignificantEditsMade(false);
    setEditEvents([]);
    
    setImprovingInstructions(true);
    try {
      const result = await improveBatchInstructions(
        localSectionContent.sections,
        userInputs,
        sectionContent
      );

      if (result.success && result.improvedData && result.improvedData.length > 0) {
        // Update the instruction content
        const updatedSections = updateSectionWithImprovedInstructions(
          localSectionContent,
          result.improvedData
        );
        setLocalSectionContent(updatedSections);
      }
    } catch (error) {
      console.error("[handleMagic] Error during improvement process:", error);
    } finally {
      setImprovingInstructions(false);
    }
  };

  // Show splash screen
  const handleShowHelpSplash = () => {
    if (splashManagerRef.current) {
      console.log("Showing splash screen via ref");
      splashManagerRef.current.showSplash();
    } else {
      // Fallback method
      console.log("Showing splash screen via localStorage fallback");
      localStorage.removeItem('hideWelcomeSplash');
      window.location.reload();
    }
  };

  // Toggle handling
  const handleApproachToggle = (approach) => {
    trackApproachToggle(approach);
    setActiveSectionWithManualFlag(approach);
  };

  const handleDataMethodToggle = (method) => {
    trackDataMethodToggle(method);
    setActiveSectionWithManualFlag(method);
  };

  // Export and save tracking
  const handleExportRequest = () => {
    trackExport('any');
    exportProject();
  };

  const handleSaveRequest = () => {
    trackSave();
    handleSaveProject();
  };

  // Combined loading state
  const isAnyAiLoading = hookLoading || improvingInstructions;

  // Get current section data for the instructions panel
  const sectionDataForPanel = getCurrentSectionData();

  // Modal state and action objects for ModalManager
  const modalState = {
    showConfirmDialog,
    showExamplesDialog,
    showReviewModal,
    showPrivacyPolicy,
    showSaveDialog,
    reviewData
  };
  
  const modalActions = {
    closeConfirmDialog,
    closeExamplesDialog,
    closeReviewModal: () => setShowReviewModal(false),
    closePrivacyPolicy: () => setShowPrivacyPolicy(false),
    closeSaveDialog: () => setShowSaveDialog(false),
    onConfirmReset
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Add the splash screen manager */}
      <ForwardedSplashScreenManager ref={splashManagerRef} />
      
      <div className="w-full pb-6">
        {/* Header */}
        <AppHeader
          resetProject={resetProject}
          exportProject={handleExportRequest}
          saveProject={handleSaveRequest}
          loadProject={loadProject}
          importDocumentContent={importDocumentContent}
          onOpenReviewModal={openReviewModal}
          setShowExamplesDialog={openExamplesDialog}
          showHelpSplash={handleShowHelpSplash}
          loading={isAnyAiLoading}
        />

        {/* Main content area */}
        <div style={{ paddingTop: '40px' }}>
          <div className="flex">
            {/* Left panel with sections */}
            <LeftPanel 
              activeSection={activeSection}
              userInputs={userInputs}
              handleInputChange={handleInputChange}
              localSectionContent={localSectionContent}
              isAnyAiLoading={isAnyAiLoading}
              activeApproach={activeApproach}
              activeDataMethod={activeDataMethod}
              setActiveSectionWithManualFlag={setActiveSectionWithManualFlag}
              handleApproachToggle={handleApproachToggle}
              handleDataMethodToggle={handleDataMethodToggle}
              sectionRefs={sectionRefs}
              handleEdit={handleEdit}
              handleSignificantEdit={handleSignificantEdit}
            />
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm mt-6 border-t border-gray-200 pt-3 pb-3 bg-white">
            <p>
              Scientific Project Planner • Designed with Love for Researchers by Konrad @Kordinglab • {new Date().getFullYear()}
              <span className="mx-2">•</span>
              <button 
                onClick={openPrivacyPolicy}
                className="text-blue-500 hover:text-blue-700 underline"
              >
                Privacy Policy
              </button>
            </p>
          </div>
        </div>

        {/* Right panel */}
        <FullHeightInstructionsPanel
          currentSection={sectionDataForPanel}
          improveInstructions={handleMagic}
          loading={isAnyAiLoading}
        />

        {/* Interactive UI elements */}
        <ImprovementReminderToast
          userInputs={userInputs}
          lastImprovementTime={lastImprovementTime}
          significantEditsMade={significantEditsMade}
          handleMagicClick={handleMagic}
        />

        <FloatingMagicButton
          handleMagicClick={handleMagic}
          loading={isAnyAiLoading}
        />

        <ModernChatInterface
          currentSection={currentSectionIdForChat}
          currentSectionTitle={sectionDataForPanel?.title}
          chatMessages={chatMessages}
          currentMessage={currentMessage}
          setCurrentMessage={setCurrentMessage}
          handleSendMessage={handleSendMessage}
          loading={isAnyAiLoading}
          currentSectionData={sectionDataForPanel}
        />

        {/* Centralized modal management */}
        <ModalManager 
          modals={modalState}
          actions={modalActions}
          handleReviewPaper={handleReviewPaper}
          loadProject={loadProject}
          saveWithFilename={saveWithFilename}
        />
      </div>
    </div>
  );
};

export default VerticalPaperPlannerApp;
