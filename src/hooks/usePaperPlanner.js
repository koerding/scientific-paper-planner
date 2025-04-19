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

  // NEW: Sequential mode state variables
  const [expandedSections, setExpandedSections] = useState(() => {
    // Initially only first section is expanded
    const initialExpanded = {};
    if (sectionContent?.sections?.length > 0) {
      initialExpanded[sectionContent.sections[0].id] = true;
    }
    return initialExpanded;
  });
  
  // NEW: Track section feedback status (none, good, fair, poor)
  const [sectionStatus, setSectionStatus] = useState({});

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

  // Function to toggle section expansion
  const toggleSectionExpansion = useCallback((sectionId) => {
    // Special handling for approach and data method sections
    if (sectionId === 'hypothesis' || sectionId === 'needsresearch' || sectionId === 'exploratoryresearch') {
      // For approach sections, set them as the active approach
      setActiveApproach(sectionId);
      
      // Update expanded sections for approaches
      setExpandedSections(prev => {
        const newState = {...prev};
        // Collapse all approach sections
        ['hypothesis', 'needsresearch', 'exploratoryresearch'].forEach(id => {
          newState[id] = false;
        });
        // Expand the selected section
        newState[sectionId] = true;
        return newState;
      });
    } 
    else if (sectionId === 'experiment' || sectionId === 'existingdata' || sectionId === 'theorysimulation') {
      // For data method sections, set them as the active data method
      setActiveDataMethod(sectionId);
      
      // Update expanded sections for data methods
      setExpandedSections(prev => {
        const newState = {...prev};
        // Collapse all data method sections
        ['experiment', 'existingdata', 'theorysimulation'].forEach(id => {
          newState[id] = false;
        });
        // Expand the selected section
        newState[sectionId] = true;
        return newState;
      });
    }
    else {
      // For all other sections, simply toggle expansion
      setExpandedSections(prev => ({
        ...prev,
        [sectionId]: !prev[sectionId]
      }));
    }
    
    // If we're expanding this section, make it the current section
    if (!expandedSections[sectionId]) {
      setCurrentSection(sectionId);
    }
  }, [expandedSections, setActiveApproach, setActiveDataMethod]);

  // NEW: Function to expand only specific sections
  const setExpandedSection = useCallback((sectionId) => {
    setExpandedSections(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(id => {
        newState[id] = id === sectionId;
      });
      return newState;
    });
    setCurrentSection(sectionId);
  }, []);

  // Get the next section ID in the sequence, accounting for toggle sections
  const getNextSectionId = useCallback((currentId) => {
    const sections = sectionContent?.sections || [];
    const currentIndex = sections.findIndex(s => s.id === currentId);
    
    if (currentIndex === -1 || currentIndex >= sections.length - 1) {
      return null;
    }
    
    // Get the next section in the array
    let nextSectionId = sections[currentIndex + 1].id;
    
    // Handle approach toggle sections
    if (currentId === 'hypothesis' || currentId === 'needsresearch' || currentId === 'exploratoryresearch') {
      // Skip to audience section after any approach section
      const audienceIndex = sections.findIndex(s => s.id === 'audience');
      if (audienceIndex !== -1) {
        nextSectionId = 'audience';
      }
    }
    // Handle approach section when coming from question
    else if (currentId === 'question') {
      // Next would be the active approach section, not necessarily hypothesis
      nextSectionId = activeApproach;
    }
    // Handle data method toggle sections
    else if (currentId === 'experiment' || currentId === 'existingdata' || currentId === 'theorysimulation') {
      // Skip to analysis section after any data method section
      const analysisIndex = sections.findIndex(s => s.id === 'analysis');
      if (analysisIndex !== -1) {
        nextSectionId = 'analysis';
      }
    }
    // Handle data method when coming from relatedpapers
    else if (currentId === 'relatedpapers') {
      // Next would be the active data method, not necessarily experiment
      nextSectionId = activeDataMethod;
    }
    
    return nextSectionId;
  }, [activeApproach, activeDataMethod]);

  // NEW: Function to get section-specific feedback and determine status
  const handleSectionFeedback = useCallback(async (sectionId) => {
    setLoading(true);
    
    try {
      // Section data for context
      const sectionsForContext = sectionContent?.sections || [];
      const currentSectionObj = sectionsForContext.find(s => s && s.id === sectionId) || {};
      
      // Get instructions text
      const instructionsText = currentSectionObj.introText || '';
      
      // Get user's current content for this section
      const userContent = userInputs[sectionId] || '';
      
      // Skip if no content
      if (!userContent.trim()) {
        alert("Please add some content before requesting feedback.");
        setLoading(false);
        return;
      }
      
      // Build system prompt
      const systemPrompt = `You are evaluating the ${currentSectionObj.title || 'section'} of a scientific project plan. 
      Provide constructive feedback on the content based on these criteria:

      - Completeness: Does it address all key aspects?
      - Clarity: Is it well-articulated and understandable?
      - Relevance: Does it align with the project's focus?

      Your evaluation will be used to determine a status rating: 'good', 'fair', or 'poor'.`;
      
      // Build user prompt
      const userPrompt = `Please review the following ${currentSectionObj.title || 'section'} content and provide specific, actionable feedback. 
      Begin your response with one of these keywords to indicate quality:
      - GOOD: If the content is thorough and well-developed
      - FAIR: If the content needs moderate improvements
      - POOR: If the content needs substantial work

      Section Instructions: ${instructionsText}

      User's content:
      ${userContent}

      Provide 3-5 specific points of feedback, focusing on concrete improvements.`;
      
      // Call OpenAI API
      const response = await callOpenAI(
        userPrompt,
        sectionId,
        userInputs,
        sectionsForContext,
        { temperature: 0.7 },
        [],
        systemPrompt,
        false
      );
      
      // Determine status based on response
      let status = 'none';
      if (response.toUpperCase().startsWith('GOOD')) {
        status = 'good';
      } else if (response.toUpperCase().startsWith('FAIR')) {
        status = 'fair';
      } else if (response.toUpperCase().startsWith('POOR')) {
        status = 'poor';
      }
      
      // Update section status
      setSectionStatus(prevStatus => ({
        ...prevStatus,
        [sectionId]: status
      }));
      
      // Always expand the next section regardless of feedback status
      const nextSectionId = getNextSectionId(sectionId);
      if (nextSectionId) {
        // Special handling for approach and data method sections
        if (nextSectionId === 'hypothesis' || nextSectionId === 'needsresearch' || nextSectionId === 'exploratoryresearch') {
          // Set the active approach to this section
          setActiveApproach(nextSectionId);
          
          // Update expanded sections: collapse all approach sections except the active one
          setExpandedSections(prev => {
            const newState = {...prev};
            ['hypothesis', 'needsresearch', 'exploratoryresearch'].forEach(id => {
              newState[id] = id === nextSectionId;
            });
            // Always expand the next section
            newState[nextSectionId] = true;
            return newState;
          });
        }
        else if (nextSectionId === 'experiment' || nextSectionId === 'existingdata' || nextSectionId === 'theorysimulation') {
          // Set the active data method to this section
          setActiveDataMethod(nextSectionId);
          
          // Update expanded sections: collapse all data method sections except the active one
          setExpandedSections(prev => {
            const newState = {...prev};
            ['experiment', 'existingdata', 'theorysimulation'].forEach(id => {
              newState[id] = id === nextSectionId;
            });
            // Always expand the next section
            newState[nextSectionId] = true;
            return newState;
          });
        }
        else {
          // For regular sections, just expand it
          setExpandedSections(prev => ({
            ...prev,
            [nextSectionId]: true
          }));
        }
        
        // Update current section to the next one
        setCurrentSection(nextSectionId);
      }
      
      // Add feedback to chat messages
      setChatMessages(prevMessages => ({
        ...prevMessages,
        [sectionId]: [
          ...(prevMessages[sectionId] || []),
          { role: 'user', content: "Can you evaluate my current progress on this section?" },
          { role: 'assistant', content: response }
        ]
      }));
      
    } catch (error) {
      console.error("Error getting section feedback:", error);
      alert("There was an error getting feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userInputs, getNextSectionId]);

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

  // Reset project function - UPDATED for sequential mode
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
    
    // Reset section expansion to only first section
    const firstSectionId = sectionContent?.sections?.[0]?.id || 'question';
    const initialExpanded = { [firstSectionId]: true };
    setExpandedSections(initialExpanded);
    
    setCurrentSection(firstSectionId);
    setActiveApproach('hypothesis');
    setActiveDataMethod('experiment');
    setSectionCompletionStatus({});
    setSectionStatus({}); // Reset feedback status
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

  // Function to load project from imported JSON file - UPDATED for sequential mode
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
      
      // Reset section expansion to only first section
      const firstSectionId = sectionContent?.sections?.[0]?.id || 'question';
      const initialExpanded = { [firstSectionId]: true };
      setExpandedSections(initialExpanded);
      
      // Reset section status
      setSectionStatus({});
      
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
  // UPDATED for sequential mode
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
    currentSectionData,
    activeApproach,
    activeDataMethod,
    sectionCompletionStatus,
    // NEW: Sequential mode states
    expandedSections,
    sectionStatus,
    setChatMessages,
    setUserInputs,
    setCurrentMessage,
    setShowConfirmDialog,
    setShowExamplesDialog,
    setActiveApproach,
    setActiveDataMethod,
    setSectionCompletionStatus,
    // NEW: Sequential mode handlers
    toggleSectionExpansion,
    setExpandedSection,
    handleSectionFeedback,
    handleSectionChange,
    handleInputChange,
    handleSendMessage,
    resetProject,
    exportProject,
    saveProject,
    loadProject,
    importDocumentContent: handleDocumentImport
  };
};

export default usePaperPlanner;
