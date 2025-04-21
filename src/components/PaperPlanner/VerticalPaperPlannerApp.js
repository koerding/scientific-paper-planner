// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js

import React, { useEffect, useRef, useState } from 'react';
import ReactGA from 'react-ga4';
import sectionContent from '../../data/sectionContent.json';
import MainLayout from '../layout/MainLayout';
import { initializeSectionStates } from '../../services/sectionStateService';
import { useImprovementLogic } from '../../hooks/useImprovementLogic';
import {
  trackSectionChange,
  trackApproachToggle,
  trackDataMethodToggle,
  trackExport,
  trackSave
} from '../../utils/analyticsUtils';
import '../../styles/PaperPlanner.css';

/**
 * Enhanced Project Planner with improved structure
 * Now uses a more modular, component-based architecture
 * UPDATED: Added tracking for sections with feedback
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
    
    // Modal action setters
    setShowConfirmDialog,
    setShowExamplesDialog,
    setShowReviewModal,
    setShowPrivacyPolicy, 
    setShowSaveDialog,
    
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
    
    // For current section data
    getCurrentSectionData
  } = usePaperPlannerHook;

  // Local state for active section (separate from chat section)
  const [activeSection, setActiveSection] = useState(currentSectionIdForChat);
  
  // New state to track sections that have received feedback
  const [sectionsWithFeedback, setSectionsWithFeedback] = useState([]);
  
  // Get improvement logic from custom hook
  const improvement = useImprovementLogic(userInputs, sectionContent);
  const {
    localSectionContent,
    improvingInstructions,
    lastImprovementTime,
    significantEditsMade,
    handleMagic,
    handleEdit,
    handleSignificantEdit
  } = improvement;
  
  // Refs
  const sectionRefs = useRef({});
  const splashManagerRef = useRef(null);

  // Initialize section states as minimized when the component first mounts
  useEffect(() => {
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

  // Effect to update sectionsWithFeedback when localSectionContent changes
  useEffect(() => {
    if (localSectionContent?.sections) {
      const sectionsWithImprovement = localSectionContent.sections
        .filter(section => section?.instructions?.improvement)
        .map(section => section.id);
        
      setSectionsWithFeedback(sectionsWithImprovement);
    }
  }, [localSectionContent]);

  // Section handling functions
  const setActiveSectionWithManualFlag = (sectionId) => {
    setActiveSection(sectionId);
    handleSectionChange(sectionId);
    
    // Track this section change in analytics
    const sectionTitle = localSectionContent.sections.find(s => s?.id === sectionId)?.title || 'Unknown';
    trackSectionChange(sectionId, sectionTitle);
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

  // Wrapper for handleMagic that passes activeSection and updates tracking
  const handleMagicClick = (sectionId = null) => {
    const targetSection = sectionId || activeSection;
    
    return handleMagic(targetSection).then(success => {
      if (success && !sectionsWithFeedback.includes(targetSection)) {
        // Add to the list of sections with feedback
        setSectionsWithFeedback(prev => [...prev, targetSection]);
      }
      return success;
    });
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
  
  // Use the direct setter functions from the hook
  const modalActions = {
    closeConfirmDialog: () => setShowConfirmDialog(false),
    closeExamplesDialog: () => setShowExamplesDialog(false),
    closeReviewModal: () => setShowReviewModal(false),
    closePrivacyPolicy: () => setShowPrivacyPolicy(false),
    closeSaveDialog: () => setShowSaveDialog(false),
    onConfirmReset
  };

  // Prepare props for ContentArea component
  const contentAreaProps = {
    activeSection,
    userInputs,
    handleInputChange,
    localSectionContent,
    isAnyAiLoading,
    activeApproach,
    activeDataMethod,
    setActiveSectionWithManualFlag,
    handleApproachToggle,
    handleDataMethodToggle,
    sectionRefs,
    handleEdit,
    handleSignificantEdit,
    sectionsWithFeedback,
    sectionDataForPanel,
    handleMagic: handleMagicClick
  };
  
  // Prepare props for InteractionElements component
  const interactionProps = {
    currentSection: currentSectionIdForChat,
    currentSectionTitle: sectionDataForPanel?.title,
    chatMessages,
    currentMessage,
    setCurrentMessage,
    handleSendMessage,
    loading: isAnyAiLoading,
    currentSectionData: sectionDataForPanel,
    handleMagicClick,
    userInputs,
    lastImprovementTime,
    significantEditsMade
  };

  // Render the main layout with all prepared props
  return (
    <MainLayout
      splashManagerRef={splashManagerRef}
      resetProject={resetProject}
      exportProject={handleExportRequest}
      saveProject={handleSaveRequest}
      loadProject={loadProject}
      importDocumentContent={importDocumentContent}
      openReviewModal={openReviewModal}
      openExamplesDialog={openExamplesDialog}
      showHelpSplash={handleShowHelpSplash}
      contentAreaProps={contentAreaProps}
      interactionProps={interactionProps}
      modalState={modalState}
      modalActions={modalActions}
      handleReviewPaper={handleReviewPaper}
      saveWithFilename={saveWithFilename}
      isAnyAiLoading={isAnyAiLoading}
    />
  );
};

export default VerticalPaperPlannerApp;
