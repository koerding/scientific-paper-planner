import { useState, useEffect, useCallback } from 'react';
import { saveToStorage, loadFromStorage, clearStorage } from '../services/storageService';
import { callOpenAI } from '../services/openaiService';
import sectionContent from '../data/sectionContent.json'; // Import section data

// Helper function to create initial state from placeholders
const createInitialInputs = () => {
  const initialInputs = {};
  console.log("[createInitialInputs] Starting..."); // Log start
  if (sectionContent && Array.isArray(sectionContent.sections)) {
    sectionContent.sections.forEach(section => {
      if (section && section.id) {
        initialInputs[section.id] = section.placeholder || '';
      }
    });
  } else {
     console.error("[createInitialInputs] Failed to load sectionContent or sections array is missing.");
     const fallbackSections = ['question', 'hypothesis', 'experiment', 'analysis', 'process', 'abstract'];
     fallbackSections.forEach(id => { initialInputs[id] = ''; });
  }
  // *** DEBUG LOG: Log the created initial state ***
  console.log("[createInitialInputs] Created initial inputs:", JSON.stringify(initialInputs));
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
    // console.log("[usePaperPlanner] Created initial chat messages structure:", initialChat);
    return initialChat;
}


const usePaperPlanner = () => {
  // Initialize state using the placeholder creation function directly
  // Add log right after initialization if needed: console.log('Initial userInputs state:', userInputs); but useState functional init makes this tricky.
  const [userInputs, setUserInputs] = useState(createInitialInputs);
  const [chatMessages, setChatMessages] = useState(createInitialChatMessages);

  // Other states
  const [currentSection, setCurrentSection] = useState('question');
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Load saved data ONCE on mount and merge carefully
  useEffect(() => {
    console.log("[Effect Load] Attempting to load from storage on mount...");
    const { loadedInputs, loadedChat } = loadFromStorage();

    // *** DEBUG LOG: Log what was loaded from storage ***
    console.log("[Effect Load] Data returned from loadFromStorage:", { loadedInputs, loadedChat });

    // Update inputs state based on loaded data
    if (loadedInputs && typeof loadedInputs === 'object' && Object.keys(loadedInputs).length > 0) {
      console.log("[Effect Load] Found loadedInputs, attempting merge...");
      setUserInputs(prevInputs => {
        // *** DEBUG LOG: Log the state BEFORE merging ***
        console.log("[Effect Load - setUserInputs] State BEFORE merge (prevInputs):", JSON.stringify(prevInputs));

        const mergedInputs = { ...prevInputs };
        let updatesMade = false;
        for (const sectionId in loadedInputs) {
          if (loadedInputs.hasOwnProperty(sectionId) && prevInputs.hasOwnProperty(sectionId)) {
            const loadedValue = loadedInputs[sectionId];
            const placeholderValue = prevInputs[sectionId];
            if (loadedValue !== undefined && loadedValue !== null && String(loadedValue).trim() !== '' && loadedValue !== placeholderValue) {
              mergedInputs[sectionId] = loadedValue;
              updatesMade = true;
               console.log(`[Effect Load - setUserInputs] Merging section ${sectionId} with saved value.`);
            } else {
               console.log(`[Effect Load - setUserInputs] Keeping placeholder for section ${sectionId}.`);
            }
          }
        }
        if (updatesMade) {
            // *** DEBUG LOG: Log the final state being returned AFTER merging ***
            console.log("[Effect Load - setUserInputs] Returning MERGED state:", JSON.stringify(mergedInputs));
            return mergedInputs;
        } else {
            console.log("[Effect Load - setUserInputs] No meaningful merge updates, returning previous state.");
            return prevInputs;
        }
      });
    } else {
       console.log("[Effect Load] No valid loadedInputs object found, skipping input state update.");
    }

    // Update chat state based on loaded data (ensure initial structure exists)
     setChatMessages(prevChatState => {
         const initialChatStructure = createInitialChatMessages();
         const finalChatState = {...initialChatStructure}; // Start with base structure
         if (loadedChat && typeof loadedChat === 'object' && Object.keys(loadedChat).length > 0) {
             console.log("[Effect Load] Merging loaded chat messages...");
             for(const sectionId in loadedChat) {
                 if(loadedChat.hasOwnProperty(sectionId) && Array.isArray(loadedChat[sectionId])) {
                     finalChatState[sectionId] = loadedChat[sectionId];
                 }
             }
             console.log("[Effect Load] Final merged chat state:", finalChatState);
             return finalChatState;
         } else {
             console.log("[Effect Load] No valid loaded chat found, returning initial chat structure.");
             return initialChatStructure; // Return initial empty structure if nothing valid loaded
         }
     });


  }, []); // Empty dependency array ensures this runs only once on mount


  // Save progress whenever userInputs or chatMessages change
  useEffect(() => {
    // Prevent saving initial empty state immediately after mount before loading finishes
     const timer = setTimeout(() => {
        if (Object.keys(userInputs).length > 0 && Object.values(userInputs).some(v => v !== '')) { // Check if not empty
             saveToStorage(userInputs, chatMessages);
             // console.log("[Effect Save] Saved progress to storage.");
        }
    }, 500); // Small delay to allow initial load/merge
    return () => clearTimeout(timer);

  }, [userInputs, chatMessages]);

  const handleInputChange = useCallback((sectionId, value) => {
    setUserInputs(prevInputs => ({
      ...prevInputs,
      [sectionId]: value
    }));
  }, []);

  const handleSectionChange = useCallback((sectionId) => {
    // console.log(`[usePaperPlanner] Changing current section context to: ${sectionId}`);
    setCurrentSection(sectionId);
  }, []);

  // --- handleSendMessage, handleFirstVersionFinished, resetProject, exportProject remain the same ---
  const handleSendMessage = useCallback(async () => {
     if (!currentMessage.trim() || !currentSection) return;
     const newUserMessage = { role: 'user', content: currentMessage };
     setChatMessages(prevMessages => ({ ...prevMessages, [currentSection]: [...(prevMessages[currentSection] || []), newUserMessage] }));
     setLoading(true);
     const messageToSend = currentMessage;
     setCurrentMessage('');
     try {
       const sectionsForContext = sectionContent?.sections || [];
       const response = await callOpenAI(messageToSend, currentSection, userInputs, sectionsForContext);
       const newAssistantMessage = { role: 'assistant', content: response };
        setChatMessages(prevMessages => ({ ...prevMessages, [currentSection]: [...(prevMessages[currentSection] || []), newAssistantMessage] }));
     } catch (error) {
       console.error("Error sending message:", error);
       const errorMessage = { role: 'assistant', content: `Sorry, there was an error processing your message. (${error.message})` };
        setChatMessages(prevMessages => ({ ...prevMessages, [currentSection]: [...(prevMessages[currentSection] || []), errorMessage] }));
     } finally {
       setLoading(false);
     }
  }, [currentMessage, currentSection, userInputs]);

   const handleFirstVersionFinished = useCallback(async (sectionId) => {
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
       setChatMessages(prevMessages => ({ ...prevMessages, [sectionId]: [...(prevMessages[sectionId] || []), displayMessage] }));
      try {
         const sectionsForContext = sectionContent?.sections || [];
         const response = await callOpenAI(reviewPrompt, sectionId, userInputs, sectionsForContext);
         const newAssistantMessage = { role: 'assistant', content: response };
         setChatMessages(prevMessages => ({ ...prevMessages, [sectionId]: [...(prevMessages[sectionId] || []), newAssistantMessage] }));
      } catch (error) {
         console.error(`Error getting review for ${sectionId}:`, error);
         const errorMessage = { role: 'assistant', content: `Sorry, there was an error reviewing the ${sectionId} section. (${error.message})` };
          setChatMessages(prevMessages => ({ ...prevMessages, [sectionId]: [...(prevMessages[sectionId] || []), errorMessage] }));
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
