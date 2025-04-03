/**
 * Storage service for handling localStorage operations
 * loadFromStorage simply returns parsed data or nulls. Merging happens in the hook.
 */

export const saveToStorage = (userInputs, chatMessages) => {
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
 * Load user inputs and chat messages from localStorage.
 * @returns {object} - An object containing loadedInputs (parsed object or null) and loadedChat (parsed object or {}).
 */
export const loadFromStorage = () => {
  let loadedInputs = null;
  let loadedChat = {}; // Default to empty object

  try {
    const savedInputsString = localStorage.getItem('paperPlannerData');
    const savedChatString = localStorage.getItem('paperPlannerChat');

    if (savedInputsString) {
      loadedInputs = JSON.parse(savedInputsString);
    }

    if (savedChatString) {
      const parsedChat = JSON.parse(savedChatString);
      // Ensure loadedChat is an object
      if (typeof parsedChat === 'object' && parsedChat !== null) {
          loadedChat = parsedChat;
      }
    }

  } catch (error) {
    console.error('[storageService] Error loading progress from storage:', error);
    loadedInputs = null; // Reset on error
    loadedChat = {};
  }

  return { loadedInputs, loadedChat };
};


export const clearStorage = () => {
  localStorage.removeItem('paperPlannerData');
  localStorage.removeItem('paperPlannerChat');
};
