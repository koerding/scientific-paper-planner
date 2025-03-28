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

  // Mock AI response for now
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
    
    // Simulate API delay
    setTimeout(() => {
      // Add mock AI response
      const aiResponse = "I'll help you with that. What specific aspects would you like me to address?";
      
      const updatedMessages = [
        ...newMessages,
        { role: 'assistant', content: aiResponse }
      ];
      
      setChatMessages({
        ...chatMessages,
        [currentSection]: updatedMessages
      });
      
      setLoading(false);
    }, 1000);
  };

  const handleFirstVersionFinished = async () => {
    // Don't do anything if there's no content yet
    if (!userInputs[currentSection] && currentSection !== 'philosophy') return;
    if (currentSection === 'philosophy' && userInputs.philosophy.length === 0) return;
    
    setLoading(true);
    
    // Add the initial message to chat
    const newMessages = [
      ...chatMessages[currentSection], 
      { role: 'user', content: "I've finished my first version. Can you provide feedback?" }
    ];
    
    setChatMessages({
      ...chatMessages,
      [currentSection]: newMessages
    });
    
    // Simulate API delay
    setTimeout(() => {
      // Add mock AI response with feedback
      const aiResponse = "Great work on your first version! Here's some feedback to consider:\n\n1. Your approach is well-structured and covers the main points.\n\n2. Consider exploring the implications of your ideas more deeply.\n\n3. Make sure your content directly addresses the section's focus.";
      
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
