/**
 * Storage service for handling localStorage operations
 * UPDATED: loadFromStorage now simply returns parsed data or nulls.
 */
import sectionContent from '../data/sectionContent.json';

// Keep createInitialInputs helper if it's defined here, or ensure it's accessible where needed.
// For consistency, let's assume it's defined in the hook now.

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
 * @returns {object} - An object containing loadedInputs (or null) and loadedChat (or null).
 */
export const loadFromStorage = () => {
  let loadedInputs = null;
  let loadedChat = null;

  try {
    const savedInputsString = localStorage.getItem('paperPlannerData');
    const savedChatString = localStorage.getItem('paperPlannerChat');

    if (savedInputsString) {
      loadedInputs = JSON.parse(savedInputsString);
      console.log("Loaded inputs from storage:", loadedInputs);
    } else {
      console.log("No saved inputs found in storage.");
    }

    if (savedChatString) {
      loadedChat = JSON.parse(savedChatString);
      if (typeof loadedChat !== 'object' || loadedChat === null) { // Allow array or object for chat for now
          console.warn("Loaded chat messages might not be in the expected object format.", loadedChat);
          // Handle migration or default if necessary, setting to null for now if invalid
          if(Array.isArray(loadedChat) && loadedChat.length === 0) loadedChat = {}; // Convert empty array to empty object
          else if (!Array.isArray(loadedChat) && typeof loadedChat !== 'object') loadedChat = null;
      }
      console.log("Loaded chat from storage:", loadedChat);

    } else {
      console.log("No saved chat found in storage.");
    }

  } catch (error) {
    console.error('Error loading progress from storage:', error);
    // Return nulls on error
    loadedInputs = null;
    loadedChat = null;
  }

  return { loadedInputs, loadedChat }; // Return whatever was found (or null)
};


export const clearStorage = () => {
  localStorage.removeItem('paperPlannerData');
  localStorage.removeItem('paperPlannerChat');
   console.log("Cleared storage.");
};
