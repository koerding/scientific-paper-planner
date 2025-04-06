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
  buildSystemPrompt,
  getApproachGuidance
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

  // Unified handler for all messages using Socratic approach
  const handleSendMessage = useCallback(async (overrideMessage = null, isInitialPrompt = false) => {
    const messageToSend = overrideMessage || currentMessage;
    
    if ((!messageToSend.trim() || !currentSection) && !isInitialPrompt) return;

    // For standard user messages (not initial prompts), update the UI immediately
    if (!isInitialPrompt) {
      const newUserMessage = { role: 'user', content: messageToSend };
      setChatMessages(prevMessages => ({
          ...prevMessages,
          [currentSection]: [...(prevMessages[currentSection] || []), newUserMessage]
      }));
      setCurrentMessage('');
    }

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
      
      // Generate Socratic system prompt using centralized prompt builder
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
      
      // For initial prompts, we use a standard intro message
      const promptToSend = isInitialPrompt 
        ? `I'm working on the ${currentSectionObj.title || 'current'} section of my scientific paper plan. Can you help me think through this?` 
        : messageToSend;

      // Call OpenAI with the appropriate prompts and context
      const response = await callOpenAI(
        promptToSend,             // The message to send
        currentSection,           // Context type (section ID)
        userInputs,               // All user inputs for broader context
        sectionsForContext,       // Section definitions for context
        { temperature: 0.9 },     // Higher temperature for more creative questions
        historyForApi,            // Chat history for the current section
        systemPrompt              // The system prompt built with promptUtils
      );
      
      // For initial prompts, we need to add both the initial message and the response
      if (isInitialPrompt) {
        // Add the user's initial prompt
        const initialUserMessage = { role: 'user', content: promptToSend };
        
        // Add the assistant's response
        const newAssistantMessage = { role: 'assistant', content: response };
        
        setChatMessages(prevMessages => ({
          ...prevMessages,
          [currentSection]: [...(prevMessages[currentSection] || []), initialUserMessage, newAssistantMessage]
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
      
      // Handle error gracefully
      if (isInitialPrompt) {
        const initialUserMessage = { role: 'user', content: promptToSend };
        const errorMessage = { 
          role: 'assistant', 
          content: `Hey there! I'd love to help you think through this. What specific aspects of this ${currentSectionData?.title || 'section'} are you finding most interesting or challenging?` 
        };
        
        setChatMessages(prevMessages => ({
          ...prevMessages,
          [currentSection]: [...(prevMessages[currentSection] || []), initialUserMessage, errorMessage]
        }));
      } else {
        // For normal user messages
        const errorMessage = { 
          role: 'assistant', 
          content: `Hmm, I hit a technical snag there. What aspects of this topic would you like to explore more deeply?` 
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
