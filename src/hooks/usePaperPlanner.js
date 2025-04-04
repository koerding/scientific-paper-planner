import { useState, useEffect, useCallback } from 'react';
// Correct the import path here:
import { saveToStorage, loadFromStorage, clearStorage } from '../services/storageService';
import { callOpenAI } from '../services/openaiService';
import sectionContent from '../data/sectionContent.json';
import { validateProjectData } from '../../utils/exportUtils'; // Added for loadProject validation
import { exportProject as exportProjectFunction } from '../../utils/exportUtils'; // Ensure export is imported

// Helper function to create the initial state, INCLUDING loading from storage
const getInitialState = () => {
  const initialContent = {};
  const initialChat = {};

  // Define base structure and fill with initial content from placeholders
  if (sectionContent && Array.isArray(sectionContent.sections)) {
    sectionContent.sections.forEach(section => {
      if (section && section.id) {
        // Use placeholder as initial content
        initialContent[section.id] = section.placeholder || '';
        initialChat[section.id] = []; // Initialize chat array
      }
    });
  } else {
     // Fallback if JSON fails
     console.error("Failed to load sectionContent for initial state.");
     const fallbackSections = ['question', 'hypothesis', 'experiment', 'analysis', 'process', 'abstract'];
     fallbackSections.forEach(id => {
         initialContent[id] = '';
         initialChat[id] = [];
     });
  }

  // --- Load from storage and merge ---
  const { loadedInputs, loadedChat } = loadFromStorage(); // Use the simplified load function

  // Merge Inputs - ONLY if user has saved content that's different from the template
  const finalInputs = { ...initialContent }; // Start with template content
  if (loadedInputs && typeof loadedInputs === 'object') {
    for (const sectionId in initialContent) {
      if (loadedInputs.hasOwnProperty(sectionId)) {
        const loadedValue = loadedInputs[sectionId];
        const templateValue = initialContent[sectionId];
        // Only use saved value if it exists and is different from the template
        if (loadedValue !== undefined && loadedValue !== null && loadedValue !== templateValue) {
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

  return { initialUserInputs: finalInputs, initialChatMessages: finalChat, initialTemplates: initialContent }; // Also return initial templates
};


const usePaperPlanner = () => {
  // Initialize state directly using the combined load/merge function result
  const [{ initialUserInputs, initialChatMessages, initialTemplates }] = useState(getInitialState); // Destructure initialTemplates

  const [userInputs, setUserInputs] = useState(initialUserInputs);
  const [chatMessages, setChatMessages] = useState(initialChatMessages);

  // Other states
  const [currentSection, setCurrentSection] = useState(sectionContent?.sections?.[0]?.id || 'question'); // Safer initial section
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showExamplesDialog, setShowExamplesDialog] = useState(false); // State for examples dialog
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

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
    // Ensure the section exists in chatMessages before trying to spread it
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
           [currentSection]: [...(prevMessages[currentSection] || []), newAssistantMessage] // Ensure array exists
       }));
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = { role: 'assistant', content: `Sorry, there was an error processing your message. (${error.message})` };
       setChatMessages(prevMessages => ({
           ...prevMessages,
           [currentSection]: [...(prevMessages[currentSection] || []), errorMessage] // Ensure array exists
       }));
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
    setChatMessages(prevMessages => ({
        ...prevMessages,
        [sectionId]: [...(prevMessages[sectionId] || []), displayMessage] // Ensure array exists
    }));
    try {
      const sectionsForContext = sectionContent?.sections || [];
      const response = await callOpenAI(reviewPrompt, sectionId, userInputs, sectionsForContext);
      const newAssistantMessage = { role: 'assistant', content: response };
      setChatMessages(prevMessages => ({
          ...prevMessages,
          [sectionId]: [...(prevMessages[sectionId] || []), newAssistantMessage] // Ensure array exists
      }));
    } catch (error) {
      console.error(`Error getting review for ${sectionId}:`, error);
      const errorMessage = { role: 'assistant', content: `Sorry, there was an error reviewing the ${sectionId} section. (${error.message})` };
      setChatMessages(prevMessages => ({
          ...prevMessages,
          [sectionId]: [...(prevMessages[sectionId] || []), errorMessage] // Ensure array exists
      }));
    } finally {
      setLoading(false);
    }
  }, [userInputs]);


  // Reset project function - now resets to the template content
  const resetProject = useCallback(() => {
    clearStorage();
    setUserInputs(initialTemplates); // Use initialTemplates from state

    // Clear chat messages
    const emptyChat = {};
    sectionContent.sections.forEach(section => {
      if (section && section.id) {
        emptyChat[section.id] = [];
      }
    });
    setChatMessages(emptyChat);
    setCurrentSection(sectionContent?.sections?.[0]?.id || 'question'); // Reset to first section safely
    setShowConfirmDialog(false);
  }, [initialTemplates]); // Depend on initialTemplates

  const exportProject = useCallback(() => {
    exportProjectFunction(userInputs, chatMessages, sectionContent); // Use imported function
  }, [userInputs, chatMessages]);

   // Function to load project from imported JSON file
   const loadProject = useCallback((data) => {
    if (!validateProjectData(data)) {
      alert("Invalid project file format. Please select a valid project file.");
      return;
    }

    // Confirm before loading (optional, but good practice)
    if (window.confirm("Loading this project will replace your current work. Are you sure you want to continue?")) {
      try {
        // Load user inputs, ensuring we keep template values for any missing sections
        const mergedInputs = {...initialTemplates}; // Use initialTemplates from state
        Object.keys(data.userInputs).forEach(sectionId => {
            // Check if the sectionId actually exists in our current template structure
            if (mergedInputs.hasOwnProperty(sectionId)) {
                const loadedValue = data.userInputs[sectionId];
                // Only load if it's a non-empty string
                if (loadedValue && typeof loadedValue === 'string' && loadedValue.trim() !== '') {
                    mergedInputs[sectionId] = loadedValue;
                }
            }
        });
        setUserInputs(mergedInputs);

        // Load chat messages, ensuring we have empty arrays for any missing sections
        const mergedChat = {};
        (sectionContent?.sections || []).forEach(section => {
          if (section && section.id) {
            mergedChat[section.id] = (data.chatMessages && Array.isArray(data.chatMessages[section.id]))
                                     ? data.chatMessages[section.id]
                                     : [];
          }
        });
        setChatMessages(mergedChat);

        // Explicitly save to storage after loading
        saveToStorage(mergedInputs, mergedChat);

        setCurrentSection(sectionContent?.sections?.[0]?.id || 'question'); // Reset to first section safely

        alert("Project loaded successfully!");
      } catch (error) {
        console.error("Error loading project:", error);
        alert("Error loading project. Please try again.");
      }
    }
  }, [initialTemplates]); // Depend on initialTemplates

  // Return all state and handlers needed by the components
  return {
    userInputs,
    chatMessages,
    currentSection,
    currentMessage,
    loading,
    showConfirmDialog,
    showExamplesDialog, // Expose examples dialog state
    setChatMessages,
    setUserInputs,
    setCurrentMessage,
    setShowConfirmDialog,
    setShowExamplesDialog, // Expose examples dialog setter
    handleSectionChange,
    handleInputChange,
    handleSendMessage,
    handleFirstVersionFinished,
    resetProject,
    exportProject,
    loadProject,
  };
};

export default usePaperPlanner;
