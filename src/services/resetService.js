// FILE: src/services/resetService.js

import { storageService } from './storageService';

/**
 * Complete reset service to ensure consistent state reset across the application
 */

/**
 * Reset all application state to default values
 * This is a centralized function that should be used for "New Project" functionality
 * @returns {boolean} Success flag
 */
export const resetAllState = () => {
  console.log("[resetService] Performing full application reset");
  
  // Clear all localStorage data through the storage service
  storageService.clearAll();
  
  // Dispatch a global reset event that components can listen for
  window.dispatchEvent(new CustomEvent('projectStateReset', {
    detail: { 
      timestamp: Date.now(),
      source: 'resetAllState'
    }
  }));
  
  return true;
};

/**
 * Performs a partial reset of specific state slices
 * @param {Object} options - Options specifying what to reset
 * @returns {boolean} - Success flag
 */
export const resetPartialState = (options = {}) => {
  const { 
    resetContent = false,
    resetSectionStates = false,
    resetFeedback = false,
    resetChat = false
  } = options;
  
  console.log(`[resetService] Performing partial reset with options:`, options);
  
  // Clear specific localStorage items based on options
  if (resetContent) {
    storageService.clearData('PROJECT_DATA');
  }
  
  if (resetSectionStates) {
    storageService.clearData('SECTION_STATES');
    
    // Also clear section_minimized_* keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('section_minimized_')) {
        localStorage.removeItem(key);
      }
    }
  }
  
  if (resetFeedback) {
    storageService.clearData('FEEDBACK_DATA');
  }
  
  if (resetChat) {
    storageService.clearData('CHAT_MESSAGES');
  }
  
  // Dispatch an event for the partial reset
  window.dispatchEvent(new CustomEvent('partialStateReset', {
    detail: { 
      timestamp: Date.now(),
      resetContent,
      resetSectionStates,
      resetFeedback,
      resetChat
    }
  }));
  
  return true;
};

/**
 * Reset all state and reload the page - a nuclear option
 * @returns {void}
 */
export const hardReset = () => {
  resetAllState();
  window.location.reload();
};
