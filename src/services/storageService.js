/**
 * Storage service for handling localStorage operations
 * UPDATED: loadFromStorage now merges saved data with initial state.
 */
import sectionContent from '../data/sectionContent.json'; // Import section data for placeholders

// Helper function to create initial state from placeholders (duplicate from hook for safety or import if possible)
const createInitialInputs = () => {
  const initialInputs = {};
  if (sectionContent && Array.isArray(sectionContent.sections)) {
    sectionContent.sections.forEach(section => {
      if (section && section.id) {
        initialInputs[section.id] = section.placeholder || '';
      }
    });
  } else {
     // Define fallbacks if JSON loading fails
     const fallbackSections = ['question', 'hypothesis', 'experiment', 'analysis', 'process', 'abstract'];
     fallbackSections.forEach(id => { initialInputs[id] = ''; });
  }
  return initialInputs;
};


export const saveToStorage = (userInputs, chatMessages) => {
  try {
    // Only save non-placeholder values? Or save everything? Saving everything is simpler.
    localStorage.setItem('paperPlannerData', JSON.stringify(userInputs));
    localStorage.setItem('paperPlannerChat', JSON.stringify(chatMessages));
    return true;
  } catch (error) {
    console.error('Error saving progress:', error);
    return false;
  }
};

/**
 * Load user inputs and chat messages from localStorage, merging with initial placeholders.
 * @param {Function} setUserInputs - Function to set user inputs state
 * @param {Function} setChatMessages - Function to set chat messages state
 */
export const loadFromStorage = (setUserInputs, setChatMessages) => {
  const initialInputs = createInitialInputs(); // Get default state with placeholders
  let loadedInputs = {};
  let loadedChat = [];
  let dataWasLoaded = false;

  try {
    const savedInputsString = localStorage.getItem('paperPlannerData');
    const savedChatString = localStorage.getItem('paperPlannerChat');

    if (savedInputsString) {
      loadedInputs = JSON.parse(savedInputsString);
      dataWasLoaded = true;
       console.log("Loaded inputs from storage:", loadedInputs);
    }

    if (savedChatString) {
      loadedChat = JSON.parse(savedChatString);
      if(!Array.isArray(loadedChat)) loadedChat = []; // Ensure it's an array
       console.log("Loaded chat from storage:", loadedChat);
    }

    // Merge loaded data with initial state (placeholders)
    // This ensures any section *not* in saved data retains its placeholder
    // And any section *in* saved data uses the saved value
    const finalInputs = { ...initialInputs, ...loadedInputs };

    setUserInputs(finalInputs); // Set the merged state
    setChatMessages(loadedChat);

    return dataWasLoaded; // Indicate if user data (not just placeholders) was found

  } catch (error) {
    console.error('Error loading progress:', error);
    // On error, set initial state
    setUserInputs(initialInputs);
    setChatMessages([]);
    return false;
  }
};


export const clearStorage = () => {
  localStorage.removeItem('paperPlannerData');
  localStorage.removeItem('paperPlannerChat');
   console.log("Cleared storage.");
};
