// FILE: src/hooks/usePaperPlanner.js

/**
 * Main hook that combines all specialized hooks into a unified API
 * FIXED: Improved handling of research approach and data method toggling
 */
import { useState, useEffect } from 'react';
import { useProjectState } from './useProjectState';
import { useChat } from './useChat';
import { useProjectActions } from './useProjectActions';
import { useDocumentImport } from './useDocumentImport';
import { useModalState } from './useModalState';
import { reviewScientificPaper } from '../services/paperReviewService';
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
  
  // Setup project actions
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
    handleExportProject: exportProject,
    saveProject,
    loadProject: loadProjectAction
  } = projectActions;
  
  // Setup document import
  const documentImport = useDocumentImport(loadProjectAction, sectionContent);
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
  
  // Final reset project function
  const onConfirmReset = () => {
    resetProjectAction();
    closeConfirmDialog();
    
    // Reset approach and method to defaults
    setActiveApproach('hypothesis');
    setActiveDataMethod('experiment');
  };
  
  // Final load project function
  const loadProject = (data) => {
    const result = loadProjectAction(data);
    if (result) {
      handleSectionChange(sectionContent.sections[0].id);
      
      // Reset approach and method to defaults
      setActiveApproach('hypothesis');
      setActiveDataMethod('experiment');
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
