// FILE: src/services/sectionStateService.js

/**
 * Service for managing section minimized states
 * FIXED: Added error handling for localStorage access
 * FIXED: Added fallback for missing sections
 * FIXED: Added toggleAllSections function
 * IMPROVED: Ensures question section is expanded by default
 */

// Constants
const STORAGE_KEY = 'sectionMinimizedStates';

/**
 * Safely access localStorage with fallback for iframe or extension contexts
 * @returns {boolean} Whether localStorage is available
 */
const isStorageAvailable = () => {
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
 * In-memory fallback for when localStorage is not available
 */
let memoryStorageFallback = {};

/**
 * Initialize section states (minimized or expanded) for new projects or examples
 * @param {boolean} minimized - Whether sections should start minimized (true for new projects, false for examples)
 * @param {Array} sectionIds - Optional array of section IDs to initialize
 */
export const initializeSectionStates = (minimized = true, sectionIds = []) => {
  try {
    console.log(`Initialized section states for ${minimized ? 'new project' : 'example'}:`, 
                sectionIds.length ? sectionIds : 'all sections');
    
    let states = {};
    
    // If section IDs are provided, initialize just those
    if (sectionIds && sectionIds.length > 0) {
      // Get existing states first if available
      const existingStates = loadSectionStates();
      states = { ...existingStates };
      
      // Set state for each specified section
      sectionIds.forEach(sectionId => {
        states[sectionId] = minimized;
      });
    } 
    // Otherwise initialize a default set of sections
    else {
      // Default sections if none provided
      const defaultSections = [
        'question', 'audience', 'hypothesis', 'needsresearch', 'exploratoryresearch',
        'relatedpapers', 'experiment', 'existingdata', 'theorysimulation', 
        'analysis', 'process', 'abstract'
      ];
      
      defaultSections.forEach(sectionId => {
        // IMPORTANT: Always make question section expanded regardless of minimized parameter
        if (sectionId === 'question') {
          states[sectionId] = false; // false = expanded
        } else {
          states[sectionId] = minimized;
        }
      });
    }
    
    // Save the states
    saveSectionStates(states);
    
    // Dispatch event to notify components of the change
    dispatchStateChangeEvent();
    
  } catch (error) {
    console.error('Error initializing section states:', error);
    // Continue with fallback in-memory storage
  }
};

/**
 * Toggle the minimized state of all sections
 * @param {boolean} minimized - Whether all sections should be minimized (true) or expanded (false)
 * @param {Array} sectionIds - Optional array of section IDs to toggle (defaults to all known sections)
 */
export const toggleAllSections = (minimized = true, sectionIds = []) => {
  try {
    // Get current states
    const states = loadSectionStates();
    
    // If sectionIds provided, only toggle those
    if (sectionIds && sectionIds.length > 0) {
      sectionIds.forEach(sectionId => {
        // Never minimize the question section if it's a new project
        if (sectionId === 'question' && minimized) {
          return; // Skip setting question to minimized
        }
        states[sectionId] = minimized;
      });
    } 
    // Otherwise toggle all known sections
    else {
      // Toggle all existing states
      Object.keys(states).forEach(sectionId => {
        // Never minimize the question section if it's a new project
        if (sectionId === 'question' && minimized) {
          return; // Skip setting question to minimized
        }
        states[sectionId] = minimized;
      });
    }
    
    // Save updated states
    saveSectionStates(states);
    
    // Notify components
    dispatchStateChangeEvent();
    
    console.log(`Toggled all sections to ${minimized ? 'minimized' : 'expanded'}`);
    
    return true;
  } catch (error) {
    console.error('Error toggling all sections:', error);
    return false;
  }
};

/**
 * Clear all section states and set to default values
 * @param {boolean} minimized - Whether sections should be minimized by default
 */
export const clearAllSectionStates = (minimized = true) => {
  try {
    // Reset to empty object first
    const states = {};
    
    // Save the empty states object
    saveSectionStates(states);
    
    // Now initialize with default values
    initializeSectionStates(minimized);
    
  } catch (error) {
    console.error('Error clearing section states:', error);
    // Continue with fallback
    memoryStorageFallback = {};
  }
};

/**
 * Get minimized state for a specific section with improved error handling
 * @param {string} sectionId - The section ID
 * @returns {boolean} - Whether the section is minimized (true) or expanded (false)
 */
export const getSectionMinimizedState = (sectionId) => {
  try {
    const states = loadSectionStates();
    
    // If we have a state for this section, return it
    if (sectionId in states) {
      return states[sectionId];
    }
    
    // Always keep question expanded by default
    if (sectionId === 'question') {
      return false; // false = expanded
    }
    
    // Default to minimized for other sections if not found
    return true;
  } catch (error) {
    console.error(`Error getting state for section ${sectionId}:`, error);
    // Fallback to default minimized, except for question
    return sectionId === 'question' ? false : true;
  }
};

/**
 * Set minimized state for a specific section
 * @param {string} sectionId - The section ID
 * @param {boolean} minimized - Whether the section should be minimized
 */
export const setSectionMinimizedState = (sectionId, minimized) => {
  try {
    const states = loadSectionStates();
    
    // Update the state for this section
    states[sectionId] = minimized;
    
    // Save the updated states
    saveSectionStates(states);
    
  } catch (error) {
    console.error(`Error setting state for section ${sectionId}:`, error);
    // Update memory fallback
    memoryStorageFallback[sectionId] = minimized;
  }
};

/**
 * Helper function to load section states from storage
 * @returns {Object} - Map of section IDs to minimized states
 */
const loadSectionStates = () => {
  try {
    // Try localStorage first
    if (isStorageAvailable()) {
      const statesJSON = localStorage.getItem(STORAGE_KEY);
      if (statesJSON) {
        return JSON.parse(statesJSON);
      }
    }
    
    // Fallback to memory storage
    return { ...memoryStorageFallback };
  } catch (error) {
    console.error('Error loading section states:', error);
    // Fallback to empty object
    return {};
  }
};

/**
 * Helper function to save section states to storage
 * @param {Object} states - Map of section IDs to minimized states
 */
const saveSectionStates = (states) => {
  try {
    // Try localStorage first
    if (isStorageAvailable()) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
    }
    
    // Update memory fallback as well
    memoryStorageFallback = { ...states };
  } catch (error) {
    console.error('Error saving section states:', error);
    // Just update memory fallback
    memoryStorageFallback = { ...states };
  }
};

// FILE: src/services/sectionStateService.js

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

/**
 * Dispatch a custom event to notify components that section states have changed
 */
const dispatchStateChangeEvent = () => {
  try {
    const event = new Event('sectionStatesChanged');
    window.dispatchEvent(event);
  } catch (error) {
    console.error('Error dispatching section states changed event:', error);
  }
};
