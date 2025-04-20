// FILE: src/services/sectionStateService.js

/**
 * Service for managing section minimization states
 * Handles localStorage persistence and provides utility functions
 */

const STORAGE_KEY = 'sectionMinimizedStates';

/**
 * Check if localStorage is available
 * @returns {boolean} - Whether localStorage is available
 */
const isStorageAvailable = () => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn('Local storage is not available:', e.message);
    return false;
  }
};

/**
 * Get the minimized state for a specific section from localStorage
 * @param {string} sectionId - The section ID
 * @returns {boolean} - Whether the section is minimized
 */
export const getSectionMinimizedState = (sectionId) => {
  if (!isStorageAvailable()) {
    // Default to minimized if storage is unavailable
    return true;
  }

  try {
    // Get all section states
    const statesJson = localStorage.getItem(STORAGE_KEY);
    if (!statesJson) {
      // Default to minimized if no states are stored
      return true;
    }

    const states = JSON.parse(statesJson);
    
    // If the section isn't in the states object, default to minimized
    return states[sectionId] !== false;
  } catch (error) {
    console.error(`Error getting minimized state for section ${sectionId}:`, error);
    // Default to minimized if there's an error
    return true;
  }
};

/**
 * Set the minimized state for a specific section and persist to localStorage
 * @param {string} sectionId - The section ID
 * @param {boolean} isMinimized - Whether the section should be minimized
 */
export const setSectionMinimizedState = (sectionId, isMinimized) => {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    // Get current states
    const statesJson = localStorage.getItem(STORAGE_KEY);
    const states = statesJson ? JSON.parse(statesJson) : {};
    
    // Update state for this section
    states[sectionId] = isMinimized;
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  } catch (error) {
    console.error(`Error setting minimized state for section ${sectionId}:`, error);
  }
};

/**
 * Initialize all section states based on whether it's a new project or example
 * @param {boolean} isNewProject - Whether this is a new project (true) or an example (false)
 * @param {Array} sectionIds - Array of all visible section IDs
 */
export const initializeSectionStates = (isNewProject, sectionIds = []) => {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    // Create new states object
    const states = {};
    
    // Always initialize all potential sections, even if they're not currently visible
    // This ensures consistent behavior when switching between approaches later
    const allPossibleSections = [
      'question', 'audience', 'hypothesis', 'needsresearch', 'exploratoryresearch',
      'relatedpapers', 'experiment', 'existingdata', 'theorysimulation',
      'analysis', 'process', 'abstract'
    ];
    
    // For new projects: Only expand the first "question" section, minimize all others
    // For examples: Expand all sections
    allPossibleSections.forEach(sectionId => {
      if (isNewProject) {
        // For new projects, only the "question" section is expanded
        states[sectionId] = sectionId !== 'question';
      } else {
        // For examples, all sections are expanded
        states[sectionId] = false;
      }
    });
    
    // Also include any sections from sectionIds that might not be in our hardcoded list
    sectionIds.forEach(sectionId => {
      if (!allPossibleSections.includes(sectionId)) {
        if (isNewProject) {
          // For new projects, only the "question" section is expanded
          states[sectionId] = sectionId !== 'question';
        } else {
          // For examples, all sections are expanded
          states[sectionId] = false;
        }
      }
    });
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
    
    // Dispatch an event so components can react to the change
    window.dispatchEvent(new CustomEvent('sectionStatesChanged'));
    
    console.log(`Initialized section states for ${isNewProject ? 'new project' : 'example'}:`, states);
  } catch (error) {
    console.error('Error initializing section states:', error);
  }
};

/**
 * Clear all section states and reinitialize
 * @param {boolean} useMinimizedDefault - Whether sections should default to minimized after clearing
 */
export const clearAllSectionStates = (useMinimizedDefault = true) => {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    if (useMinimizedDefault) {
      // Define all possible sections
      const allPossibleSections = [
        'question', 'audience', 'hypothesis', 'needsresearch', 'exploratoryresearch',
        'relatedpapers', 'experiment', 'existingdata', 'theorysimulation',
        'analysis', 'process', 'abstract'
      ];
      
      // For new projects, set all sections to minimized except "question"
      const states = {};
      allPossibleSections.forEach(sectionId => {
        // Only question is expanded (not minimized)
        states[sectionId] = sectionId !== 'question';
      });
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
    } else {
      // For examples or testing, just remove all states
      localStorage.removeItem(STORAGE_KEY);
    }
    
    // Dispatch an event so components can react to the change
    window.dispatchEvent(new CustomEvent('sectionStatesChanged'));
    
    console.log('Cleared all section states');
  } catch (error) {
    console.error('Error clearing section states:', error);
  }
};

/**
 * External helper to toggle all sections at once
 * @param {boolean} minimizeAll - Whether to minimize all sections (true) or expand all (false)
 * @param {Array} sectionIds - Array of all section IDs to affect
 */
export const toggleAllSections = (minimizeAll, sectionIds = []) => {
  if (!isStorageAvailable() || !sectionIds.length) {
    return;
  }

  try {
    // Get current states
    const statesJson = localStorage.getItem(STORAGE_KEY);
    const states = statesJson ? JSON.parse(statesJson) : {};
    
    // Update states for all sections
    sectionIds.forEach(sectionId => {
      states[sectionId] = minimizeAll;
    });
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
    
    // Dispatch an event so components can react to the change
    window.dispatchEvent(new CustomEvent('sectionStatesChanged'));
    
    console.log(`${minimizeAll ? 'Minimized' : 'Expanded'} all sections`);
  } catch (error) {
    console.error(`Error toggling all sections:`, error);
  }
};
