import { useState, useEffect, useCallback } from 'react';
import { saveToStorage, loadFromStorage, clearStorage } from '../services/storageService';
import { callOpenAI } from '../services/openaiService';
import sectionContent from '../data/sectionContent.json';

// Helper function to create the initial state, INCLUDING loading from storage
const getInitialState = () => {
  const initialPlaceholders = {};
  const initialChat = {};

  // Define base structure and placeholders
  if (sectionContent && Array.isArray(sectionContent.sections)) {
    sectionContent.sections.forEach(section => {
      if (section && section.id) {
        initialPlaceholders[section.id] = section.placeholder || '';
        initialChat[section.id] = []; // Initialize chat array
      }
    });
  } else {
     // Fallback if JSON fails
     console.error("Failed to load sectionContent for initial state.");
     const fallbackSections = ['question', 'hypothesis', 'experiment', 'analysis', 'process', 'abstract'];
     fallbackSections.forEach(id => {
         initialPlaceholders[id] = '';
         initialChat[id] = [];
     });
  }

  // --- Load from storage and merge ---
  const { loadedInputs, loadedChat } = loadFromStorage(); // Use the simplified load function

  // Merge Inputs
  const finalInputs = { ...initialPlaceholders }; // Start with placeholders
  if (loadedInputs && typeof loadedInputs === 'object') {
    for (const sectionId in initialPlaceholders) {
      if (loadedInputs.hasOwnProperty(sectionId)) {
        const loadedValue = loadedInputs[sectionId];
        const placeholderValue = initialPlaceholders[sectionId];
        // Use saved value only if it exists, isn't just whitespace, and differs from placeholder
        if (loadedValue !== undefined && loadedValue !== null && String(loadedValue).trim() !== '' && loadedValue !== placeholderValue) {
          finalInputs[sectionId] = loadedValue;
        }
      }
    }
  }

  // Merge Chat
   const finalChat = { ...initialChat };
   if (loadedChat && typeof loadedChat === 'object') {
       for (const sectionId in loadedChat) {
           if (loadedChat.hasOwnProperty(sectionId) && Array.isArray(loadedChat[sectionId])) {
               finalChat[sectionId] = loadedChat[sectionId];
           }
       }
   }

  return { initialUserInputs: finalInputs, initialChatMessages: finalChat };
};


const usePaperPlanner = () => {
  // Initialize state directly using the combined load/merge function result
  const [{ initialUserInputs, initialChatMessages }] = useState(getInitialState);

  const [userInputs, setUserInputs] = useState(initialUserInputs);
  const [chatMessages, setChatMessages] = useState(initialChatMessages);

  // Other states
  const [currentSection, setCurrentSection] = useState('question');
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false); // Still useful to prevent immediate save

  // Flag initial load as complete after the first render cycle
   useEffect(() => {
       setIsInitialLoadComplete(true);
   }, []);

  // Save progress whenever userInputs or chatMessages change, *after* initial load
  useEffect(() => {
    if (isInitialLoadComplete) {
        saveToStorage(userInputs, chatMessages);
    }
  }, [userInputs, chatMessages, isInitialLoadComplete]);

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

  // Reset project function - now uses the placeholder part of getInitialState logic
  const resetProject = useCallback(() => {
    clearStorage();
    const { initialUserInputs: placeholders, initialChatMessages: emptyChat } = getInitialState(); // Rerun to get defaults
    setUserInputs(placeholders);
    setChatMessages(emptyChat);
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
    setChatMessages, // Exposing setters might not be needed depending on VerticalPaperPlannerApp
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
