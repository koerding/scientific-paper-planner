// FILE: src/hooks/usePaperPlanner.js

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

  // MODIFIED: Handles both user messages and system-initiated Socratic prompts
  const handleSendMessage = useCallback(async (overrideMessage, isSocraticPrompt = false) => {
    const messageToSend = overrideMessage || currentMessage;
    
    if ((!messageToSend.trim() || !currentSection) && !isSocraticPrompt) return;

    // For standard user messages (not Socratic prompts)
    if (!isSocraticPrompt) {
      const newUserMessage = { role: 'user', content: messageToSend };
      const historyForApi = chatMessages[currentSection] || [];

      // Update UI state immediately
      setChatMessages(prevMessages => ({
          ...prevMessages,
          [currentSection]: [...historyForApi, newUserMessage]
      }));
      setCurrentMessage('');
    }

    setLoading(true);

    try {
      // Find the section data for context
      const sectionsForContext = sectionContent?.sections || [];
      const currentSectionObj = sectionsForContext.find(s => s && s.id === currentSection) || {};
      
      // Get instructions text - try to get the most updated version (which might be edited by AI)
      const instructionsText = currentSectionObj.instructions?.text || '';
      const feedbackText = currentSectionObj.instructions?.feedback || '';
      
      // Get user's current content for this section
      const userContent = userInputs[currentSection] || '';
      
      // Generate appropriate system prompts based on whether this is a Socratic prompt or not
      let systemPrompt;
      let promptToSend;
      
      if (isSocraticPrompt) {
        // For Socratic prompts, customize the system prompt to be more conversational and question-based
        systemPrompt = `You are Konrad Kording, a worldclass researcher with an unconventional, informal voice who mentors students using a Socratic method. 
        As a mentor, you guide through thoughtful questions rather than giving direct answers. 
        Your approach is to ask SPECIFIC, thought-provoking questions that challenge students to develop their ideas independently.
        
        You're currently helping a student with a section of their scientific paper plan titled "${currentSectionObj.title || 'Research Project'}".
        
        This conversation just started. Introduce yourself briefly, then IMMEDIATELY ask 2-3 thoughtful, specific questions about their current work.
        
        The questions should:
        1. Be directly related to their current section
        2. Help them think more deeply about what they've written or what they need to consider
        3. Be open-ended but specific enough to guide their thinking
        4. Reflect your informal, conversational style
        
        Current section instructions: ${instructionsText}
        
        Student's current input: ${userContent || "They haven't written anything substantial yet."}`;
        
        // Create a special prompt that requests Socratic guidance
        promptToSend = `I'm working on the ${currentSectionObj.title || 'current'} section of my scientific paper plan. Can you help me think through this with some guiding questions?`;
      } else {
        // For regular conversations, use a more responsive system prompt 
        systemPrompt = `You are Konrad Kording, a worldclass researcher with an unconventional, informal voice who mentors students on scientific research.
        You have a somewhat unconventional, informal voice but are incredibly insightful about research methodology.
        You are responding to a question or comment about the "${currentSectionObj.title || 'Research Project'}" section.
        
        Remember:
        - Your responses should be conversational and in first person
        - Aim to be helpful while encouraging critical thinking
        - Keep a balance between being supportive and pushing for scientific rigor
        - Ask follow-up questions to deepen their thinking when appropriate
        - You should generally avoid long, lecture-style responses in favor of more interactive exchanges
        
        Current section instructions: ${instructionsText}
        
        Related feedback (if any): ${feedbackText}
        
        Student's current input: ${userContent || "They haven't written anything substantial yet."}`;
        
        promptToSend = messageToSend;
      }
      
      // Get chat history, but filter out any system-initiated prompts
      const historyForApi = chatMessages[currentSection] || [];
      const filteredHistory = historyForApi.filter(msg => 
        !(msg.role === 'user' && msg.content === "__SOCRATIC_PROMPT__")
      );

      // Call OpenAI with the appropriate prompts and context
      const response = await callOpenAI(
        promptToSend,           // The message/prompt to send
        currentSection,         // Context type (section ID)
        userInputs,             // All user inputs for broader context
        sectionsForContext,     // Section definitions for context
        {},                     // API options (e.g., temperature)
        filteredHistory,        // Filtered chat history for the current section
        systemPrompt            // The specific system prompt
      );
      
      // For Socratic prompts, we need to add both the system prompt and the response
      if (isSocraticPrompt) {
        // Add a hidden user message (will be filtered out in display)
        const systemUserMessage = { role: 'user', content: "__SOCRATIC_PROMPT__" };
        
        // Add the assistant's response
        const newAssistantMessage = { role: 'assistant', content: response };
        
        setChatMessages(prevMessages => ({
          ...prevMessages,
          [currentSection]: [...(prevMessages[currentSection] || []), systemUserMessage, newAssistantMessage]
        }));
      } else {
        // For regular messages, just add the assistant's response
        const newAssistantMessage = { role: 'assistant', content: response };
        
        setChatMessages(prevMessages => {
          const currentMessages = prevMessages[currentSection] || [];
          return {
            ...prevMessages,
            [currentSection]: [...currentMessages, newAssistantMessage]
          };
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // For Socratic prompts, we need to add the system prompt first
      if (isSocraticPrompt) {
        const systemUserMessage = { role: 'user', content: "__SOCRATIC_PROMPT__" };
        const errorMessage = { 
          role: 'assistant', 
          content: `Hey there! I'd love to help you think through your research. Unfortunately, I hit a technical glitch. Would you mind sharing what you're working on or any specific questions you have about this section?` 
        };
        
        setChatMessages(prevMessages => ({
          ...prevMessages,
          [currentSection]: [...(prevMessages[currentSection] || []), systemUserMessage, errorMessage]
        }));
      } else {
        // For normal user messages
        const errorMessage = { 
          role: 'assistant', 
          content: `Sorry, I hit a technical glitch while processing your message (${error.message}). Can you try asking in a slightly different way?` 
        };
        
        setChatMessages(prevMessages => {
          const currentMessages = prevMessages[currentSection] || [];
          return {
            ...prevMessages,
            [currentSection]: [...currentMessages, errorMessage]
          };
        });
      }
    } finally {
      setLoading(false);
    }
  }, [currentMessage, currentSection, userInputs, chatMessages]);

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

  // Import document content
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
    currentSectionData,  // NEW: Added to provide section data to chat
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
