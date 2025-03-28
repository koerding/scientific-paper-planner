import React, { useState, useEffect } from 'react';
import ModernPaperPlannerApp from './ModernPaperPlannerApp';
import sectionContent from '../../sectionContent.json';
import './PaperPlanner.css';

/**
 * Main entry point for the Paper Planner
 */
const PaperPlannerApp = () => {
  const { sections, philosophyOptions } = sectionContent;
  
  // State
  const [userInputs, setUserInputs] = useState({
    question: '',
    hypothesis: '',
    philosophy: [],
    experiment: '',
    analysis: '',
    process: '',
    abstract: ''
  });
  const [currentSection, setCurrentSection] = useState(sections[0].id);
  const [currentIndex, setCurrentIndex] = useState(0);
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
  }, []);

  // Load saved data from localStorage
  useEffect(() => {
    try {
      const savedInputs = localStorage.getItem('paperPlannerData');
      const savedChat = localStorage.getItem('paperPlannerChat');
      
      if (savedInputs) {
        setUserInputs(JSON.parse(savedInputs));
      }
      
      if (savedChat) {
        setChatMessages(JSON.parse(savedChat));
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    try {
      localStorage.setItem('paperPlannerData', JSON.stringify(userInputs));
      localStorage.setItem('paperPlannerChat', JSON.stringify(chatMessages));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [userInputs, chatMessages]);

  // Handler functions
  const handleSectionChange = (sectionId) => {
    setCurrentSection(sectionId);
    setCurrentIndex(sections.findIndex(s => s.id === sectionId));
  };

  const handleInputChange = (section, value) => {
    setUserInputs({
      ...userInputs,
      [section]: value
    });
  };

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

  // Send regular chat message
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
      // For a regular chat message, just pass the message as-is
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

  // Handle "First version finished" button with llmInstructions
  const handleFirstVersionFinished = async () => {
    // Don't do anything if there's no content yet
    if (!userInputs[currentSection] && currentSection !== 'philosophy') return;
    if (currentSection === 'philosophy' && userInputs.philosophy.length === 0) return;
    
    setLoading(true);
    
    try {
      // Create a simple message to show to the user in the chat UI
      const displayMessage = "I've finished my first version. Can you provide feedback?";
      
      // Get the detailed instructions for the AI from the JSON configuration
      const currentSectionObj = sections.find(s => s.id === currentSection);
      const aiInstructions = currentSectionObj.llmInstructions;
      
      // Add the simple message to the chat UI for the user to see
      const newMessages = [
        ...chatMessages[currentSection], 
        { role: 'user', content: displayMessage }
      ];
      
      setChatMessages({
        ...chatMessages,
        [currentSection]: newMessages
      });
      
      // For now, simulate API call
      // In production, replace with actual API call: await callOpenAI(aiInstructions, currentSection, userInputs, sections);
      // Simulate API delay
      setTimeout(() => {
        // Add mock AI response
        const aiResponse = "I've analyzed your first version based on the criteria for this section. Here's my feedback:\n\n1. Your content is well-structured and addresses the key points needed.\n\n2. Consider elaborating more on how your ideas connect to established research.\n\n3. Make sure your points directly support your main argument.\n\n4. The approach you've taken shows good understanding of the scientific method.";
        
        const updatedMessages = [
          ...newMessages,
          { role: 'assistant', content: aiResponse }
        ];
        
        setChatMessages({
          ...chatMessages,
          [currentSection]: updatedMessages
        });
        
        setLoading(false);
      }, 1500);
      
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
      setLoading(false);
    }
  };

  // Function to call the OpenAI API
  const callOpenAI = async (message, sectionId, inputs, sections) => {
    // In a real implementation, this would call your API
    // For now, we're simulating responses
    console.log(`Calling API with message: ${message}`);
    console.log(`Section: ${sectionId}`);
    console.log(`User input for this section: ${inputs[sectionId]}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return a generic response for testing
    return "This is a simulated AI response. In the actual implementation, this would be a real response from the API based on the prompt and user inputs.";
  };

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
    localStorage.removeItem('paperPlannerData');
    localStorage.removeItem('paperPlannerChat');
  };

  const goToNextSection = () => {
    const newIndex = currentIndex + 1;
    if (newIndex < sections.length) {
      handleSectionChange(sections[newIndex].id);
    }
  };

  const goToPreviousSection = () => {
    const newIndex = currentIndex - 1;
    if (newIndex >= 0) {
      handleSectionChange(sections[newIndex].id);
    }
  };

  // Hook for the Modern Paper Planner
  const usePaperPlannerHook = {
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

  return (
    <ModernPaperPlannerApp 
      sections={sections}
      philosophyOptions={philosophyOptions}
      usePaperPlannerHook={usePaperPlannerHook}
    />
  );
};

export default PaperPlannerApp;
