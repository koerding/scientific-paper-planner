// FILE: src/hooks/useProjectActions.js

/**
 * Hook for managing project actions like save, load, export
 */
import { useState, useCallback } from 'react';
import { clearStorage } from '../services/storageService';
import { resetSectionStates } from '../services/sectionStateService';
import { exportProject, saveProjectAsJson, validateProjectData } from '../utils/export';

export const useProjectActions = (userInputs, setUserInputs, chatMessages, setChatMessages, resetState, sectionContent) => {
  const [actionLoading, setActionLoading] = useState(false);

  // Reset project function
  const resetProject = useCallback(() => {
    // Clear localStorage first
    clearStorage();
    
    // Reset section minimization states
    resetSectionStates();

    // Call the reset state function
    resetState();

    return true;
  }, [resetState]);

  // Export project
  const handleExportProject = useCallback(() => {
    return exportProject(userInputs, chatMessages, sectionContent);
  }, [userInputs, chatMessages, sectionContent]);

  // Save project as JSON
  const saveProject = useCallback((fileName) => {
    return saveProjectAsJson(userInputs, chatMessages, fileName);
  }, [userInputs, chatMessages]);

  // Load project from data
  const loadProject = useCallback((data) => {
    if (!validateProjectData(data)) {
      alert("Invalid project file format. Please select a valid project file.");
      return false;
    }
    
    try {
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
      
      return true;
    } catch (error) {
      console.error("Error loading project:", error);
      alert("Error loading project: " + (error.message || "Unknown error"));
      return false;
    }
  }, [sectionContent, setUserInputs, setChatMessages]);

  return {
    actionLoading,
    setActionLoading,
    resetProject,
    handleExportProject,
    saveProject,
    loadProject
  };
};
