/**
 * Storage service for handling localStorage operations
 * UPDATED: loadFromStorage now simply returns parsed data or nulls. Merging happens in the hook.
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
 * @returns {object} - An object containing loadedInputs (parsed object or null) and loadedChat (parsed object or null).
 */
export const loadFromStorage = () => {
  let loadedInputs = null;
  let loadedChat = null; // Keep as object keyed by section ID

  try {
    const savedInputsString = localStorage.getItem('paperPlannerData');
    const savedChatString = localStorage.getItem('paperPlannerChat');

    if (savedInputsString) {
      loadedInputs = JSON.parse(savedInputsString);
      console.log("[storageService] Loaded inputs from storage:", loadedInputs);
    } else {
      console.log("[storageService] No saved inputs found in storage.");
    }

    if (savedChatString) {
      loadedChat = JSON.parse(savedChatString);
      // Ensure it's an object; reset if invalid format found
      if (typeof loadedChat !== 'object' || loadedChat === null || Array.isArray(loadedChat)) {
          console.warn("[storageService] Loaded chat messages were not in the expected object format. Resetting chat.");
          loadedChat = {};
      } else {
          console.log("[storageService] Loaded chat from storage:", loadedChat);
      }
    } else {
        console.log("[storageService] No saved chat found in storage.");
        loadedChat = {}; // Ensure it's an empty object if nothing is loaded
    }

  } catch (error) {
    console.error('[storageService] Error loading progress from storage:', error);
    loadedInputs = null; // Ensure nulls on error
    loadedChat = {};
  }

  return { loadedInputs, loadedChat }; // Return whatever was found (or null/empty object)
};


export const clearStorage = () => {
  localStorage.removeItem('paperPlannerData');
  localStorage.removeItem('paperPlannerChat');
   console.log("[storageService] Cleared storage.");
};

// Removed createInitialInputs from here; it belongs in the hook using it.
