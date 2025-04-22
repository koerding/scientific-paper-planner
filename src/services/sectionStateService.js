// FILE: src/services/sectionStateService.js

/**
 * Service for managing section minimization state
 * Provides functions to get, set, clear, and initialize section states
 * UPDATED: Enhanced event dispatching for better component coordination
 * UPDATED: Added special handler for document imports to expand all sections
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
    
    // Dispatch an event to notify components of the change
    window.dispatchEvent(new CustomEvent('sectionStatesChanged', {
      detail: { sectionId, isMinimized }
    }));
    
    console.log(`Section state updated: ${sectionId} is now ${isMinimized ? 'minimized' : 'expanded'}`);
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
    window.dispatchEvent(new CustomEvent('sectionStatesChanged', {
      detail: { allSectionsReset: true, defaultMinimized }
    }));
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
    console.log(`[sectionStateService] Initializing section states with defaultMinimized=${defaultMinimized}`);
    
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
      
      // If we're expanding all sections (for PDF imports, etc.), we need to set each one explicitly
      if (!defaultMinimized) {
        // First find all stored section keys
        const allSectionKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('section_minimized_')
        );
        
        // Remove them all 
        allSectionKeys.forEach(key => localStorage.removeItem(key));
        
        // For any section IDs we know about, set them to expanded (not minimized)
        // We implement this by looking at localStorage keys that might contain section data
        const possibleSectionKeys = Object.keys(localStorage).filter(key => 
          key.includes('paperPlanner') || 
          key.includes('section_') ||
          key.includes('feedback')
        );
        
        // Extract potential section IDs from these keys
        const potentialIds = new Set();
        possibleSectionKeys.forEach(key => {
          // Try to parse JSON from values that might contain section IDs
          try {
            const value = localStorage.getItem(key);
            if (value && (value.includes('"id"') || value.includes('"section_id"'))) {
              const parsed = JSON.parse(value);
              
              // Handle various formats
              if (parsed.sections) {
                parsed.sections.forEach(section => {
                  if (section && section.id) potentialIds.add(section.id);
                });
              }
              
              // Check for direct id property
              if (parsed.id) potentialIds.add(parsed.id);
              
              // Check for array of objects with id
              if (Array.isArray(parsed)) {
                parsed.forEach(item => {
                  if (item && item.id) potentialIds.add(item.id);
                });
              }
            }
          } catch (e) {
            // Ignore parsing errors for this discovery process
          }
        });
        
        // Use our discovered IDs or fall back to some common ones
        const idsToSet = potentialIds.size > 0 ? 
          Array.from(potentialIds) : 
          ['question', 'audience', 'hypothesis', 'needsresearch', 'exploratoryresearch',
           'relatedpapers', 'experiment', 'existingdata', 'theorysimulation', 
           'analysis', 'process', 'abstract'];
        
        // Set all sections to expanded state
        idsToSet.forEach(id => {
          localStorage.setItem(`section_minimized_${id}`, 'false');
        });
        
        console.log(`[sectionStateService] Set ${idsToSet.length} sections to expanded state:`, idsToSet);
      }
    }
    
    // Listen for document import events to expand all sections
    const handleDocumentImported = (event) => {
      if (event.detail?.expandAllSections) {
        console.log('[sectionStateService] Document import detected, expanding all sections');
        
        // Find all section keys and set them to expanded
        const allSectionKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('section_minimized_')
        );
        
        allSectionKeys.forEach(key => {
          const sectionId = key.replace('section_minimized_', '');
          localStorage.setItem(key, 'false'); // false = not minimized = expanded
        });
        
        // Dispatch an event to update the UI
        window.dispatchEvent(new CustomEvent('sectionStatesChanged', {
          detail: { 
            allSectionsExpanded: true,
            source: 'documentImport'
          }
        }));
      }
    };
    
    // Register the event listener once
    window.removeEventListener('documentImported', handleDocumentImported);
    window.addEventListener('documentImported', handleDocumentImported);
    
    // Dispatch an event to notify components of the change
    window.dispatchEvent(new CustomEvent('sectionStatesChanged', {
      detail: { initialized: true, defaultMinimized }
    }));
  } catch (error) {
    console.warn('Error initializing section states:', error);
  }
};

/**
 * Toggle minimization state for a section
 * @param {string} sectionId - The ID of the section to toggle
 * @returns {boolean} - The new minimized state (true if minimized)
 */
export const toggleSectionMinimizedState = (sectionId) => {
  try {
    const currentState = getSectionMinimizedState(sectionId);
    const newState = !currentState;
    
    setSectionMinimizedState(sectionId, newState);
    return newState;
  } catch (error) {
    console.warn(`Error toggling minimized state for ${sectionId}:`, error);
    return false;
  }
};

/**
 * Expand all sections (convenience function)
 * @returns {boolean} - Success flag
 */
export const expandAllSections = () => {
  try {
    // Get all section keys from localStorage
    const allSectionKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('section_minimized_'))
      .map(key => key.replace('section_minimized_', ''));
    
    // Set all sections to expanded (not minimized)
    allSectionKeys.forEach(sectionId => {
      localStorage.setItem(`section_minimized_${sectionId}`, 'false');
    });
    
    // Dispatch an event to notify components of the change
    window.dispatchEvent(new CustomEvent('sectionStatesChanged', {
      detail: { allSectionsExpanded: true }
    }));
    
    return true;
  } catch (error) {
    console.error('Error expanding all sections:', error);
    return false;
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
    window.dispatchEvent(new CustomEvent('sectionStatesChanged', {
      detail: { reset: true }
    }));
    
    return true;
  } catch (error) {
    console.error('Error resetting section states:', error);
    return false;
  }
};
