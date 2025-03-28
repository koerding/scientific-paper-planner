/**
 * Storage service for handling localStorage operations
 */

/**
 * Save user inputs and chat messages to localStorage
 * @param {Object} userInputs - The user inputs to save
 * @param {Object} chatMessages - The chat messages to save
 * @returns {boolean} - True if saved successfully, false otherwise
 */
export const saveToStorage = (userInputs, chatMessages) => {
  try {
    localStorage.setItem('paperPlannerData', JSON.stringify(userInputs));
    localStorage.setItem('paperPlannerChat', JSON.stringify(chatMessages));
    return true;
  } catch (error) {
    console.error('Error saving progress:', error);
    return false;
  }
};

/**
 * Load user inputs and chat messages from localStorage
 * @param {Function} setUserInputs - Function to set user inputs
 * @param {Function} setChatMessages - Function to set chat messages
 * @returns {boolean} - True if data was loaded, false otherwise
 */
export const loadFromStorage = (setUserInputs, setChatMessages) => {
  try {
    const savedInputs = localStorage.getItem('paperPlannerData');
    const savedChat = localStorage.getItem('paperPlannerChat');
    
    if (savedInputs) {
      setUserInputs(JSON.parse(savedInputs));
    }
    
    if (savedChat) {
      setChatMessages(JSON.parse(savedChat));
    }
    
    return !!savedInputs;
  } catch (error) {
    console.error('Error loading progress:', error);
    return false;
  }
};

/**
 * Clear storage (for new project)
 */
export const clearStorage = () => {
  localStorage.removeItem('paperPlannerData');
  localStorage.removeItem('paperPlannerChat');
};
