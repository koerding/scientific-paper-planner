// FILE: src/hooks/useProjectActions.js

/**
 * Hook for managing project actions like save, load, export
 * UPDATED: Improved reset function to clear ALL content
 */
import { useState, useCallback } from 'react';
import { clearStorage } from '../services/storageService';
import { resetSectionStates } from '../services/sectionStateService';
import { exportProject, saveProjectAsJson, validateProjectData } from '../utils/export';

export const useProjectActions = (userInputs, setUserInputs, chatMessages, setChatMessages, resetState, sectionContent) => {
  const [actionLoading, setActionLoading] = useState(false);

  /**
   * Comprehensive reset function that clears all state
   * This resets everything: project content, chat messages, section states, and feedback
   * UPDATED: Now explicitly sets all section content back to placeholder values
   * @returns {boolean} - Success indicator
   */
  const resetAllProjectState = useCallback(() => {
    console.log("[useProjectActions] Performing complete project reset");
    
    // 1. Clear localStorage completely
    clearStorage();
    
    // 2. Reset section minimization states (expand/collapse)
    resetSectionStates();
    
    // 3. Clear saved feedback from localStorage
    localStorage.removeItem('savedSectionFeedback');
    
    // 4. Create fresh default values with placeholders for all sections
    const freshInputs = {};
    if (sectionContent && Array.isArray(sectionContent.sections)) {
      sectionContent.sections.forEach(section => {
        if (section && section.id) {
          // Use placeholder as initial content
          freshInputs[section.id] = section.placeholder || '';
        }
      });
    }
    
    // 5. Create fresh empty chat messages
    const freshChatMessages = {};
    if (sectionContent && Array.isArray(sectionContent.sections)) {
      sectionContent.sections.forEach(section => {
        if (section && section.id) {
          freshChatMessages[section.id] = [];
        }
      });
    }
    
    // 6. Update the state directly 
    // This ensures we don't rely on resetState which might not be comprehensive
    setUserInputs(freshInputs);
    setChatMessages(freshChatMessages);
    
    // 7. Also call the parent reset state function as backup
    resetState();
    
    // 8. Dispatch a global event to notify components that need to reset
    window.dispatchEvent(new CustomEvent('projectStateReset', {
      detail: { 
        timestamp: Date.now(),
        source: 'resetAllProjectState'
      }
    }));
    
    console.log("[useProjectActions] Project reset complete");
    return true;
  }, [resetState, setUserInputs, setChatMessages, sectionContent]);

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
      
      // Dispatch an event to notify components that project data was loaded
      window.dispatchEvent(new CustomEvent('projectDataLoaded', {
        detail: { 
          timestamp: Date.now(),
          hasUserContent: Object.values(mergedInputs).some(val => val && val.trim() !== '')
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
