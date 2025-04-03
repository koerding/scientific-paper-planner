import { useState, useEffect, useCallback } from 'react';
import { saveToStorage, loadFromStorage, clearStorage } from '../services/storageService';
import { callOpenAI } from '../services/openaiService';
import sectionContent from '../data/sectionContent.json'; // Import section data

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
     console.error("[usePaperPlanner] Failed to load sectionContent or sections array is missing for initial state.");
     // Define fallbacks
     const fallbackSections = ['question', 'hypothesis', 'experiment', 'analysis', 'process', 'abstract'];
     fallbackSections.forEach(id => { initialInputs[id] = ''; });
  }
  console.log("[usePaperPlanner] Created initial inputs:", initialInputs);
  return initialInputs;
};

// Helper function to create initial chat state structure
const createInitialChatMessages = () => {
    const initialChat = {};
     if (sectionContent && Array.isArray(sectionContent.sections)) {
        sectionContent.sections.forEach(section => {
            if (section && section.id) {
                initialChat[section.id] = []; // Array per section
            }
        });
    }
     console.log("[usePaperPlanner] Created initial chat messages structure:", initialChat);
    return initialChat;
}


const usePaperPlanner = () => {
  // Initialize state using the placeholder creation function directly
  const [userInputs, setUserInputs] = useState(createInitialInputs);
  const [chatMessages, setChatMessages] = useState(createInitialChatMessages);

  // Other states
  const [currentSection, setCurrentSection] = useState('question');
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Load saved data ONCE on mount and merge carefully
  useEffect(() => {
    console.log("[usePaperPlanner Effect] Attempting to load from storage on mount...");
    const { loadedInputs, loadedChat } = loadFromStorage();

    // Update inputs state based on loaded data
    if (loadedInputs) {
      // Use functional update to ensure we're merging with the initial state
      setUserInputs(prevInitialInputs => {
        const mergedInputs = { ...prevInitialInputs }; // Start with initial placeholder state
        console.log("[usePaperPlanner Effect] Merging loaded data onto initial state...");
        let updatesMade = false;
        for (const sectionId in loadedInputs) {
          if (loadedInputs.hasOwnProperty(sectionId) && prevInitialInputs.hasOwnProperty(sectionId)) {
            const loadedValue = loadedInputs[sectionId];
            const placeholderValue = prevInitialInputs[sectionId];
            // Only overwrite placeholder if loaded value exists, is not just whitespace, AND is different from the placeholder
            if (loadedValue !== undefined && loadedValue !== null && String(loadedValue).trim() !== '' && loadedValue !== placeholderValue) {
              mergedInputs[sectionId] = loadedValue;
              updatesMade = true;
              // console.log(`[usePaperPlanner Effect] Merged section ${sectionId} with saved value.`);
            } else {
              // console.log(`[usePaperPlanner Effect] Kept placeholder for section ${sectionId}.`);
            }
          }
        }
        if (updatesMade) {
            console.log("[usePaperPlanner Effect] Final merged inputs state:", mergedInputs);
            return mergedInputs; // Return the merged state
        } else {
            console.log("[usePaperPlanner Effect] No meaningful saved inputs found to merge, keeping initial state.");
            return prevInitialInputs; // Return the initial state if no meaningful updates
        }
      });
    } else {
       console.log("[usePaperPlanner Effect] No saved inputs object found, keeping initial state.");
       // State already initialized with placeholders, do nothing
    }

    // Update chat state based on loaded data
    if (loadedChat) {
        setChatMessages(prevInitialChat => {
             const mergedChat = { ...prevInitialChat }; // Start with initial structure
             let chatUpdatesMade = false;
             for (const sectionId in loadedChat) {
                 if (loadedChat.hasOwnProperty(sectionId) && Array.isArray(loadedChat[sectionId]) && loadedChat[sectionId].length > 0) {
                     mergedChat[sectionId] = loadedChat[sectionId];
                     chatUpdatesMade = true;
                 }
             }
             if(chatUpdatesMade){
                 console.log("[usePaperPlanner Effect] Merged loaded chat messages:", mergedChat);
                 return mergedChat;
             } else {
                 console.log("[usePaperPlanner Effect] No meaningful saved chat found, keeping initial state.");
                 return prevInitialChat;
             }
        });
    } else {
        console.log("[usePaperPlanner Effect] No saved chat object found, keeping initial chat state.");
        // State already initialized, do nothing
    }

  }, []); // Empty dependency array ensures this runs only once on mount


  // Save progress whenever userInputs or chatMessages change
  useEffect(() => {
    // Add a check to prevent saving immediately after initial load/merge if desired,
    // but generally saving on every change is fine.
    if (Object.keys(userInputs).length > 0) { // Simple check to avoid saving empty initial state if error occurs
        saveToStorage(userInputs, chatMessages);
       // console.log("[usePaperPlanner Effect] Saved progress to storage."); // Can be noisy
    }
  }, [userInputs, chatMessages]);

  // Rest of the handlers remain the same...
  const handleInputChange = useCallback((sectionId, value) => {
    setUserInputs(prevInputs => ({
      ...prevInputs,
      [sectionId]: value
    }));
  }, []);

  const handleSectionChange = useCallback((sectionId) => {
    console.log(`[usePaperPlanner] Changing current section context to: ${sectionId}`);
    setCurrentSection(sectionId);
  }, []);

  const handleSendMessage = useCallback(async () => {
    // ... (keep existing handleSendMessage logic) ...
     if (!currentMessage.trim() || !currentSection) return;
     const newUserMessage = { role: 'user', content: currentMessage };
     setChatMessages(prevMessages => ({
         ...prevMessages,
         [currentSection]: [...(prevMessages[currentSection] || []), newUserMessage]
     }));
     setLoading(true);
     const messageToSend = currentMessage;
     setCurrentMessage('');
     try {
       const sectionsForContext = sectionContent?.sections || [];
       const response = await callOpenAI(messageToSend, currentSection, userInputs, sectionsForContext);
       const newAssistantMessage = { role: 'assistant', content: response };
        setChatMessages(prevMessages => ({
            ...prevMessages,
            [currentSection]: [...(prevMessages[currentSection] || []), newAssistantMessage]
        }));
     } catch (error) {
       console.error("Error sending message:", error);
       const errorMessage = { role: 'assistant', content: `Sorry, there was an error processing your message. (${error.message})` };
        setChatMessages(prevMessages => ({
            ...prevMessages,
            [currentSection]: [...(prevMessages[currentSection] || []), errorMessage]
        }));
     } finally {
       setLoading(false);
     }
  }, [currentMessage, currentSection, userInputs]);

  const handleFirstVersionFinished = useCallback(async (sectionId) => {
    // ... (keep existing handleFirstVersionFinished logic) ...
      console.log(`First version finished for section: ${sectionId}`);
      const contentToReview = userInputs[sectionId];
      const currentSectionObj = sectionContent.sections.find(s => s.id === sectionId);
      const aiInstructions = currentSectionObj?.llmInstructions;
      if (!contentToReview || !aiInstructions) {
          console.warn(`No content or LLM instructions found for section ${sectionId}. Cannot request review.`);
          return;
      }
      setLoading(true);
      const reviewPrompt = aiInstructions;
       const displayMessage = { role: 'user', content: `Requesting review for ${currentSectionObj.title}...` };
       setChatMessages(prevMessages => ({
            ...prevMessages,
            [sectionId]: [...(prevMessages[sectionId] || []), displayMessage]
        }));
      try {
         const sectionsForContext = sectionContent?.sections || [];
         const response = await callOpenAI(reviewPrompt, sectionId, userInputs, sectionsForContext);
         const newAssistantMessage = { role: 'assistant', content: response };
         setChatMessages(prevMessages => ({
             ...prevMessages,
             [sectionId]: [...(prevMessages[sectionId] || []), newAssistantMessage]
         }));
      } catch (error) {
         console.error(`Error getting review for ${sectionId}:`, error);
         const errorMessage = { role: 'assistant', content: `Sorry, there was an error reviewing the ${sectionId} section. (${error.message})` };
          setChatMessages(prevMessages => ({
             ...prevMessages,
             [sectionId]: [...(prevMessages[sectionId] || []), errorMessage]
         }));
      } finally {
         setLoading(false);
      }
  }, [userInputs]);

  const resetProject = useCallback(() => {
    clearStorage();
    setUserInputs(createInitialInputs());
    setChatMessages(createInitialChatMessages());
    setCurrentSection('question');
    setShowConfirmDialog(false);
    console.log("Project reset to initial state.");
  }, []);

  const exportProject = useCallback(() => {
    import('../../utils/exportUtils').then(module => {
      module.exportProject(userInputs, chatMessages, sectionContent);
    }).catch(err => console.error("Failed to load or run export:", err));
  }, [userInputs, chatMessages]);


  return {
    userInputs,
    chatMessages,
    currentSection,
    currentMessage,
    loading,
    showConfirmDialog,
    setChatMessages,
    setUserInputs,
    setCurrentMessage,
    setShowConfirmDialog,
    handleSectionChange,
    handleInputChange,
    handleSendMessage,
    handleFirstVersionFinished,
    resetProject,
    exportProject,
  };
};

export default usePaperPlanner;
