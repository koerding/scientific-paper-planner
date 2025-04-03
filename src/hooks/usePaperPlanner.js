import { useState, useEffect, useCallback } from 'react';
import { saveToStorage, loadFromStorage, clearStorage } from '../services/storageService';
import { callOpenAI } from '../services/openaiService';
import sectionContent from '../data/sectionContent.json';

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
     const fallbackSections = ['question', 'hypothesis', 'experiment', 'analysis', 'process', 'abstract'];
     fallbackSections.forEach(id => { initialInputs[id] = ''; });
  }
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
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false); // Flag to prevent immediate save

  // Load saved data ONCE on mount and merge carefully
  useEffect(() => {
    const { loadedInputs, loadedChat } = loadFromStorage();
    const initialPlaceholders = createInitialInputs(); // Get placeholders again for comparison
    const finalInputs = { ...initialPlaceholders }; // Start with placeholders
    let inputsChanged = false;

    // Merge loaded inputs onto placeholders if they exist and differ meaningfully
    if (loadedInputs && typeof loadedInputs === 'object') {
      for (const sectionId in initialPlaceholders) { // Iterate through expected sections
        if (loadedInputs.hasOwnProperty(sectionId)) {
          const loadedValue = loadedInputs[sectionId];
          const placeholderValue = initialPlaceholders[sectionId];
          // Use loaded value only if it's not null/undefined AND different from the placeholder
          if (loadedValue !== undefined && loadedValue !== null && loadedValue !== placeholderValue) {
            finalInputs[sectionId] = loadedValue;
            inputsChanged = true;
          }
        }
      }
    }

    // Only set state if the merged result is different from initial placeholders
    // Or if simply loading occurred (to ensure consistency even if data matches placeholders)
     setUserInputs(finalInputs);


     // Merge chat messages
     const finalChat = createInitialChatMessages(); // Start with empty structure
     if (loadedChat && typeof loadedChat === 'object') {
        for (const sectionId in loadedChat) {
            if (loadedChat.hasOwnProperty(sectionId) && Array.isArray(loadedChat[sectionId])) {
                finalChat[sectionId] = loadedChat[sectionId];
            }
        }
     }
     setChatMessages(finalChat);
     setIsInitialLoadComplete(true); // Signal that loading is done

  }, []); // Empty dependency array ensures this runs only once on mount


  // Save progress whenever userInputs or chatMessages change, *after* initial load
  useEffect(() => {
    if (isInitialLoadComplete) { // Only save after the initial load/merge effect has run
        saveToStorage(userInputs, chatMessages);
    }
  }, [userInputs, chatMessages, isInitialLoadComplete]); // Depend on the flag

  // --- Handlers ---
  const handleInputChange = useCallback((sectionId, value) => {
    setUserInputs(prevInputs => ({
      ...prevInputs,
      [sectionId]: value
    }));
  }, []);

  const handleSectionChange = useCallback((sectionId) => {
    setCurrentSection(sectionId);
  }, []);

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
      const contentToReview = userInputs[sectionId];
      const currentSectionObj = sectionContent.sections.find(s => s.id === sectionId);
      const aiInstructions = currentSectionObj?.llmInstructions;
      if (!contentToReview || !aiInstructions) return;
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
    setUserInputs(createInitialInputs()); // Reset state to initial placeholders
    setChatMessages(createInitialChatMessages()); // Reset chat
    setCurrentSection('question');
    setShowConfirmDialog(false);
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
