// FILE: src/services/storageService.js

// Storage keys - use original key names for backward compatibility
const STORAGE_KEYS = {
  PROJECT_DATA: 'paperPlannerData',  // Original project data key
  SECTION_STATES: 'section_states',   // Original section states key
  CHAT_MESSAGES: 'paperPlannerChat',  // Original chat messages key
  FEEDBACK_DATA: 'savedSectionFeedback', // Original feedback data key
  USER_PREFERENCES: 'userPreferences'
};

/**
 * Checks if localStorage is available and accessible
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
    console.warn('Local storage is not available:', e.message);
    return false;
  }
};

/**
 * Storage service for managing localStorage operations
 */
export const storageService = {
  // Project data
  saveProject: (data) => {
    if (!isStorageAvailable()) return false;
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECT_DATA, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving project:', error);
      return false;
    }
  },
  
  loadProject: () => {
    if (!isStorageAvailable()) return null;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECT_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading project:', error);
      return null;
    }
  },
  
  // Section states (expansion/collapse)
  saveSectionStates: (states) => {
    if (!isStorageAvailable()) return false;
    try {
      localStorage.setItem(STORAGE_KEYS.SECTION_STATES, JSON.stringify(states));
      return true;
    } catch (error) {
      console.error('Error saving section states:', error);
      return false;
    }
  },
  
  loadSectionStates: () => {
    if (!isStorageAvailable()) return null;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SECTION_STATES);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading section states:', error);
      return null;
    }
  },
  
  // Chat messages
  saveChatMessages: (messages) => {
    if (!isStorageAvailable()) return false;
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages));
      return true;
    } catch (error) {
      console.error('Error saving chat messages:', error);
      return false;
    }
  },
  
  loadChatMessages: () => {
    if (!isStorageAvailable()) return null;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading chat messages:', error);
      return null;
    }
  },
  
  // Feedback data
  saveFeedbackData: (feedback) => {
    if (!isStorageAvailable()) return false;
    try {
      localStorage.setItem(STORAGE_KEYS.FEEDBACK_DATA, JSON.stringify(feedback));
      return true;
    } catch (error) {
      console.error('Error saving feedback data:', error);
      return false;
    }
  },
  
  loadFeedbackData: () => {
    if (!isStorageAvailable()) return null;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FEEDBACK_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading feedback data:', error);
      return null;
    }
  },
  
  // User preferences
  saveUserPreferences: (preferences) => {
    if (!isStorageAvailable()) return false;
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
      return true;
    } catch (error) {
      console.error('Error saving user preferences:', error);
      return false;
    }
  },
  
  loadUserPreferences: () => {
    if (!isStorageAvailable()) return null;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return null;
    }
  },
  
  // Helper to check if specific data exists
  hasData: (key) => {
    if (!isStorageAvailable()) return false;
    return !!localStorage.getItem(STORAGE_KEYS[key]);
  },
  
  // Clear specific data
  clearData: (key) => {
    if (!isStorageAvailable()) return false;
    try {
      localStorage.removeItem(STORAGE_KEYS[key]);
      return true;
    } catch (error) {
      console.error(`Error clearing ${key}:`, error);
      return false;
    }
  },
  
  // Clear all app data
  clearAll: () => {
    if (!isStorageAvailable()) return false;
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Also clear legacy keys by section ID for section_minimized_*
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('section_minimized_')) {
          localStorage.removeItem(key);
        }
      }
      
      // Dispatch an event to notify components of the reset
      window.dispatchEvent(new CustomEvent('storageReset', {
        detail: { timestamp: Date.now() }
      }));
      
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
};

// Export the storage keys for direct access if needed
export const KEYS = STORAGE_KEYS;

// ========== BACKWARD COMPATIBILITY FUNCTIONS ==========
// These functions are provided for backward compatibility during migration
// They should be removed once migration is complete

/**
 * Legacy function for loading from storage
 * Maps to the new storageService functions
 * @returns {Object} An object containing loadedInputs and loadedChat
 */
export const loadFromStorage = () => {
  let loadedInputs = null;
  let loadedChat = {};
  
  try {
    // Try to load project data
    const projectData = storageService.loadProject();
    if (projectData && projectData.sections) {
      loadedInputs = projectData.sections;
    } else {
      // Direct load as fallback
      const savedInputsString = localStorage.getItem(STORAGE_KEYS.PROJECT_DATA);
      if (savedInputsString) {
        loadedInputs = JSON.parse(savedInputsString);
      }
    }
    
    // Try to load chat data
    loadedChat = storageService.loadChatMessages() || {};
    
  } catch (error) {
    console.error('[storageService] Error in loadFromStorage:', error);
  }
  
  return { loadedInputs, loadedChat };
};

/**
 * Legacy function for saving to storage
 * Maps to the new storageService functions
 * @param {Object} userInputs - User inputs to save
 * @param {Object} chatMessages - Chat messages to save
 * @returns {boolean} Success indicator
 */
export const saveToStorage = (userInputs, chatMessages) => {
  try {
    // Save user inputs
    let projectSuccess = false;
    if (userInputs) {
      // Save in both formats for compatibility
      projectSuccess = storageService.saveProject({ sections: userInputs });
      localStorage.setItem(STORAGE_KEYS.PROJECT_DATA, JSON.stringify(userInputs));
    }
    
    // Save chat messages
    let chatSuccess = false;
    if (chatMessages) {
      chatSuccess = storageService.saveChatMessages(chatMessages);
    }
    
    return projectSuccess || chatSuccess;
  } catch (error) {
    console.error('[storageService] Error in saveToStorage:', error);
    return false;
  }
};

// Export the isStorageAvailable function for backward compatibility
export { isStorageAvailable };
