// FILE: src/hooks/usePaperPlanner.js

import { useState, useEffect, useCallback } from 'react';
import { saveToStorage, loadFromStorage, clearStorage } from '../services/storageService';
import { callOpenAI } from '../services/openaiService';
import { importDocumentContent as importDocumentFromFile } from '../services/documentImportService';
import sectionContent from '../data/sectionContent.json';
import { validateProjectData } from '../utils/exportUtils';
import { exportProject as exportProjectFunction } from '../utils/exportUtils';
import { 
  isResearchApproachSection, 
  buildSystemPrompt
} from '../utils/promptUtils';

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
  const [currentSectionData, setCurrentSectionData] = useState(null);

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

  // Update currentSectionData when currentSection changes
  useEffect(() => {
    if (currentSection && sectionContent && Array.isArray(sectionContent.sections)) {
      const sectionObj = sectionContent.sections.find(s => s && s.id === currentSection);
      setCurrentSectionData(sectionObj || null);
    } else {
      setCurrentSectionData(null);
    }
  }, [currentSection]);

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

  // Modernized send message handler using JSON mode for structured data
  const handleSendMessage = useCallback(async (overrideMessage = null) => {
    const messageToSend = overrideMessage || currentMessage;
    
    if (!messageToSend.trim() || !currentSection) return;

    // Add user message to chat state
    const newUserMessage = { role: 'user', content: messageToSend };
    setChatMessages(prevMessages => ({
        ...prevMessages,
        [currentSection]: [...(prevMessages[currentSection] || []), newUserMessage]
    }));
    setCurrentMessage('');

    setLoading(true);

    try {
      // Find the section data for context
      const sectionsForContext = sectionContent?.sections || [];
      const currentSectionObj = sectionsForContext.find(s => s && s.id === currentSection) || {};
      
      // Get instructions text
      const instructionsText = currentSectionObj.instructions?.text || '';
      const feedbackText = currentSectionObj.instructions?.feedback || '';
      
      // Get user's current content for this section
      const userContent = userInputs[currentSection] || '';
      
      // Determine if we need research approach context based on the section
      const needsResearchContext = isResearchApproachSection(currentSection, currentSectionObj);
      
      // Generate system prompt
      const systemPrompt = buildSystemPrompt('chat', {
        needsResearchContext,
        sectionTitle: currentSectionObj.title || 'Research',
        approachGuidance: needsResearchContext ? getApproachGuidance(currentSection) : '',
        instructionsText,
        feedbackText,
        userContent: userContent || "They haven't written anything substantial yet."
      });
      
      // Get chat history
      const historyForApi = chatMessages[currentSection] || [];
      
      // For chat, don't use JSON mode
      const response = await callOpenAI(
        messageToSend,            // User's message
        currentSection,           // Context type (section ID)
        userInputs,               // All user inputs for broader context
        sectionsForContext,       // Section definitions for context
        { temperature: 0.9 },     // Higher temperature for more creative questions
        historyForApi,            // Chat history for the current section
        systemPrompt,             // The system prompt built with promptUtils
        false                     // Don't use JSON mode for chat
      );
      
      // Add the assistant's response
      const newAssistantMessage = { role: 'assistant', content: response };
      
      setChatMessages(prevMessages => {
        const currentMessages = prevMessages[currentSection] || [];
        return {
          ...prevMessages,
          [currentSection]: [...currentMessages, newAssistantMessage]
        };
      });
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Handle error gracefully
      const errorMessage = { 
        role: 'assistant', 
        content: `I encountered a technical issue. What would you like to know about your ${currentSectionData?.title || 'research'}?` 
      };
      
      setChatMessages(prevMessages => {
        const currentMessages = prevMessages[currentSection] || [];
        return {
          ...prevMessages,
          [currentSection]: [...currentMessages, errorMessage]
        };
      });
    } finally {
      setLoading(false);
    }
  }, [currentMessage, currentSection, currentSectionData, userInputs, chatMessages]);

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

  // Import document content using the modernized service
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
    currentSectionData,  // Provides section data to chat
    setChatMessages,
    setUserInputs,
    setCurrentMessage,
    setShowConfirmDialog,
    setShowExamplesDialog,
    handleSectionChange,
    handleInputChange,
    handleSendMessage,
    resetProject,
    exportProject,
    saveProject,
    loadProject,
    importDocumentContent
  };
};

export default usePaperPlanner;
