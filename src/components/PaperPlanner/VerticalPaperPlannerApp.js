// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js

import React, { useEffect, useRef, useState } from 'react';
import ReactGA from 'react-ga4';
import sectionContent from '../../data/sectionContent.json';
import MainLayout from '../layout/MainLayout';
import { initializeSectionStates, setSectionMinimizedState } from '../../services/sectionStateService';
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
 * FIXED: Restored toggle functionality for research approach and data method
 * ADDED: Automatic next section opening after feedback
 * FIXED: Corrected reset functionality to properly clear content
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
    activeApproach: hookActiveApproach, // Rename to avoid confusion
    activeDataMethod: hookActiveDataMethod, // Rename to avoid confusion
    
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
    resetProject: originalResetProject,
    exportProject,
    loadProject,
    importDocumentContent,
    handleReviewPaper,
    handleSaveProject,
    saveWithFilename,
    onConfirmReset: originalOnConfirmReset,
    openExamplesDialog,
    openReviewModal,
    openPrivacyPolicy,
    
    // For current section data
    getCurrentSectionData,
    
    // Active approach/method setters from hook
    setActiveApproach: setHookActiveApproach, // Rename to avoid confusion
    setActiveDataMethod: setHookActiveDataMethod // Rename to avoid confusion
  } = usePaperPlannerHook;

  // Local state for active section (separate from chat section)
  const [activeSection, setActiveSection] = useState(currentSectionIdForChat);
  
  // Local state for active approach and data method
  const [activeApproach, setActiveApproach] = useState(hookActiveApproach || 'hypothesis');
  const [activeDataMethod, setActiveDataMethod] = useState(hookActiveDataMethod || 'experiment');
  
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
    handleSignificantEdit,
    resetImprovementState
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

  // Sync with hook values for approach/method if they change
  useEffect(() => {
    if (hookActiveApproach && hookActiveApproach !== activeApproach) {
      setActiveApproach(hookActiveApproach);
    }
  }, [hookActiveApproach]);

  useEffect(() => {
    if (hookActiveDataMethod && hookActiveDataMethod !== activeDataMethod) {
      setActiveDataMethod(hookActiveDataMethod);
    }
  }, [hookActiveDataMethod]);

  // Section handling functions
  const setActiveSectionWithManualFlag = (sectionId) => {
    setActiveSection(sectionId);
    handleSectionChange(sectionId);
    
    // Track this section change in analytics
    const sectionTitle = localSectionContent.sections.find(s => s?.id === sectionId)?.title || 'Unknown';
    trackSectionChange(sectionId, sectionTitle);
  };

  // Helper function to determine if a section should be displayed
  const shouldDisplaySection = (sectionId) => {
    // Research approach sections
    if (sectionId === 'hypothesis' || sectionId === 'needsresearch' || sectionId === 'exploratoryresearch') {
      return sectionId === activeApproach;
    }

    // Data acquisition method sections
    if (sectionId === 'experiment' || sectionId === 'existingdata' || sectionId === 'theorysimulation') {
      return sectionId === activeDataMethod;
    }

    return true; // All other sections are always displayed
  };

  // Toggle handling - FIXED to update both local state and hook state
  const handleApproachToggle = (approach) => {
    console.log(`Setting research approach to: ${approach}`);
    trackApproachToggle(approach);
    setActiveApproach(approach);
    
    // Also update the hook state if available
    if (setHookActiveApproach && typeof setHookActiveApproach === 'function') {
      setHookActiveApproach(approach);
    }
    
    // Set the active section to the new approach to show it
    setActiveSectionWithManualFlag(approach);
  };

  const handleDataMethodToggle = (method) => {
    console.log(`Setting data acquisition method to: ${method}`);
    trackDataMethodToggle(method);
    setActiveDataMethod(method);
    
    // Also update the hook state if available
    if (setHookActiveDataMethod && typeof setHookActiveDataMethod === 'function') {
      setHookActiveDataMethod(method);
    }
    
    // Set the active section to the new method to show it
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
  // MODIFIED: Now focuses the next section after feedback
  const handleMagicClick = (sectionId = null) => {
    const targetSection = sectionId || activeSection;
    
    return handleMagic(targetSection).then(success => {
      if (success) {
        // Check if this is the first time this section receives feedback
        const isFirstFeedback = !sectionsWithFeedback.includes(targetSection);
        
        if (isFirstFeedback) {
          // Add to the list of sections with feedback
          setSectionsWithFeedback(prev => [...prev, targetSection]);
          
          // Find the next section to open and focus
          const currentSectionIndex = localSectionContent.sections.findIndex(s => s.id === targetSection);
          if (currentSectionIndex !== -1 && currentSectionIndex < localSectionContent.sections.length - 1) {
            // Find the next visible section
            let nextSectionIndex = currentSectionIndex + 1;
            let nextSection = null;
            
            // Loop until we find a visible section or reach the end
            while (nextSectionIndex < localSectionContent.sections.length) {
              const candidateSection = localSectionContent.sections[nextSectionIndex];
              
              // Skip invisible sections (based on approach/method toggles)
              if (candidateSection && shouldDisplaySection(candidateSection.id)) {
                nextSection = candidateSection;
                break;
              }
              nextSectionIndex++;
            }
            
            if (nextSection) {
              console.log(`Opening next section: ${nextSection.id}`);
              
              // Ensure the next section is expanded
              setSectionMinimizedState(nextSection.id, false);
              
              // Set focus to the next section
              setTimeout(() => {
                // Set it as the active section
                setActiveSectionWithManualFlag(nextSection.id);
                
                // Scroll to it
                if (sectionRefs.current[nextSection.id]?.current) {
                  sectionRefs.current[nextSection.id].current.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                }
              }, 300); // Small delay to ensure the UI updates first
            }
          }
        }
      }
      
      return success;
    });
  };

  // Function to open the confirm reset dialog
  const openResetDialog = () => {
    setShowConfirmDialog(true);
  };

  // FIXED: Properly delegate to the original functions
  // This function just opens a confirmation dialog
  const resetProject = () => {
    openResetDialog();
  };
  
  // This is the actual reset function that runs after confirmation
  const onConfirmReset = () => {
    // Call the original resetProject from the hook - this will clear content
    originalResetProject();
    
    // Reset our local tracking state
    setSectionsWithFeedback([]);
    
    // Reset improvement state if available
    if (typeof resetImprovementState === 'function') {
      resetImprovementState();
    }
    
    // Close the dialog
    setShowConfirmDialog(false);
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
  const sectionDataForPanel = getCurrentSectionData ? getCurrentSectionData() : 
    localSectionContent?.sections?.find(s => s.id === activeSection);

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
  // FIXED: Use our onConfirmReset that properly resets state
  const modalActions = {
    closeConfirmDialog: () => setShowConfirmDialog(false),
    closeExamplesDialog: () => setShowExamplesDialog(false),
    closeReviewModal: () => setShowReviewModal(false),
    closePrivacyPolicy: () => setShowPrivacyPolicy(false),
    closeSaveDialog: () => setShowSaveDialog(false),
    onConfirmReset  // Use our modified version that resets state
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
      resetProject={resetProject} // This just opens the confirmation dialog
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
