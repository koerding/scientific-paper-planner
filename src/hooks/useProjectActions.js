// FILE: src/hooks/useProjectActions.js

/**
 * Hook for managing project actions like save, load, export
 * UPDATED: Uses the new resetService for consistent reset functionality
 * UPDATED: Enhanced to handle detected toggles from document import
 */
import { useState, useCallback } from 'react';
import { resetAllState, resetPartialState } from '../services/resetService';
import { exportProject, saveProjectAsJson, validateProjectData } from '../utils/export';

export const useProjectActions = (userInputs, setUserInputs, chatMessages, setChatMessages, resetState, sectionContent) => {
  const [actionLoading, setActionLoading] = useState(false);

  /**
   * Comprehensive reset function that clears all state
   * Now uses the centralized resetService
   * @returns {boolean} - Success indicator
   */
  const resetAllProjectState = useCallback(() => {
    console.log("[useProjectActions] Calling resetAllState from resetService");
    
    // Get fresh state from the reset service
    const freshState = resetAllState();
    
    // Update state with the fresh values
    setUserInputs(freshState.userInputs);
    setChatMessages(freshState.chatMessages);
    
    // Also call the parent reset state function as backup
    if (typeof resetState === 'function') {
      resetState();
    }
    
    console.log("[useProjectActions] Project reset complete");
    return true;
  }, [resetState, setUserInputs, setChatMessages]);

  // Reset project function - now just calls the comprehensive reset
  const resetProject = useCallback(() => {
    return resetAllProjectState();
  }, [resetAllProjectState]);

  // Export project
  const handleExportProject = useCallback(() => {
    return exportProject(userInputs, chatMessages, sectionContent);
  }, [userInputs, chatMessages, sectionContent]);

  // Save project as JSON
  const saveProject = useCallback((fileName) => {
    return saveProjectAsJson(userInputs, chatMessages, fileName);
  }, [userInputs, chatMessages]);

  /**
   * Load project from data with comprehensive reset first
   * @param {Object} data - The project data to load
   * @returns {boolean} - Success indicator
   */
  const loadProject = useCallback((data) => {
    if (!validateProjectData(data)) {
      alert("Invalid project file format. Please select a valid project file.");
      return false;
    }
    
    try {
      // First reset everything to ensure clean state
      resetAllProjectState();
      
      // Create template values using sectionContent
      const templateValues = {};
      sectionContent.sections.forEach(section => {
        if (section && section.id) {
          templateValues[section.id] = section.placeholder || '';
        }
      });
      
      // Merge with loaded data
      const mergedInputs = {...templateValues};
      Object.keys(data.userInputs).forEach(sectionId => {
        if (data.userInputs[sectionId] && typeof data.userInputs[sectionId] === 'string' && 
            data.userInputs[sectionId].trim() !== '') {
          mergedInputs[sectionId] = data.userInputs[sectionId];
        }
      });
      
      // Update user inputs state
      setUserInputs(mergedInputs);
      
      // Create empty chat messages
      const emptyChat = {};
      sectionContent.sections.forEach(section => {
        if (section && section.id) {
          emptyChat[section.id] = [];
        }
      });
      
      // Merge with loaded chat messages if they exist
      const mergedChat = {...emptyChat};
      if (data.chatMessages) {
        Object.keys(data.chatMessages).forEach(sectionId => {
          if (Array.isArray(data.chatMessages[sectionId])) {
            mergedChat[sectionId] = data.chatMessages[sectionId];
          }
        });
      }
      
      // Update chat messages state
      setChatMessages(mergedChat);
      
      // Extract toggle settings from the data if available
      const detectedApproach = data.detectedToggles?.approach || null;
      const detectedDataMethod = data.detectedToggles?.dataMethod || null;
      
      // Dispatch an event to notify components that project data was loaded
      window.dispatchEvent(new CustomEvent('projectDataLoaded', {
        detail: { 
          timestamp: Date.now(),
          hasUserContent: Object.values(mergedInputs).some(val => val && val.trim() !== ''),
          // Include detected toggles if they exist
          detectedApproach,
          detectedDataMethod
        }
      }));
      
      return true;
    } catch (error) {
      console.error("Error loading project:", error);
      alert("Error loading project: " + (error.message || "Unknown error"));
      return false;
    }
  }, [sectionContent, setUserInputs, setChatMessages, resetAllProjectState]);

  return {
    actionLoading,
    setActionLoading,
    resetProject,
    resetAllProjectState, // Export the comprehensive reset function
    handleExportProject,
    saveProject,
    loadProject
  };
};
