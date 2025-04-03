/**
 * Storage service for handling localStorage operations
 * UPDATED: loadFromStorage now correctly merges, prioritizing non-empty/non-placeholder saved data.
 */
import sectionContent from '../data/sectionContent.json'; // Import section data for placeholders

// Helper function to create initial state from placeholders
const createInitialInputs = () => {
  const initialInputs = {};
  if (sectionContent && Array.isArray(sectionContent.sections)) {
    sectionContent.sections.forEach(section => {
      if (section && section.id) {
        initialInputs[section.id] = section.placeholder || '';
      }
    });
  } else {
     console.error("Failed to load sectionContent or sections array is missing.");
     const fallbackSections = ['question', 'hypothesis', 'experiment', 'analysis', 'process', 'abstract'];
     fallbackSections.forEach(id => { initialInputs[id] = ''; });
  }
  return initialInputs;
};


export const saveToStorage = (userInputs, chatMessages) => {
  try {
    localStorage.setItem('paperPlannerData', JSON.stringify(userInputs));
    // Ensure chatMessages being saved is an array or object, not undefined/null
    localStorage.setItem('paperPlannerChat', JSON.stringify(chatMessages || {}));
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
  let loadedChat = {}; // Use object for chat messages keyed by section
  let dataWasLoaded = false;

  try {
    const savedInputsString = localStorage.getItem('paperPlannerData');
    const savedChatString = localStorage.getItem('paperPlannerChat');

    if (savedInputsString) {
      loadedInputs = JSON.parse(savedInputsString);
      dataWasLoaded = true;
       console.log("Loaded inputs from storage:", loadedInputs);
    } else {
        console.log("No saved inputs found in storage.");
    }

    if (savedChatString) {
      loadedChat = JSON.parse(savedChatString);
       // Ensure loadedChat is an object; if not (e.g., old array format), reset or migrate
      if (typeof loadedChat !== 'object' || loadedChat === null || Array.isArray(loadedChat)) {
          console.warn("Loaded chat messages were not in the expected object format. Resetting chat.");
          loadedChat = {};
      } else {
          console.log("Loaded chat from storage:", loadedChat);
      }
    } else {
        console.log("No saved chat found in storage.");
    }

    // *** FIX: Smart merge logic ***
    const finalInputs = {};
    Object.keys(initialInputs).forEach(sectionId => {
      const initialValue = initialInputs[sectionId];
      const loadedValue = loadedInputs[sectionId];

      // Use loaded value ONLY if it exists and is different from the placeholder AND not just empty space
      if (loadedValue !== undefined && loadedValue !== null && String(loadedValue).trim() !== '' && loadedValue !== initialValue) {
        finalInputs[sectionId] = loadedValue;
      } else {
        finalInputs[sectionId] = initialValue; // Otherwise, use the placeholder
      }
    });

    console.log("Final merged inputs being set:", finalInputs);
    setUserInputs(finalInputs); // Set the carefully merged state

    // Initialize chat messages for all sections if they don't exist in loaded data
    const finalChat = { ...loadedChat };
     if (sectionContent && Array.isArray(sectionContent.sections)) {
        sectionContent.sections.forEach(section => {
            if (section && section.id && !finalChat[section.id]) {
                finalChat[section.id] = []; // Ensure array exists for each section
            }
        });
    }
    setChatMessages(finalChat);


    return dataWasLoaded;

  } catch (error) {
    console.error('Error loading progress:', error);
    // On error, set initial state
    setUserInputs(initialInputs);
    setChatMessages(createInitialInputs()); // Use helper to create empty chat structure too maybe?
    return false;
  }
};


export const clearStorage = () => {
  localStorage.removeItem('paperPlannerData');
  localStorage.removeItem('paperPlannerChat');
   console.log("Cleared storage.");
};
