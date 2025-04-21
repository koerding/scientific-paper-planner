// FILE: src/services/resetService.js

/**
 * Centralized reset service to ensure consistent state reset across the application
 * This service handles clearing all user data and returning to initial state
 */

import { clearStorage } from './storageService';
import { resetSectionStates } from './sectionStateService';
import sectionContent from '../data/sectionContent.json';

/**
 * Fully resets the application state to default values
 * This is called when the user starts a new project
 * @returns {Object} Initial values for the application state
 */
export const resetAllState = () => {
  console.log("[resetService] Performing full application reset");
  
  // 1. Clear localStorage completely
  clearStorage();
  
  // 2. Clear feedback data specifically (in case clearStorage misses it)
  localStorage.removeItem('savedSectionFeedback');
  
  // 3. Reset section minimization states
  resetSectionStates();
  
  // 4. Create fresh default values with placeholders for all sections
  const freshInputs = {};
  const freshChatMessages = {};
  
  if (sectionContent && Array.isArray(sectionContent.sections)) {
    sectionContent.sections.forEach(section => {
      if (section && section.id) {
        // Use placeholder as initial content
        freshInputs[section.id] = section.placeholder || '';
        // Initialize empty chat for each section
        freshChatMessages[section.id] = [];
      }
    });
  }
  
  // 5. Dispatch a global event to notify components that need to reset
  window.dispatchEvent(new CustomEvent('projectStateReset', {
    detail: { 
      timestamp: Date.now(),
      source: 'resetAllState'
    }
  }));
  
  // Return initial state values for components to use
  return {
    userInputs: freshInputs,
    chatMessages: freshChatMessages,
    currentSection: sectionContent.sections[0].id,
    currentIndex: 0
  };
};

/**
 * Resets only specific parts of state
 * @param {Object} options - Options specifying what to reset
 * @returns {Object} - Reset values for the specified state components
 */
export const resetPartialState = (options = {}) => {
  const { 
    resetUserInputs = false,
    resetChatMessages = false,
    resetFeedback = false,
    resetSectionMinimization = false
  } = options;
  
  console.log(`[resetService] Performing partial reset with options:`, options);
  
  const result = {};
  
  // Reset user inputs if requested
  if (resetUserInputs) {
    const freshInputs = {};
    if (sectionContent && Array.isArray(sectionContent.sections)) {
      sectionContent.sections.forEach(section => {
        if (section && section.id) {
          freshInputs[section.id] = section.placeholder || '';
        }
      });
    }
    result.userInputs = freshInputs;
    localStorage.removeItem('paperPlannerData');
  }
  
  // Reset chat messages if requested
  if (resetChatMessages) {
    const freshChatMessages = {};
    if (sectionContent && Array.isArray(sectionContent.sections)) {
      sectionContent.sections.forEach(section => {
        if (section && section.id) {
          freshChatMessages[section.id] = [];
        }
      });
    }
    result.chatMessages = freshChatMessages;
    localStorage.removeItem('paperPlannerChat');
  }
  
  // Reset feedback if requested
  if (resetFeedback) {
    localStorage.removeItem('savedSectionFeedback');
  }
  
  // Reset section minimization if requested
  if (resetSectionMinimization) {
    resetSectionStates();
  }
  
  // Dispatch an event if any reset was performed
  if (Object.keys(result).length > 0 || resetFeedback || resetSectionMinimization) {
    window.dispatchEvent(new CustomEvent('partialStateReset', {
      detail: { 
        timestamp: Date.now(),
        resetOptions: options
      }
    }));
  }
  
  return result;
};
