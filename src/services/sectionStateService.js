// FILE: src/services/sectionStateService.js

/**
 * Service for managing section minimization state
 * Provides functions to get, set, clear, and initialize section states
 */

/**
 * Get the minimized state for a section
 * @param {string} sectionId - The ID of the section
 * @returns {boolean} - True if minimized, false if expanded
 */
export const getSectionMinimizedState = (sectionId) => {
  try {
    const storedState = localStorage.getItem(`section_minimized_${sectionId}`);
    
    // If no stored state, use default based on section ID
    if (storedState === null) {
      // Question section is expanded by default, all others are minimized
      return sectionId !== 'question';
    }
    
    // Return the stored state
    return storedState === 'true';
  } catch (error) {
    console.warn(`Error getting minimized state for ${sectionId}:`, error);
    // Default to minimized if there's an error
    return true;
  }
};

/**
 * Set the minimized state for a section
 * @param {string} sectionId - The ID of the section
 * @param {boolean} isMinimized - Whether the section should be minimized
 */
export const setSectionMinimizedState = (sectionId, isMinimized) => {
  try {
    localStorage.setItem(`section_minimized_${sectionId}`, isMinimized.toString());
  } catch (error) {
    console.warn(`Error setting minimized state for ${sectionId}:`, error);
  }
};

/**
 * Clear the minimized state for all sections
 */
export const clearAllSectionStates = (defaultMinimized = true) => {
  try {
    // Clear all existing section states
    const allSectionKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('section_minimized_')
    );
    
    allSectionKeys.forEach(key => localStorage.removeItem(key));
    
    // If we're initializing with defaults, set the Question section to be expanded
    if (!defaultMinimized) {
      localStorage.setItem('section_minimized_question', 'false');
    }
    
    // Dispatch an event to notify components of the change
    window.dispatchEvent(new CustomEvent('sectionStatesChanged'));
  } catch (error) {
    console.warn('Error clearing section states:', error);
  }
};

/**
 * Initialize section states for a new project or loaded example
 * @param {boolean} defaultMinimized - Whether sections should be minimized by default
 * @param {string[]} sectionIds - Optional array of section IDs to initialize
 */
export const initializeSectionStates = (defaultMinimized = true, sectionIds = []) => {
  try {
    // If specific section IDs were provided, initialize only those
    if (sectionIds.length > 0) {
      sectionIds.forEach(id => {
        // Question is always expanded, others follow the default
        const isMinimized = defaultMinimized && id !== 'question';
        localStorage.setItem(`section_minimized_${id}`, isMinimized.toString());
      });
    } else {
      // Otherwise, clear all existing states and set defaults
      clearAllSectionStates(defaultMinimized);
    }
    
    // In either case, ensure Question section is expanded
    if (!defaultMinimized) {
      localStorage.setItem('section_minimized_question', 'false');
    }
    
    // Dispatch an event to notify components of the change
    window.dispatchEvent(new CustomEvent('sectionStatesChanged'));
  } catch (error) {
    console.warn('Error initializing section states:', error);
  }
};

/**
 * Reset all section states to default (Question expanded, others minimized)
 */
export const resetSectionStates = () => {
  try {
    // Clear all existing section states
    const allSectionKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('section_minimized_')
    );
    
    allSectionKeys.forEach(key => localStorage.removeItem(key));
    
    // Set the Question section to be expanded by default
    localStorage.setItem('section_minimized_question', 'false');
    
    // Dispatch an event to notify components of the change
    window.dispatchEvent(new CustomEvent('sectionStatesChanged'));
    
    return true;
  } catch (error) {
    console.error('Error resetting section states:', error);
    return false;
  }
};
