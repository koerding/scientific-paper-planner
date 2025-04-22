// src/services/storageService.js

// Storage keys
const STORAGE_KEYS = {
  PROJECT_DATA: 'scientific-project-data',
  SECTION_STATES: 'scientific-project-section-states',
  CHAT_MESSAGES: 'scientific-project-chat',
  FEEDBACK_DATA: 'scientific-project-feedback',
  USER_PREFERENCES: 'scientific-project-preferences'
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
