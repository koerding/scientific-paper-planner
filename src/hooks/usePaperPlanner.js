// FILE: src/hooks/usePaperPlanner.js

import { useState, useEffect, useCallback } from 'react';
import { saveToStorage, loadFromStorage, clearStorage, isStorageAvailable } from '../services/storageService';
import { callOpenAI } from '../services/openaiService';
import * as documentImportService from '../services/documentImportService';
import sectionContent from '../data/sectionContent.json';
import { validateProjectData } from '../utils/exportUtils';
import { exportProject as exportProjectFunction } from '../utils/exportUtils';
import { buildSystemPrompt } from '../utils/promptUtils';

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
  // Use our safe storage access
  const { loadedInputs, loadedChat } = loadFromStorage();

  // Important: We'll set this flag to determine if we should use localStorage data or templates
  const hasStoredData = loadedInputs && Object.keys(loadedInputs).length > 0;

  return {
    initialUserInputs: initialContent, // Start with clean templates by default
    initialChatMessages: initialChat,
    initialTemplates: initialContent,
    storedInputs: loadedInputs,  // Store but don't automatically use
    storedChat: loadedChat,
    hasStoredData, // Flag to know if we have stored data
    storageAvailable: isStorageAvailable() // Add flag to check storage availability
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
    hasStoredData,
    storageAvailable
  } = initialState;

  // MODIFIED: If there's stored data, use it automatically instead of asking
  const [userInputs, setUserInputs] = useState(
    hasStoredData ? storedInputs : initialUserInputs
  );
  const [chatMessages, setChatMessages] = useState(
    hasStoredData ? storedChat : initialChatMessages
  );

  // Other states
  const [currentSection, setCurrentSection] = useState(sectionContent?.sections?.[0]?.id || 'question');
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showExamplesDialog, setShowExamplesDialog] = useState(false);
  const [currentSectionData, setCurrentSectionData] = useState(null);
  const [sectionCompletionStatus, setSectionCompletionStatus] = useState({});

  // These additional states are used by the VerticalPaperPlannerApp.js but needed in resetProject
  const [activeApproach, setActiveApproach] = useState('hypothesis');
  const [activeDataMethod, setActiveDataMethod] = useState('experiment');

  // Add state to track if we've loaded from storage
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(hasStoredData);

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
  // Only attempt to save if storage is available
  useEffect(() => {
    if (isInitialLoadComplete && storageAvailable) {
      saveToStorage(userInputs, chatMessages);
    }
  }, [userInputs, chatMessages, isInitialLoadComplete, storageAvailable]);

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
      
      // Generate system prompt
      const systemPrompt = buildSystemPrompt('chat', {
        sectionTitle: currentSectionObj.title || 'Research',
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

  // Reset project function - FIXED to correctly use fresh templates and all required states
  const resetProject = useCallback(() => {
    // Clear localStorage first, if available
    if (storageAvailable) {
      clearStorage();
    }

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
    setActiveApproach('hypothesis');
    setActiveDataMethod('experiment');
    setSectionCompletionStatus({});
    setShowConfirmDialog(false);
  }, [initialTemplates, storageAvailable]);

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

  // Function to load project from imported JSON file with improved handling
  const loadProject = useCallback((data) => {
    if (!validateProjectData(data)) {
      alert("Invalid project file format. Please select a valid project file.");
      return;
    }
    
    try {
      // Create template values using sectionContent
      const templateValues = {};
      sectionContent.sections.forEach(section => {
        if (section && section.id) {
          templateValues[section.id] = section.placeholder || '';
        }
      });
      
      // Merge with loaded data
      const mergedInputs = {...templateValues};
      Object.keys(data.userInputs).forEach(sectionId => {
        if (data.userInputs[sectionId] && typeof data.userInputs[sectionId] === 'string' && 
            data.userInputs[sectionId].trim() !== '') {
          mergedInputs[sectionId] = data.userInputs[sectionId];
        }
      });
      
      // Update user inputs state
      setUserInputs(mergedInputs);
      
      // Create empty chat messages
      const emptyChat = {};
      sectionContent.sections.forEach(section => {
        if (section && section.id) {
          emptyChat[section.id] = [];
        }
      });
      
      // Merge with loaded chat messages if they exist
      const mergedChat = {...emptyChat};
      if (data.chatMessages) {
        Object.keys(data.chatMessages).forEach(sectionId => {
          if (Array.isArray(data.chatMessages[sectionId])) {
            mergedChat[sectionId] = data.chatMessages[sectionId];
          }
        });
      }
      
      // Update chat messages state
      setChatMessages(mergedChat);
      
      // Save to localStorage
      if (storageAvailable) {
        saveToStorage(mergedInputs, mergedChat);
      }
      
      // Set to first section
      setCurrentSection(sectionContent.sections[0].id);
    } catch (error) {
      alert("Error loading project: " + (error.message || "Unknown error"));
    }
  }, [storageAvailable]);

  // Import document content - FIXED version
  const handleDocumentImport = useCallback(async (file) => {
    setLoading(true);

    try {
      // Ask for confirmation just once here
      if (!window.confirm("Creating an example from this document will replace your current work. Continue?")) {
        setLoading(false);
        return false;
      }

      console.log(`Starting import process for ${file.name}`);
      
      // Pass sectionContent to the import service
      // This ensures it uses the same placeholders as the main app
      const importedData = await documentImportService.importDocumentContent(file, sectionContent);
      
      console.log("Document import returned data:", importedData ? "Success" : "Failed");
      
      // Add extra validation to ensure we have a valid structure before loading
      if (!importedData || !importedData.userInputs) {
        console.error("Import returned invalid data structure:", importedData);
        throw new Error("Import returned invalid data");
      }
      
      // Ensure required fields exist
      const requiredFields = ['question', 'audience']; // Minimal set required
      const missingFields = requiredFields.filter(field => 
        !importedData.userInputs[field] || typeof importedData.userInputs[field] !== 'string'
      );
      
      if (missingFields.length > 0) {
        console.error("Imported data missing required fields:", missingFields);
        throw new Error(`Import missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Format to ensure loadProject will accept it
      const formattedData = {
        userInputs: importedData.userInputs,
        chatMessages: importedData.chatMessages || {},
        timestamp: importedData.timestamp || new Date().toISOString(),
        version: importedData.version || "1.0-document-import"
      };
      
      console.log("Loading imported project data");
      
      // Use our loadProject function to handle the imported data
      // BUT! Skip the validateProjectData check since we just did our own validation
      // Instead of calling loadProject directly, implement its functionality here
      try {
        // Create template values using sectionContent
        const templateValues = {};
        sectionContent.sections.forEach(section => {
          if (section && section.id) {
            templateValues[section.id] = section.placeholder || '';
          }
        });
        
        // Merge with loaded data
        const mergedInputs = {...templateValues};
        Object.keys(formattedData.userInputs).forEach(sectionId => {
          if (formattedData.userInputs[sectionId] && typeof formattedData.userInputs[sectionId] === 'string' && 
              formattedData.userInputs[sectionId].trim() !== '') {
            mergedInputs[sectionId] = formattedData.userInputs[sectionId];
          }
        });
        
        // Update user inputs state
        setUserInputs(mergedInputs);
        
        // Create empty chat messages
        const emptyChat = {};
        sectionContent.sections.forEach(section => {
          if (section && section.id) {
            emptyChat[section.id] = [];
          }
        });
        
        // Merge with loaded chat messages if they exist
        const mergedChat = {...emptyChat};
        if (formattedData.chatMessages) {
          Object.keys(formattedData.chatMessages).forEach(sectionId => {
            if (Array.isArray(formattedData.chatMessages[sectionId])) {
              mergedChat[sectionId] = formattedData.chatMessages[sectionId];
            }
          });
        }
        
        // Update chat messages state
        setChatMessages(mergedChat);
        
        // Save to localStorage
        if (storageAvailable) {
          saveToStorage(mergedInputs, mergedChat);
        }
        
        // Set to first section
        setCurrentSection(sectionContent.sections[0].id);

        console.log(`Document ${file.name} successfully imported`);
        
        return true;
      } catch (innerError) {
        console.error("Error in loading imported data:", innerError);
        throw innerError;
      }
    } catch (error) {
      console.error("Error importing document:", error);
      alert("Error importing document: " + (error.message || "Unknown error"));
      return false;
    } finally {
      setLoading(false);
    }
  }, [sectionContent, storageAvailable]);

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
    activeApproach,      // Added to expose for VerticalPaperPlannerApp
    activeDataMethod,    // Added to expose for VerticalPaperPlannerApp
    sectionCompletionStatus, // Added to expose for VerticalPaperPlannerApp
    setChatMessages,
    setUserInputs,
    setCurrentMessage,
    setShowConfirmDialog,
    setShowExamplesDialog,
    setActiveApproach,    // Added to expose for VerticalPaperPlannerApp
    setActiveDataMethod,  // Added to expose for VerticalPaperPlannerApp
    setSectionCompletionStatus, // Added to expose for VerticalPaperPlannerApp
    handleSectionChange,
    handleInputChange,
    handleSendMessage,
    resetProject,
    exportProject,
    saveProject,
    loadProject,
    importDocumentContent: handleDocumentImport // Use the fixed document import handler
  };
};

export default usePaperPlanner;// FILE: src/hooks/usePaperPlanner.js

import { useState, useEffect, useCallback } from 'react';
import { saveToStorage, loadFromStorage, clearStorage, isStorageAvailable } from '../services/storageService';
import { callOpenAI } from '../services/openaiService';
import * as documentImportService from '../services/documentImportService'; // Import the full service
import sectionContent from '../data/sectionContent.json';
import { validateProjectData } from '../utils/exportUtils';
import { exportProject as exportProjectFunction } from '../utils/exportUtils';
import { buildSystemPrompt } from '../utils/promptUtils';

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
  // Use our safe storage access
  const { loadedInputs, loadedChat } = loadFromStorage();

  // Important: We'll set this flag to determine if we should use localStorage data or templates
  const hasStoredData = loadedInputs && Object.keys(loadedInputs).length > 0;

  return {
    initialUserInputs: initialContent, // Start with clean templates by default
    initialChatMessages: initialChat,
    initialTemplates: initialContent,
    storedInputs: loadedInputs,  // Store but don't automatically use
    storedChat: loadedChat,
    hasStoredData, // Flag to know if we have stored data
    storageAvailable: isStorageAvailable() // Add flag to check storage availability
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
    hasStoredData,
    storageAvailable
  } = initialState;

  // MODIFIED: If there's stored data, use it automatically instead of asking
  const [userInputs, setUserInputs] = useState(
    hasStoredData ? storedInputs : initialUserInputs
  );
  const [chatMessages, setChatMessages] = useState(
    hasStoredData ? storedChat : initialChatMessages
  );

  // Other states
  const [currentSection, setCurrentSection] = useState(sectionContent?.sections?.[0]?.id || 'question');
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showExamplesDialog, setShowExamplesDialog] = useState(false);
  const [currentSectionData, setCurrentSectionData] = useState(null);
  const [sectionCompletionStatus, setSectionCompletionStatus] = useState({});

  // These additional states are used by the VerticalPaperPlannerApp.js but needed in resetProject
  const [activeApproach, setActiveApproach] = useState('hypothesis');
  const [activeDataMethod, setActiveDataMethod] = useState('experiment');

  // Add state to track if we've loaded from storage
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(hasStoredData);

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
  // Only attempt to save if storage is available
  useEffect(() => {
    if (isInitialLoadComplete && storageAvailable) {
      saveToStorage(userInputs, chatMessages);
    }
  }, [userInputs, chatMessages, isInitialLoadComplete, storageAvailable]);

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
      
      // Generate system prompt
      const systemPrompt = buildSystemPrompt('chat', {
        sectionTitle: currentSectionObj.title || 'Research',
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

  // Reset project function - FIXED to correctly use fresh templates and all required states
  const resetProject = useCallback(() => {
    // Clear localStorage first, if available
    if (storageAvailable) {
      clearStorage();
    }

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
    setActiveApproach('hypothesis');
    setActiveDataMethod('experiment');
    setSectionCompletionStatus({});
    setShowConfirmDialog(false);
  }, [initialTemplates, storageAvailable]);

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

  // Function to load project from imported JSON file - SIMPLIFIED VERSION
  const loadProject = useCallback((data) => {
    if (!validateProjectData(data)) {
      alert("Invalid project file format. Please select a valid project file.");
      return;
    }
    
    // MODIFIED: Removed confirmation dialog for loading project
    try {
      // Create template values using sectionContent
      const templateValues = {};
      sectionContent.sections.forEach(section => {
        if (section && section.id) {
          templateValues[section.id] = section.placeholder || '';
        }
      });
      
      // Merge with loaded data
      const mergedInputs = {...templateValues};
      Object.keys(data.userInputs).forEach(sectionId => {
        if (data.userInputs[sectionId] && typeof data.userInputs[sectionId] === 'string' && 
            data.userInputs[sectionId].trim() !== '') {
          mergedInputs[sectionId] = data.userInputs[sectionId];
        }
      });
      
      // Update user inputs state
      setUserInputs(mergedInputs);
      
      // Create empty chat messages
      const emptyChat = {};
      sectionContent.sections.forEach(section => {
        if (section && section.id) {
          emptyChat[section.id] = [];
        }
      });
      
      // Merge with loaded chat messages if they exist
      const mergedChat = {...emptyChat};
      if (data.chatMessages) {
        Object.keys(data.chatMessages).forEach(sectionId => {
          if (Array.isArray(data.chatMessages[sectionId])) {
            mergedChat[sectionId] = data.chatMessages[sectionId];
          }
        });
      }
      
      // Update chat messages state
      setChatMessages(mergedChat);
      
      // Save to localStorage
      if (storageAvailable) {
        saveToStorage(mergedInputs, mergedChat);
      }
      
      // Set to first section
      setCurrentSection(sectionContent.sections[0].id);
      
      // MODIFIED: Removed success alert - no need to tell user what they already know
    } catch (error) {
      alert("Error loading project: " + (error.message || "Unknown error"));
    }
  }, [storageAvailable]);

  // Import document content using the document import service
  // FIXED: Now passes sectionContent to ensure consistent placeholders
  const handleDocumentImport = useCallback(async (file) => {
    setLoading(true);

    try {
      // MODIFIED: Only ask once for confirmation
      if (!window.confirm("Creating an example from this document will replace your current work. Continue?")) {
        setLoading(false);
        return false;
      }

      // FIXED: Pass sectionContent to the import service 
      // This ensures it uses the same placeholders as the main app
      const importedData = await documentImportService.importDocumentContent(file, sectionContent);
      
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
    activeApproach,      // Added to expose for VerticalPaperPlannerApp
    activeDataMethod,    // Added to expose for VerticalPaperPlannerApp
    sectionCompletionStatus, // Added to expose for VerticalPaperPlannerApp
    setChatMessages,
    setUserInputs,
    setCurrentMessage,
    setShowConfirmDialog,
    setShowExamplesDialog,
    setActiveApproach,    // Added to expose for VerticalPaperPlannerApp
    setActiveDataMethod,  // Added to expose for VerticalPaperPlannerApp
    setSectionCompletionStatus, // Added to expose for VerticalPaperPlannerApp
    handleSectionChange,
    handleInputChange,
    handleSendMessage,
    resetProject,
    exportProject,
    saveProject,
    loadProject,
    importDocumentContent: handleDocumentImport // Use the real document import service with sectionContent
  };
};

export default usePaperPlanner;
