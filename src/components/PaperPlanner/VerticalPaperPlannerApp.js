import React, { useState, useEffect } from 'react';
import VerticalPaperPlannerApp from './VerticalPaperPlannerApp'; // Using your existing component
import sectionContent from '../../data/sectionContent.json';  
import { callOpenAI } from '../../services/openaiService';
import { exportProject as exportProjectFunction, validateProjectData } from '../../utils/exportUtils';
import '../../styles/PaperPlanner.css';

/**
 * Main entry point for the Paper Planner
 * Contains core state management and API calls
 * UPDATED: Added load project functionality with fixed implementation
 */
const PaperPlannerApp = () => {
  // State - Pre-fill with templates from sectionContent
  const initialState = {};
  sectionContent.sections.forEach(section => {
    if (section && section.id) {
      // Use placeholder as initial content
      initialState[section.id] = section.placeholder || '';
    }
  });

  // Initialize states
  const [userInputs, setUserInputs] = useState(initialState);
  const [currentSection, setCurrentSection] = useState(sectionContent.sections[0].id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [chatMessages, setChatMessages] = useState({});
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Initialize chat messages for each section
  useEffect(() => {
    const initialChatMessages = {};
    sectionContent.sections.forEach(section => {
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
        const parsedInputs = JSON.parse(savedInputs);
        // Make sure we're not overwriting templates with empty values
        const mergedInputs = {...initialState};
        
        // Only use saved values if they exist and are different from templates
        Object.keys(parsedInputs).forEach(sectionId => {
          if (parsedInputs[sectionId] && parsedInputs[sectionId].trim() !== '') {
            mergedInputs[sectionId] = parsedInputs[sectionId];
          }
        });
        
        setUserInputs(mergedInputs);
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
    setCurrentIndex(sectionContent.sections.findIndex(s => s.id === sectionId));
  };

  const handleInputChange = (section, value) => {
    setUserInputs({
      ...userInputs,
      [section]: value
    });
  };

  // Send regular chat message with full context
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
      // Call OpenAI API with the current message and all context
      const aiResponse = await callOpenAI(
        currentMessage, 
        currentSection, 
        userInputs, 
        sectionContent.sections
      );
      
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

  // Handle "First version finished" button with llmInstructions and all section context
  const handleFirstVersionFinished = async () => {
    // Don't do anything if there's no content yet
    if (!userInputs[currentSection]) return;
    
    setLoading(true);
    
    try {
      // Simple message for the UI
      const displayMessage = "I've finished my first version. Can you provide feedback?";
      
      // Get detailed instructions from JSON
      const currentSectionObj = sectionContent.sections.find(s => s.id === currentSection);
      const aiInstructions = currentSectionObj.llmInstructions;
      
      // Add the simple message to chat for the user to see
      const newMessages = [
        ...chatMessages[currentSection], 
        { role: 'user', content: displayMessage }
      ];
      
      setChatMessages({
        ...chatMessages,
        [currentSection]: newMessages
      });
      
      // Call OpenAI API with the detailed instructions
      const aiResponse = await callOpenAI(
        aiInstructions, 
        currentSection, 
        userInputs, 
        sectionContent.sections
      );
      
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

  const resetProject = () => {
    // Reset to template values
    const freshInputs = {};
    sectionContent.sections.forEach(section => {
      if (section && section.id) {
        freshInputs[section.id] = section.placeholder || '';
      }
    });
    setUserInputs(freshInputs);
    
    // Clear all chat messages
    const freshChatMessages = {};
    sectionContent.sections.forEach(section => {
      if (section && section.id) {
        freshChatMessages[section.id] = [];
      }
    });
    
    setChatMessages(freshChatMessages);
    setCurrentSection(sectionContent.sections[0].id);
    
    // Clear localStorage
    localStorage.removeItem('paperPlannerData');
    localStorage.removeItem('paperPlannerChat');
  };

  const goToNextSection = () => {
    const newIndex = currentIndex + 1;
    if (newIndex < sectionContent.sections.length) {
      handleSectionChange(sectionContent.sections[newIndex].id);
    }
  };

  const goToPreviousSection = () => {
    const newIndex = currentIndex - 1;
    if (newIndex >= 0) {
      handleSectionChange(sectionContent.sections[newIndex].id);
    }
  };

  // Function to export project
  const exportProject = () => {
    exportProjectFunction(userInputs, chatMessages, sectionContent);
  };

  // Function to load project from imported JSON file - FIXED VERSION
  const loadProject = (data) => {
    console.log("loadProject called with data:", data);
    
    // Check if data exists and has the correct structure
    if (!data || typeof data !== 'object') {
      console.error("Invalid data format: not an object");
      alert("Invalid project file format. Please select a valid project file.");
      return;
    }
    
    // Check for userInputs property
    if (!data.userInputs || typeof data.userInputs !== 'object') {
      console.error("Invalid data format: missing or invalid userInputs");
      alert("Invalid project file: missing user inputs data.");
      return;
    }
    
    // Confirm before loading
    if (window.confirm("Loading this project will replace your current work. Are you sure you want to continue?")) {
      try {
        console.log("Starting to load project data");
        
        // Load user inputs, ensuring we keep template values for any missing sections
        const mergedInputs = {...initialState};
        Object.keys(data.userInputs).forEach(sectionId => {
          if (data.userInputs[sectionId] && typeof data.userInputs[sectionId] === 'string' && data.userInputs[sectionId].trim() !== '') {
            console.log(`Loading content for section: ${sectionId}`);
            mergedInputs[sectionId] = data.userInputs[sectionId];
          }
        });
        console.log("Setting userInputs state");
        setUserInputs(mergedInputs);
        
        // Load chat messages, ensuring we have empty arrays for any missing sections
        const mergedChat = {};
        sectionContent.sections.forEach(section => {
          if (section && section.id) {
            mergedChat[section.id] = Array.isArray(data.chatMessages?.[section.id]) 
              ? data.chatMessages[section.id] 
              : [];
          }
        });
        console.log("Setting chatMessages state");
        setChatMessages(mergedChat);
        
        // Save to localStorage
        console.log("Saving to localStorage");
        localStorage.setItem('paperPlannerData', JSON.stringify(mergedInputs));
        localStorage.setItem('paperPlannerChat', JSON.stringify(mergedChat));
        
        console.log("Project loaded successfully");
        alert("Project loaded successfully!");
      } catch (error) {
        console.error("Error loading project:", error);
        alert(`Error loading project: ${error.message}. Please try again.`);
      }
    } else {
      console.log("Load cancelled by user");
    }
  };

  // Hook for the Paper Planner
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
    handleSendMessage,
    handleFirstVersionFinished,
    resetProject,
    goToNextSection,
    goToPreviousSection,
    exportProject,
    loadProject
  };

  // Use your existing VerticalPaperPlannerApp
  return (
    <VerticalPaperPlannerApp 
      usePaperPlannerHook={usePaperPlannerHook}
    />
  );
};

export default PaperPlannerApp;
