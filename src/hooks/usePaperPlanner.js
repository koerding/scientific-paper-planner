// FILE: src/hooks/usePaperPlanner.js

/**
 * Main hook that combines all specialized hooks into a unified API
 * UPDATED: Now uses the resetService for consistent reset functionality
 * UPDATED: Sets the correct research approach and data method based on document import
 */
import { useState, useEffect } from 'react';
import { useProjectState } from './useProjectState';
import { useChat } from './useChat';
import { useProjectActions } from './useProjectActions';
import { useDocumentImport } from './useDocumentImport';
import { useModalState } from './useModalState';
import { reviewScientificPaper } from '../services/paperReviewService';
import { resetAllState } from '../services/resetService';
import sectionContent from '../data/sectionContent.json';

const usePaperPlanner = () => {
  // Research approach and data method state
  const [activeApproach, setActiveApproach] = useState('hypothesis');
  const [activeDataMethod, setActiveDataMethod] = useState('experiment');
  const [sectionCompletionStatus, setSectionCompletionStatus] = useState({});
  
  // Get state from specialized hooks
  const projectState = useProjectState();
  const {
    userInputs, 
    setUserInputs,
    chatMessages, 
    setChatMessages,
    currentSection,
    currentIndex,
    handleInputChange,
    handleSectionChange: baseHandleSectionChange,
    resetState,
    goToNextSection,
    goToPreviousSection
  } = projectState;
  
  // Setup the chat hook
  const chat = useChat(userInputs, chatMessages, setChatMessages, currentSection, sectionContent);
  const {
    currentMessage,
    setCurrentMessage,
    loading: chatLoading,
    handleSendMessage
  } = chat;
  
  // Setup project actions with reset functionality
  const projectActions = useProjectActions(
    userInputs, 
    setUserInputs, 
    chatMessages, 
    setChatMessages, 
    resetState,
    sectionContent
  );
  const {
    actionLoading,
    resetProject: resetProjectAction,
    resetAllProjectState, // Get the comprehensive reset function
    handleExportProject: exportProject,
    saveProject,
    loadProject: loadProjectAction
  } = projectActions;
  
  // Setup document import with the comprehensive reset function
  const documentImport = useDocumentImport(
    loadProjectAction, 
    sectionContent,
    resetAllProjectState // Pass the reset function to document import
  );
  const {
    importLoading,
    handleDocumentImport: importDocumentContent
  } = documentImport;
  
  // Setup modal state
  const modalState = useModalState();
  const {
    // Modal visibility state
    showConfirmDialog,
    showExamplesDialog,
    showReviewModal,
    showPrivacyPolicy,
    showSaveDialog,
    
    // Direct setter functions for consistent API
    setShowConfirmDialog,
    setShowExamplesDialog,
    setShowReviewModal,
    setShowPrivacyPolicy,
    setShowSaveDialog,
    
    // Review state
    reviewData,
    setReviewData,
    reviewLoading,
    setReviewLoading,
    
    // Modal open/close methods
    openConfirmDialog,
    closeConfirmDialog,
    openExamplesDialog,
    closeExamplesDialog,
    openReviewModal,
    closeReviewModal,
    openPrivacyPolicy,
    closePrivacyPolicy,
    openSaveDialog,
    closeSaveDialog
  } = modalState;
  
  // Combined loading state
  const loading = chatLoading || actionLoading || importLoading || reviewLoading;
  
  // Get current section data
  const getCurrentSectionData = () => {
    return sectionContent?.sections?.find(s => s.id === currentSection) || null;
  };
  
  // Enhanced section change handler to handle approach/method toggling
  const handleSectionChange = (sectionId) => {
    // First, check if this is a research approach or data method section
    const isApproachSection = ['hypothesis', 'needsresearch', 'exploratoryresearch'].includes(sectionId);
    const isDataMethodSection = ['experiment', 'existingdata', 'theorysimulation'].includes(sectionId);
    
    // Update the appropriate state
    if (isApproachSection) {
      setActiveApproach(sectionId);
    } else if (isDataMethodSection) {
      setActiveDataMethod(sectionId);
    }
    
    // Call the base section change handler
    baseHandleSectionChange(sectionId);
  };
  
  // Reset project with confirmation handling
  const resetProject = () => {
    openConfirmDialog();
  };
  
  // Paper review functionality
  const handleReviewPaper = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setReviewLoading(true);
    try {
      console.log(`Starting paper review for: ${file.name}`);
      const result = await reviewScientificPaper(file);
      
      if (result.success) {
        console.log(`Review completed successfully for: ${file.name}`);
        setReviewData(result);
        openReviewModal();
        return true;
      } else {
        console.error(`Review failed for: ${file.name}`, result.error);
        alert(`Error reviewing paper: ${result.error || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error("Error in paper review:", error);
      alert(`Error reviewing paper: ${error.message || 'Unknown error'}`);
      return false;
    } finally {
      setReviewLoading(false);
    }
  };
  
  // UPDATED: Final reset project function - now uses our centralized reset service
  const onConfirmReset = () => {
    // Use our comprehensive reset service
    const freshState = resetAllState();
    
    // Update state with the fresh values
    setUserInputs(freshState.userInputs);
    setChatMessages(freshState.chatMessages);
    
    // Reset our local state too
    setActiveApproach('hypothesis');
    setActiveDataMethod('experiment');
    setSectionCompletionStatus({});
    
    // Close the confirmation dialog
    closeConfirmDialog();
    
    console.log("[usePaperPlanner] Reset completed");
  };
  
  // UPDATED: Load project function - now sets appropriate toggles
  const loadProject = (data) => {
    const result = loadProjectAction(data);
    if (result) {
      // If data contains detected toggles from document import, use those
      if (data.detectedToggles) {
        const { approach, dataMethod } = data.detectedToggles;
        console.log(`[usePaperPlanner] Setting detected toggles: approach=${approach}, dataMethod=${dataMethod}`);
        
        // Update approach state if valid
        if (approach && ['hypothesis', 'needsresearch', 'exploratoryresearch'].includes(approach)) {
          setActiveApproach(approach);
        }
        
        // Update data method state if valid
        if (dataMethod && ['experiment', 'existingdata', 'theorysimulation'].includes(dataMethod)) {
          setActiveDataMethod(dataMethod);
        }
        
        // Set the active section to the detected approach (this is the main section to show)
        handleSectionChange(approach || sectionContent.sections[0].id);
      } else {
        // Default section for regular project loads (not from document import)
        handleSectionChange(sectionContent.sections[0].id);
        
        // Reset approach and method to defaults 
        // (Note: project loading handles the rest of the reset already)
        setActiveApproach('hypothesis');
        setActiveDataMethod('experiment');
      }
    }
    return result;
  };
  
  // Handler for opening the save dialog
  const handleSaveProject = () => {
    openSaveDialog();
  };
  
  // Handler for saving with a specific filename
  const handleSaveWithFilename = (fileName) => {
    const result = saveProject(fileName);
    closeSaveDialog();
    return result;
  };
  
  // Initialization effect for global reset handlers
  useEffect(() => {
    const handleGlobalReset = () => {
      console.log("[usePaperPlanner] Detected global reset event");
      // Update our state with the reset values
      const freshState = resetAllState();
      setUserInputs(freshState.userInputs);
      setChatMessages(freshState.chatMessages);
      setActiveApproach('hypothesis');
      setActiveDataMethod('experiment');
      setSectionCompletionStatus({});
    };
    
    // Listen for global reset events
    window.addEventListener('projectStateReset', handleGlobalReset);
    
    return () => {
      window.removeEventListener('projectStateReset', handleGlobalReset);
    };
  }, []);
  
  // Effect to listen for document import events to update toggles
  useEffect(() => {
    const handleDocumentImported = (event) => {
      const { detectedApproach, detectedDataMethod } = event.detail || {};
      
      if (detectedApproach) {
        console.log(`[usePaperPlanner] Setting approach from document import: ${detectedApproach}`);
        setActiveApproach(detectedApproach);
      }
      
      if (detectedDataMethod) {
        console.log(`[usePaperPlanner] Setting data method from document import: ${detectedDataMethod}`);
        setActiveDataMethod(detectedDataMethod);
      }
    };
    
    window.addEventListener('documentImported', handleDocumentImported);
    return () => {
      window.removeEventListener('documentImported', handleDocumentImported);
    };
  }, []);
  
  // Return a unified API for all functionality
  return {
    // State
    userInputs,
    chatMessages,
    currentSection,
    currentIndex,
    currentMessage,
    loading,
    activeApproach,
    activeDataMethod,
    sectionCompletionStatus,
    
    // Modal state
    showConfirmDialog,
    showExamplesDialog,
    showReviewModal,
    showPrivacyPolicy,
    showSaveDialog,
    reviewData,
    
    // Direct setter functions for consistent API
    setShowConfirmDialog,
    setShowExamplesDialog, 
    setShowReviewModal,
    setShowPrivacyPolicy,
    setShowSaveDialog,
    
    // Setters
    setUserInputs,
    setChatMessages,
    setCurrentMessage,
    setActiveApproach,
    setActiveDataMethod,
    setSectionCompletionStatus,
    
    // Core functionality
    handleSectionChange,
    handleInputChange,
    handleSendMessage,
    resetProject,
    goToNextSection,
    goToPreviousSection,
    
    // Unified reset function for direct access when needed
    resetAllProjectState,
    
    // Project actions
    exportProject,
    handleSaveProject,
    saveWithFilename: handleSaveWithFilename,
    loadProject,
    importDocumentContent,
    
    // Modal actions
    onConfirmReset,
    openConfirmDialog,
    closeConfirmDialog,
    openExamplesDialog,
    closeExamplesDialog,
    openReviewModal,
    closeReviewModal,
    openPrivacyPolicy,
    closePrivacyPolicy,
    openSaveDialog,
    closeSaveDialog,
    
    // Review actions
    handleReviewPaper,
    
    // Helpers
    getCurrentSectionData
  };
};

export default usePaperPlanner;
