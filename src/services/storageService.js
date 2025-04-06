// FILE: src/services/storageService.js

/**
 * Storage service for handling localStorage operations with safe fallbacks
 * Handles "Access to storage is not allowed from this context" errors
 */

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
    console.warn('Local storage is not available:', e.message);
    return false;
  }
};

/**
 * Safely saves data to localStorage with error handling
 * @param {Object} userInputs - User inputs to save
 * @param {Object} chatMessages - Chat messages to save
 * @returns {boolean} - Success indicator
 */
export const saveToStorage = (userInputs, chatMessages) => {
  if (!isStorageAvailable()) {
    console.warn('Skipping save due to unavailable local storage');
    return false;
  }

  try {
    localStorage.setItem('paperPlannerData', JSON.stringify(userInputs));
    localStorage.setItem('paperPlannerChat', JSON.stringify(chatMessages || {}));
    return true;
  } catch (error) {
    console.error('Error saving progress:', error);
    return false;
  }
};

/**
 * Safely loads data from localStorage with error handling
 * @returns {object} - An object containing loadedInputs and loadedChat
 */
export const loadFromStorage = () => {
  let loadedInputs = null;
  let loadedChat = {}; // Default to empty object

  if (!isStorageAvailable()) {
    console.warn('Skipping load due to unavailable local storage');
    return { loadedInputs, loadedChat };
  }

  try {
    const savedInputsString = localStorage.getItem('paperPlannerData');
    const savedChatString = localStorage.getItem('paperPlannerChat');

    if (savedInputsString) {
      loadedInputs = JSON.parse(savedInputsString);
    }

    if (savedChatString) {
      const parsedChat = JSON.parse(savedChatString);
      if (typeof parsedChat === 'object' && parsedChat !== null) {
          loadedChat = parsedChat;
      }
    }
  } catch (error) {
    console.error('[storageService] Error loading progress from storage:', error);
    loadedInputs = null;
    loadedChat = {};
  }

  return { loadedInputs, loadedChat };
};

/**
 * Safely clears localStorage data with error handling
 * @returns {boolean} - Success indicator
 */
export const clearStorage = () => {
  if (!isStorageAvailable()) {
    console.warn('Skipping clear due to unavailable local storage');
    return false;
  }

  try {
    localStorage.removeItem('paperPlannerData');
    localStorage.removeItem('paperPlannerChat');
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
};
