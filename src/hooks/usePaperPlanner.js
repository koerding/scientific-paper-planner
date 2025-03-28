import { useState, useEffect } from 'react';
import { saveToStorage, loadFromStorage, clearStorage } from '../services/storageService';
import { callOpenAI } from '../services/openaiService';

/**
 * Custom hook for Paper Planner functionality
 * @param {Array} sections - The sections from configuration
 * @returns {Object} - State and handler functions
 */
const usePaperPlanner = (sections) => {
  // State
  const [currentSection, setCurrentSection] = useState(sections[0].id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInputs, setUserInputs] = useState({
    question: '',
    hypothesis: '',
    philosophy: [],
    experiment: '',
    analysis: '',
    process: '',
    abstract: ''
  });
  const [chatMessages, setChatMessages] = useState({});
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Initialize chat messages for each section
  useEffect(() => {
    const initialChatMessages = {};
    sections.forEach(section => {
      initialChatMessages[section.id] = [];
    });
    setChatMessages(initialChatMessages);
  }, [sections]);

  // Auto-save on input change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveToStorage(userInputs, chatMessages);
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [userInputs, chatMessages]);

  // Load progress on initial mount
  useEffect(() => {
    loadFromStorage(setUserInputs, setChatMessages);
  }, []);

  // Handler functions
  /**
   * Update current section and index
   * @param {string} sectionId - The ID of the section to change to
   */
  const handleSectionChange = (sectionId) => {
    setCurrentSection(sectionId);
    setCurrentIndex(sections.findIndex(s => s.id === sectionId));
  };

  /**
   * Update user input
   * @param {string} section - The section ID to update
   * @param {string} value - The new value
   */
  const handleInputChange = (section, value) => {
    setUserInputs({
      ...userInputs,
      [section]: value
    });
  };

  /**
   * Handle checkbox changes for philosophy section
   * @param {string} id - The ID of the checkbox
   */
  const handleCheckboxChange = (id) => {
    const newPhilosophy = [...userInputs.philosophy];
    if (newPhilosophy.includes(id)) {
      const index = newPhilosophy.indexOf(id);
      newPhilosophy.splice(index, 1);
    } else {
      newPhilosophy.push(id);
    }
    setUserInputs({
      ...userInputs,
      philosophy: newPhilosophy
    });
  };

  /**
   * Send message to AI assistant
   */
  const handleSendMessage = async () => {
    if (currentMessage.trim() === '') return;
    
    // Add user message to chat
    const newMessages = [
      ...chatMessages[currentSection], 
      { role: 'user', content: currentMessage }
    ];
    
    setChatMessages({
      ...chatMessages,
      [currentSection]: newMessages
    });
    
    setCurrentMessage('');
    setLoading(true);
    
    try {
      // Call OpenAI API with the current message, context, and all sections.
      const aiResponse = await callOpenAI(currentMessage, currentSection, userInputs, sections);
      
      // Add AI response to chat
      const updatedMessages = [
        ...newMessages,
        { role: 'assistant', content: aiResponse }
      ];
      
      setChatMessages({
        ...chatMessages,
        [currentSection]: updatedMessages
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message to chat
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request. Please try again.' 
      };
      
      setChatMessages({
        ...chatMessages,
        [currentSection]: [...newMessages, errorMessage]
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle "First version finished" button click
   */
  const handleFirstVersionFinished = async () => {
    // Don't do anything if there's no content yet
    if (!userInputs[currentSection] && currentSection !== 'philosophy') return;
    if (currentSection === 'philosophy' && userInputs.philosophy.length === 0) return;
    
    setLoading(true);
    
    try {
      // Create an appropriate message based on the section
      let initialMessage = "I've finished my first version. Can you provide feedback?";
      
      // Add the initial message to chat
      const newMessages = [
        ...chatMessages[currentSection], 
        { role: 'user', content: initialMessage }
      ];
      
      setChatMessages({
        ...chatMessages,
        [currentSection]: newMessages
      });
      
      // Call OpenAI API with the initial message
      const aiResponse = await callOpenAI(initialMessage, currentSection, userInputs, sections);
      
      // Add AI response to chat
      const updatedMessages = [
        ...newMessages,
        { role: 'assistant', content: aiResponse }
      ];
      
      setChatMessages({
        ...chatMessages,
        [currentSection]: updatedMessages
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message to chat
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request. Please try again.' 
      };
      
      setChatMessages({
        ...chatMessages,
        [currentSection]: [...chatMessages[currentSection], { role: 'user', content: "I've finished my first version. Can you provide feedback?" }, errorMessage]
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset project
   */
  const resetProject = () => {
    // Clear all user inputs
    setUserInputs({
      question: '',
      hypothesis: '',
      philosophy: [],
      experiment: '',
      analysis: '',
      process: '',
      abstract: ''
    });
    
    // Clear all chat messages
    const freshChatMessages = {};
    sections.forEach(section => {
      freshChatMessages[section.id] = [];
    });
    setChatMessages(freshChatMessages);
    
    // Reset to first section
    handleSectionChange(sections[0].id);
    
    // Clear localStorage
    clearStorage();
  };

  /**
   * Go to the next section
   */
  const goToNextSection = () => {
    const newIndex = currentIndex + 1;
    if (newIndex < sections.length) {
      handleSectionChange(sections[newIndex].id);
    }
  };

  /**
   * Go to the previous section
   */
  const goToPreviousSection = () => {
    const newIndex = currentIndex - 1;
    if (newIndex >= 0) {
      handleSectionChange(sections[newIndex].id);
    }
  };
  
  return {
    currentSection,
    currentIndex,
    userInputs,
    chatMessages,
    currentMessage,
    loading,
    showConfirmDialog,
    setCurrentMessage,
    setShowConfirmDialog,
    handleSectionChange,
    handleInputChange,
    handleCheckboxChange,
    handleSendMessage,
    handleFirstVersionFinished,
    resetProject,
    goToNextSection,
    goToPreviousSection
  };
};

export default usePaperPlanner;
