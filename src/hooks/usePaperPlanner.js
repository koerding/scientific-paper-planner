import { useState, useEffect, useCallback } from 'react';
import { saveToStorage, loadFromStorage, clearStorage } from '../services/storageService';
import { callOpenAI } from '../services/openaiService';
import sectionContent from '../data/sectionContent.json'; // Import section data

// Helper function to create initial state from placeholders - Moved here
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
  console.log("[usePaperPlanner] Created initial inputs:", initialInputs);
  return initialInputs;
};

// Helper function to create initial chat state
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
  // Initialize state using the placeholders from sectionContent.json
  const [userInputs, setUserInputs] = useState(createInitialInputs);
  const [chatMessages, setChatMessages] = useState(createInitialChatMessages); // Initialize chat state structure

  // Existing states
  const [currentSection, setCurrentSection] = useState('question'); // Tracks context for chat/AI
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false); // Maybe separate loading states later
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Load saved data on initial mount and merge it
  useEffect(() => {
    console.log("[usePaperPlanner Effect] Attempting to load from storage...");
    const { loadedInputs, loadedChat } = loadFromStorage();

    // Merge loaded inputs onto the initial placeholder state
    if (loadedInputs) {
      setUserInputs(prevInputs => {
        const mergedInputs = { ...prevInputs }; // Start with placeholder state
        for (const sectionId in loadedInputs) {
          // Only overwrite placeholder if loaded data is not null/undefined
          // and potentially check if it's different from the initial placeholder if desired
          if (loadedInputs.hasOwnProperty(sectionId) && loadedInputs[sectionId] !== undefined && loadedInputs[sectionId] !== null) {
            // If you want to avoid overwriting with empty strings from storage:
            // if (String(loadedInputs[sectionId]).trim() !== '') {
            //    mergedInputs[sectionId] = loadedInputs[sectionId];
            // }
            // For now, let's just merge whatever is saved:
            mergedInputs[sectionId] = loadedInputs[sectionId];
          }
        }
        console.log("[usePaperPlanner Effect] Merged loaded inputs:", mergedInputs);
        return mergedInputs;
      });
    } else {
       console.log("[usePaperPlanner Effect] No inputs loaded, keeping initial placeholder state.");
       // Ensure state is set to initial if load fails completely (though useState does this)
       setUserInputs(createInitialInputs());
    }

    // Merge loaded chat messages
    if (loadedChat) {
        setChatMessages(prevChat => {
            const mergedChat = { ...prevChat }; // Start with initial structure
            for (const sectionId in loadedChat) {
                if (loadedChat.hasOwnProperty(sectionId) && Array.isArray(loadedChat[sectionId])) {
                     mergedChat[sectionId] = loadedChat[sectionId];
                }
            }
            console.log("[usePaperPlanner Effect] Merged loaded chat messages:", mergedChat);
            return mergedChat;
        });
    } else {
         console.log("[usePaperPlanner Effect] No chat loaded, keeping initial chat state.");
         setChatMessages(createInitialChatMessages());
    }

  }, []); // Empty dependency array ensures this runs only once on mount


  // Save progress whenever userInputs or chatMessages change
  useEffect(() => {
    saveToStorage(userInputs, chatMessages);
    console.log("[usePaperPlanner Effect] Saved progress to storage.");
  }, [userInputs, chatMessages]);

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
    if (!currentMessage.trim() || !currentSection) return;

    const newUserMessage = { role: 'user', content: currentMessage };
    // Add to the correct section's chat array
    setChatMessages(prevMessages => ({
        ...prevMessages,
        [currentSection]: [...(prevMessages[currentSection] || []), newUserMessage]
    }));

    setLoading(true);
    const messageToSend = currentMessage; // Capture message before clearing
    setCurrentMessage(''); // Clear input field immediately

    try {
      const sectionsForContext = sectionContent?.sections || [];
      const response = await callOpenAI(
          messageToSend, // Use captured message
          currentSection,
          userInputs,
          sectionsForContext
      );
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


  // Function called when user marks a section as 'First version finished'
  const handleFirstVersionFinished = useCallback(async (sectionId) => {
     console.log(`First version finished for section: ${sectionId}`);
     const contentToReview = userInputs[sectionId];
     const currentSectionObj = sectionContent.sections.find(s => s.id === sectionId);
     const aiInstructions = currentSectionObj?.llmInstructions; // Get LLM instructions for context

     if (!contentToReview || !aiInstructions) {
         console.warn(`No content or LLM instructions found for section ${sectionId}. Cannot request review.`);
         return;
     }

     setLoading(true);

     // Use the predefined LLM instructions as the prompt
     const reviewPrompt = aiInstructions;

     // Add a user message to the chat indicating the action (optional, for UI clarity)
      const displayMessage = { role: 'user', content: `Requesting review for ${currentSectionObj.title}...` };
      setChatMessages(prevMessages => ({
           ...prevMessages,
           [sectionId]: [...(prevMessages[sectionId] || []), displayMessage]
       }));


     try {
        const sectionsForContext = sectionContent?.sections || [];
        const response = await callOpenAI(
            reviewPrompt, // Send the LLM instructions as the main prompt
            sectionId,
            userInputs, // Send all user inputs for context
            sectionsForContext
        );
        const newAssistantMessage = { role: 'assistant', content: response };
        setChatMessages(prevMessages => ({
            ...prevMessages,
            [sectionId]: [...(prevMessages[sectionId] || []), newAssistantMessage] // Add response to the correct section
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
  }, [userInputs]); // Dependency on userInputs


  // Reset project function
  const resetProject = useCallback(() => {
    clearStorage();
    setUserInputs(createInitialInputs()); // Reset state to initial placeholders
    setChatMessages(createInitialChatMessages()); // Reset chat
    setCurrentSection('question');
    setShowConfirmDialog(false);
    console.log("Project reset to initial state.");
  }, []);

  // Export functionality
  const exportProject = useCallback(() => {
    import('../../utils/exportUtils').then(module => {
      // Pass sectionContent to get section titles if needed by export function
      module.exportProject(userInputs, chatMessages, sectionContent);
    }).catch(err => console.error("Failed to load or run export:", err));
  }, [userInputs, chatMessages]); // Depend on data to be exported


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
