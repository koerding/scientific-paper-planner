// FILE: src/hooks/useProjectState.js

/**
 * Hook for managing the core project state (user inputs and chat messages)
 */
import { useState, useEffect, useCallback } from 'react';
import { saveToStorage, loadFromStorage, isStorageAvailable } from '../services/storageService';
import sectionContent from '../data/sectionContent.json';

// Helper function to create the initial state
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

  // Check localStorage
  const { loadedInputs, loadedChat } = loadFromStorage();

  // Flag to determine if we should use localStorage data or templates
  const hasStoredData = loadedInputs && Object.keys(loadedInputs).length > 0;

  return {
    initialUserInputs: initialContent, // Start with clean templates by default
    initialChatMessages: initialChat,
    initialTemplates: initialContent,
    storedInputs: loadedInputs,  // Store but don't automatically use
    storedChat: loadedChat,
    hasStoredData, // Flag to know if we have stored data
    storageAvailable: isStorageAvailable() // Flag to check storage availability
  };
};

/**
 * Hook for managing project state (inputs and chat messages)
 */
export const useProjectState = () => {
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

  // MODIFIED: If there's stored data, use it automatically
  const [userInputs, setUserInputs] = useState(
    hasStoredData ? storedInputs : initialUserInputs
  );
  const [chatMessages, setChatMessages] = useState(
    hasStoredData ? storedChat : initialChatMessages
  );

  // Current section tracking
  const [currentSection, setCurrentSection] = useState(sectionContent?.sections?.[0]?.id || 'question');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Add state to track if we've loaded from storage
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(hasStoredData);

  // Save progress whenever userInputs or chatMessages change
  useEffect(() => {
    if (isInitialLoadComplete && storageAvailable) {
      saveToStorage(userInputs, chatMessages);
    }
  }, [userInputs, chatMessages, isInitialLoadComplete, storageAvailable]);

  // --- Input and Section Handlers ---
  const handleInputChange = useCallback((sectionId, value) => {
    setUserInputs(prevInputs => ({
      ...prevInputs,
      [sectionId]: value
    }));
  }, []);

  const handleSectionChange = useCallback((sectionId) => {
    setCurrentSection(sectionId);
    setCurrentIndex(sectionContent.sections.findIndex(s => s?.id === sectionId));
  }, []);

  // Reset to use fresh templates
  const resetState = useCallback(() => {
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
    
    // Clear localStorage if available
    if (storageAvailable) {
      // We'll need to properly clear storage from the calling component
    }
  }, [initialTemplates, storageAvailable]);

  // Navigation helpers
  const goToNextSection = useCallback(() => {
    const newIndex = currentIndex + 1;
    if (newIndex < sectionContent.sections.length) {
      handleSectionChange(sectionContent.sections[newIndex].id);
    }
  }, [currentIndex, handleSectionChange]);

  const goToPreviousSection = useCallback(() => {
    const newIndex = currentIndex - 1;
    if (newIndex >= 0) {
      handleSectionChange(sectionContent.sections[newIndex].id);
    }
  }, [currentIndex, handleSectionChange]);

  return {
    // State
    userInputs,
    setUserInputs,
    chatMessages,
    setChatMessages,
    currentSection,
    currentIndex,
    
    // Methods
    handleInputChange,
    handleSectionChange,
    resetState,
    goToNextSection,
    goToPreviousSection,
    
    // Flags
    isInitialLoadComplete,
    hasStoredData,
    storageAvailable
  };
};
