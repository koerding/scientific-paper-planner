// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js

/**
 * Modified version with feedback tracking and edit-after-feedback detection
 */
import React, { useState, useEffect, useRef } from 'react';
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
import { getNextVisibleSectionId } from '../../utils/sectionOrderUtils';
import '../../styles/PaperPlanner.css';

/**
 * Enhanced Project Planner component
 * UPDATED: Added tracking for last feedback time per section
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
    activeApproach: hookActiveApproach,
    activeDataMethod: hookActiveDataMethod,
    
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
    resetProject: hookResetProject,
    exportProject,
    loadProject,
    importDocumentContent,
    handleReviewPaper,
    handleSaveProject,
    saveWithFilename,
    onConfirmReset: hookOnConfirmReset,
    openExamplesDialog,
    openReviewModal,
    openPrivacyPolicy,
    
    // For current section data
    getCurrentSectionData,
    
    // Active approach/method setters from hook
    setActiveApproach: setHookActiveApproach,
    setActiveDataMethod: setHookActiveDataMethod
  } = usePaperPlannerHook;

  // Local state for active section
  const [activeSection, setActiveSection] = useState(currentSectionIdForChat);
  
  // Local state for active approach and data method
  const [activeApproach, setActiveApproach] = useState(hookActiveApproach || 'hypothesis');
  const [activeDataMethod, setActiveDataMethod] = useState(hookActiveDataMethod || 'experiment');
  
  // State to track sections that have received feedback
  const [sectionsWithFeedback, setSectionsWithFeedback] = useState([]);
  
  // State to track feedback ratings for each section
  const [feedbackRatings, setFeedbackRatings] = useState({});
  
  // NEW: State to track when feedback was last received for each section
  const [lastFeedbackTimes, setLastFeedbackTimes] = useState({});
  
  // Get improvement logic from custom hook
  const improvement = useImprovementLogic(userInputs, sectionContent);
  const {
    localSectionContent,
    improvingInstructions,
    lastImprovementTime,
    significantEditsMade,
    handleMagic: originalHandleMagic,
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

  // Effect to extract ratings when localSectionContent changes
  useEffect(() => {
    if (localSectionContent?.sections) {
      // Extract sections that have received feedback
      const sectionsWithImprovement = localSectionContent.sections
        .filter(section => section?.instructions?.improvement)
        .map(section => section.id);
        
      setSectionsWithFeedback(sectionsWithImprovement);
      
      // Extract ratings from the improvement data
      const newRatings = {};
      localSectionContent.sections.forEach(section => {
        if (section?.instructions?.improvement?.rating) {
          newRatings[section.id] = section.instructions.improvement.rating;
        }
      });
      
      // Update ratings state if there are changes
      if (Object.keys(newRatings).length > 0) {
        setFeedbackRatings(prevRatings => ({
          ...prevRatings,
          ...newRatings
        }));
      }
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

  // Check if a section contains placeholder content or hasn't been edited
  const isPlaceholderContent = (sectionId) => {
    if (!sectionId) return true;
    
    const content = userInputs[sectionId] || '';
    const section = sectionContent.sections.find(s => s.id === sectionId);
    const placeholder = section?.placeholder || '';
    
    // Content must be different from placeholder AND not empty
    return content === placeholder || content.trim() === '';
  };

  // Modified wrapper for handleMagic that:
  // 1. Only processes sections that have non-placeholder content
  // 2. Handles ratings extraction
  // 3. Updates tracking 
  // 4. Records last feedback time
  // 5. Opens the next section
  const handleMagicClick = (sectionId = null) => {
    const targetSection = sectionId || activeSection;
    
    // Skip if the section only contains placeholder content
    if (isPlaceholderContent(targetSection)) {
      console.log(`Skipping feedback for ${targetSection} - contains only placeholder content`);
      alert("Please add some content to this section before requesting feedback.");
      return Promise.resolve(false);
    }
    
    return originalHandleMagic(targetSection).then(success => {
      if (success) {
        // Record the current time as last feedback time for this section
        const now = Date.now();
        setLastFeedbackTimes(prev => ({
          ...prev,
          [targetSection]: now
        }));
        
        // Check if this is the first time this section receives feedback
        const isFirstFeedback = !sectionsWithFeedback.includes(targetSection);
        
        // Extract the rating if available
        const sectionData = localSectionContent.sections.find(s => s.id === targetSection);
        const rating = sectionData?.instructions?.improvement?.rating;
        
        // Update our ratings state if a rating was provided
        if (rating) {
          setFeedbackRatings(prev => ({
            ...prev,
            [targetSection]: rating
          }));
        }
        
        if (isFirstFeedback) {
          // Add to the list of sections with feedback
          setSectionsWithFeedback(prev => [...prev, targetSection]);
          
          // Find the next section using our utility function
          const nextSectionId = getNextVisibleSectionId(targetSection, activeApproach, activeDataMethod);
          
          if (nextSectionId) {
            console.log(`Opening next section: ${nextSectionId}`);
            
            // Ensure the next section is expanded
            setSectionMinimizedState(nextSectionId, false);
            
            // Set focus to the next section
            setTimeout(() => {
              // Set it as the active section
              setActiveSectionWithManualFlag(nextSectionId);
              
              // Scroll to it
              if (sectionRefs.current[nextSectionId]?.current) {
                sectionRefs.current[nextSectionId].current.scrollIntoView({ 
                  behavior: 'smooth',
                  block: 'start'
                });
              }
            }, 300); // Small delay to ensure the UI updates first
          }
        }
      }
      
      return success;
    });
  };

  // FIXED: Simply use the hook's reset functions directly
  // This maintains the original reset functionality while adding our section-open feature
  const resetProject = () => {
    // Use the hook's function to open the confirm dialog
    hookResetProject();
  };

  // Custom onConfirmReset that extends the hook's reset function
  const onConfirmReset = () => {
    // Call the hook's original confirm reset function
    // This will handle all the proper content resetting
    hookOnConfirmReset();
    
    // Reset our local state
    setSectionsWithFeedback([]);
    setFeedbackRatings({});
    setLastFeedbackTimes({});
    
    // Reset improvement state if available
    if (typeof resetImprovementState === 'function') {
      resetImprovementState();
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
  
  // FIXED: Use custom onConfirmReset that calls the hook's version
  // but also handles our local state
  const modalActions = {
    closeConfirmDialog: () => setShowConfirmDialog(false),
    closeExamplesDialog: () => setShowExamplesDialog(false),
    closeReviewModal: () => setShowReviewModal(false),
    closePrivacyPolicy: () => setShowPrivacyPolicy(false),
    closeSaveDialog: () => setShowSaveDialog(false),
    onConfirmReset  // Use our wrapper that handles both hook reset and local state
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
    feedbackRatings,
    lastFeedbackTimes, // NEW: Pass last feedback times
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
      resetProject={resetProject} // Use the hook's function to open dialog
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
