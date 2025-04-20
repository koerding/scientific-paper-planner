// src/services/sectionStateService.js

/**
 * Service for handling section UI state persistence
 * Manages minimized/expanded states across sessions
 */

const STORAGE_KEY = 'sectionUIStates';

/**
 * Safely checks if localStorage is available and accessible
 * @returns {boolean} - True if localStorage is available
 */
export const isStorageAvailable = () => {
  try {
    // Test if localStorage is available
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn('Local storage is not available for section states:', e.message);
    return false;
  }
};

/**
 * Gets the minimized state for a specific section
 * @param {string} sectionId - The section ID
 * @returns {boolean} - Whether the section is minimized
 */
export const getSectionMinimizedState = (sectionId) => {
  if (!isStorageAvailable()) return false;
  
  try {
    const statesJson = localStorage.getItem(STORAGE_KEY);
    if (!statesJson) return false;
    
    const states = JSON.parse(statesJson);
    return states[sectionId] === true;
  } catch (error) {
    console.warn('Error getting section state:', error);
    return false;
  }
};

/**
 * Sets the minimized state for a specific section
 * @param {string} sectionId - The section ID
 * @param {boolean} isMinimized - Whether the section is minimized
 */
export const setSectionMinimizedState = (sectionId, isMinimized) => {
  if (!isStorageAvailable()) return;
  
  try {
    let states = {};
    const statesJson = localStorage.getItem(STORAGE_KEY);
    
    if (statesJson) {
      states = JSON.parse(statesJson);
    }
    
    states[sectionId] = isMinimized;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  } catch (error) {
    console.warn('Error saving section state:', error);
  }
};

/**
 * Gets all section minimized states
 * @returns {Object} - Map of section IDs to minimized states
 */
export const getAllSectionStates = () => {
  if (!isStorageAvailable()) return {};
  
  try {
    const statesJson = localStorage.getItem(STORAGE_KEY);
    return statesJson ? JSON.parse(statesJson) : {};
  } catch (error) {
    console.warn('Error getting all section states:', error);
    return {};
  }
};

/**
 * Clear all section state settings
 * Useful when resetting the project
 */
export const clearAllSectionStates = () => {
  if (!isStorageAvailable()) return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Error clearing section states:', error);
  }
};

/**
 * Toggle all sections to the same state (all minimized or all expanded)
 * @param {boolean} minimized - Whether to minimize all sections
 * @param {Array} sectionIds - Optional array of section IDs to affect
 */
export const setAllSectionStates = (minimized, sectionIds = null) => {
  if (!isStorageAvailable()) return;
  
  try {
    let states = {};
    const statesJson = localStorage.getItem(STORAGE_KEY);
    
    if (statesJson) {
      states = JSON.parse(statesJson);
    }
    
    if (sectionIds && Array.isArray(sectionIds)) {
      // Only set states for provided section IDs
      sectionIds.forEach(id => {
        states[id] = minimized;
      });
    } else {
      // Clear current states to avoid old sections remaining
      states = {};
      
      // If no specific IDs provided, affect all sections that might be used
      const commonSectionIds = [
        'question',
        'audience',
        'hypothesis',
        'needsresearch',
        'exploratoryresearch',
        'relatedpapers',
        'experiment',
        'existingdata',
        'theorysimulation',
        'analysis',
        'process',
        'abstract'
      ];
      
      commonSectionIds.forEach(id => {
        states[id] = minimized;
      });
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  } catch (error) {
    console.warn('Error setting all section states:', error);
  }
};
