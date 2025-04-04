import { useState, useEffect, useCallback } from 'react';
import { saveToStorage, loadFromStorage, clearStorage } from '../services/storageService';
import { callOpenAI } from '../services/openaiService';
import { importDocumentContent as importDocumentFromFile } from '../services/documentImportService';
import sectionContent from '../data/sectionContent.json';
import { validateProjectData } from '../utils/exportUtils';
import { exportProject as exportProjectFunction } from '../utils/exportUtils';

// Helper function to create the initial state, corrected to prioritize templates
const getInitialState = () => {
  // Create initial content from the placeholders in sectionContent
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

  // --- Check localStorage but DON'T automatically merge with templates ---
  const { loadedInputs, loadedChat } = loadFromStorage();

  // Important: We'll set this flag to determine if we should use localStorage data or templates
  const hasStoredData = loadedInputs && Object.keys(loadedInputs).length > 0;

  return {
    initialUserInputs: initialContent, // Start with clean templates by default
    initialChatMessages: initialChat,
    initialTemplates: initialContent,
    storedInputs: loadedInputs,  // Store but don't automatically use
    storedChat: loadedChat,
    hasStoredData // Flag to know if we have stored data
  };
};

const usePaperPlanner = () => {
  // Get initial state with a single useState call to avoid multiple re-renders
  const [initialState] = useState(getInitialState);

  // Destructure values from the initial state
  const {
    initialUserInputs,
    initialChatMessages,
    initialTemplates,
    storedInputs,
    storedChat,
    hasStoredData
  } = initialState;

  // Start with template values, not stored values
  const [userInputs, setUserInputs] = useState(initialUserInputs);
  const [chatMessages, setChatMessages] = useState(initialChatMessages);

  // Other states
  const [currentSection, setCurrentSection] = useState(sectionContent?.sections?.[0]?.id || 'question');
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showExamplesDialog, setShowExamplesDialog] = useState(false);

  // Add state to track if we've loaded from storage
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // Add state to track if we've prompted about stored data
  const [hasPromptedAboutStorage, setHasPromptedAboutStorage] = useState(false);

  // On first mount, check if there's stored data and prompt to use it
  useEffect(() => {
    if (hasStoredData && !hasPromptedAboutStorage) {
      const useStoredData = window.confirm(
        "We found a previously saved project. Would you like to load it? Click 'Cancel' to start with a fresh template."
      );

      if (useStoredData) {
        // User wants to use stored data
        setUserInputs(storedInputs);
        setChatMessages(storedChat);
      }

      setHasPromptedAboutStorage(true);
      setIsInitialLoadComplete(true);
    } else {
      // No stored data or already prompted
      setIsInitialLoadComplete(true);
    }
  }, [hasStoredData, hasPromptedAboutStorage, storedInputs, storedChat]);

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

  // MODIFIED: Passes chat history to callOpenAI
  const handleSendMessage = useCallback(async () => {
    if (!currentMessage.trim() || !currentSection) return;
    const newUserMessage = { role: 'user', content: currentMessage };
    // Get the current history for the section *before* adding the new message
    const historyForApi = chatMessages[currentSection] || [];
    // Update UI state immediately
    setChatMessages(prevMessages => ({
        ...prevMessages,
        [currentSection]: [...historyForApi, newUserMessage]
    }));
    setLoading(true);
    const messageToSend = currentMessage;
    setCurrentMessage('');
    try {
      const sectionsForContext = sectionContent?.sections || [];
      // *** Pass the historyForApi to callOpenAI ***
      const response = await callOpenAI(
        messageToSend,
        currentSection,
        userInputs,
        sectionsForContext,
        {}, // options
        historyForApi // Pass the history
      );
      const newAssistantMessage = { role: 'assistant', content: response };
       setChatMessages(prevMessages => ({
           ...prevMessages,
           // Use the already updated historyForApi plus the new user message AND the assistant response
           [currentSection]: [...historyForApi, newUserMessage, newAssistantMessage]
       }));
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = { role: 'assistant', content: `Sorry, there was an error processing your message. (${error.message})` };
       setChatMessages(prevMessages => ({
           ...prevMessages,
           // Use the already updated historyForApi plus the new user message AND the error message
           [currentSection]: [...historyForApi, newUserMessage, errorMessage]
       }));
    } finally {
      setLoading(false);
    }
  }, [currentMessage, currentSection, userInputs, chatMessages]); // Add chatMessages dependency

  // MODIFIED: Passes chat history to callOpenAI
  const handleFirstVersionFinished = useCallback(async (sectionId) => {
    const contentToReview = userInputs[sectionId];
    const currentSectionObj = sectionContent?.sections?.find(s => s.id === sectionId);
    const aiInstructions = currentSectionObj?.llmInstructions;
    if (!contentToReview || !aiInstructions) return;
    setLoading(true);
    const reviewPrompt = aiInstructions;
    const displayMessage = { role: 'user', content: `Requesting review for ${currentSectionObj.title}...` };
    // Get history before adding display message
    const historyForApi = chatMessages[sectionId] || [];
    setChatMessages(prevMessages => ({
        ...prevMessages,
        [sectionId]: [...historyForApi, displayMessage]
    }));
    try {
      const sectionsForContext = sectionContent?.sections || [];
      // *** Pass historyForApi to callOpenAI ***
      const response = await callOpenAI(
        reviewPrompt,
        sectionId,
        userInputs,
        sectionsForContext,
        {}, // options
        historyForApi // Pass the history
      );
      const newAssistantMessage = { role: 'assistant', content: response };
      setChatMessages(prevMessages => ({
          ...prevMessages,
          [sectionId]: [...historyForApi, displayMessage, newAssistantMessage]
      }));
    } catch (error) {
      console.error(`Error getting review for ${sectionId}:`, error);
      const errorMessage = { role: 'assistant', content: `Sorry, there was an error reviewing the ${sectionId} section. (${error.message})` };
      setChatMessages(prevMessages => ({
          ...prevMessages,
          [sectionId]: [...historyForApi, displayMessage, errorMessage]
      }));
    } finally {
      setLoading(false);
    }
  }, [userInputs, chatMessages]); // Add chatMessages dependency


  // Reset project function - FIXED to correctly use fresh templates
  const resetProject = useCallback(() => {
    // Clear localStorage first
    clearStorage();

    // Create fresh copies of the templates
    const freshInputs = JSON.parse(JSON.stringify(initialTemplates));
    const freshChat = {};
    sectionContent?.sections?.forEach(section => {
      if (section && section.id) {
        freshChat[section.id] = [];
      }
    });

    // Set the state to fresh templates
    setUserInputs(freshInputs);
    setChatMessages(freshChat);
    setCurrentSection(sectionContent?.sections?.[0]?.id || 'question');
    setShowConfirmDialog(false);
  }, [initialTemplates]);

  const exportProject = useCallback(() => {
    exportProjectFunction(userInputs, chatMessages, sectionContent);
  }, [userInputs, chatMessages]);

  // Save project function that only saves JSON for loading later
  const saveProject = useCallback((fileName = 'scientific-paper-plan') => {
    // Ensure the fileName has .json extension
    const safeFileName = fileName.endsWith('.json')
      ? fileName
      : `${fileName}.json`;

    const jsonData = {
      userInputs,
      chatMessages,
      timestamp: new Date().toISOString(),
      version: "1.0"
    };

    const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);

    // Create a link and trigger download of JSON
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = safeFileName;
    document.body.appendChild(jsonLink);
    jsonLink.click();

    // Clean up JSON file link
    document.body.removeChild(jsonLink);
    URL.revokeObjectURL(jsonUrl);

    return true;
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
        Object.keys(data.userInputs || {}).forEach(sectionId => {
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
  }, [initialTemplates]);

  // NEW: Import document content
  const importDocumentContent = useCallback(async (file) => {
    setLoading(true);

    try {
      // First, ask for confirmation
      if (!window.confirm("Creating an example from this document will replace your current work. Continue?")) {
        setLoading(false);
        return;
      }

      // Call the document import service - Use the imported function from documentImportService
      const importedData = await importDocumentFromFile(file);

      // Use the loadProject function to handle the imported data
      loadProject(importedData);

      return true;
    } catch (error) {
      console.error("Error importing document content:", error);

      // More user-friendly error message
      alert("We had some trouble processing this document. You might want to try a different file format.");

      return false;
    } finally {
      setLoading(false);
    }
  }, [loadProject]);

  // Return all state and handlers needed by the components
  return {
    userInputs,
    chatMessages,
    currentSection,
    currentMessage,
    loading,
    showConfirmDialog,
    showExamplesDialog,
    setChatMessages,
    setUserInputs,
    setCurrentMessage,
    setShowConfirmDialog,
    setShowExamplesDialog,
    handleSectionChange,
    handleInputChange,
    handleSendMessage,
    handleFirstVersionFinished,
    resetProject,
    exportProject,
    saveProject,
    loadProject,
    importDocumentContent // NEW: Add document import function
  };
};

export default usePaperPlanner;
