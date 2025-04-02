// src/components/PaperPlannerApp.js
// Main app component for the Scientific Paper Planner

import React, { useState, useEffect } from 'react';
import { sections, philosophyOptions } from '../data/sectionConfig';
import SectionContent from './SectionContent';
import InstructionsPanel from './InstructionsPanel';
import ModernChatInterface from './ModernChatInterface';
import ModernNavigation from './ModernNavigation';
import ConfirmDialog from './ConfirmDialog';
import { callOpenAI } from '../services/openaiService';

/**
 * Main Paper Planner App Component
 * Uses all JSON config content and maintains consistent container widths
 */
const PaperPlannerApp = () => {
  // Get current section object
  const getCurrentSectionObject = () => {
    return sections.find(s => s.id === currentSection) || sections[0];
  };
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
  const [darkMode, setDarkMode] = useState(false);
  const [researchApproach, setResearchApproach] = useState(() => 
    localStorage.getItem('researchApproach') || 'hypothesis');

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
        sections, 
        philosophyOptions
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
    if (!userInputs[currentSection] && currentSection !== 'philosophy') return;
    if (currentSection === 'philosophy' && userInputs.philosophy.length === 0) return;
    
    setLoading(true);
    
    try {
      // Simple message for the UI
      const displayMessage = "I've finished my first version. Can you provide feedback?";
      
      // Get detailed instructions from JSON
      const currentSectionObj = sections.find(s => s.id === currentSection);
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
      
      // Call OpenAI API with the detailed instructions and pass the philosophyOptions
      const aiResponse = await callOpenAI(
        aiInstructions, 
        currentSection, 
        userInputs, 
        sections, 
        philosophyOptions
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
  
  // Toggle dark mode
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  // Function to export project
  const exportProject = () => {
    const exportContent = `# ${researchApproach === 'hypothesis' ? 'Hypothesis-Driven' : 
                             researchApproach === 'exploratory' ? 'Exploratory' : 
                             researchApproach === 'needs' ? 'Needs-Driven' : 
                             'Scientific'} Research Project Plan

## Research Approach
${researchApproach === 'hypothesis' ? 'Hypothesis-Driven Research: Testing specific predictions derived from theory.' : 
  researchApproach === 'exploratory' ? 'Exploratory Research: Discovering patterns and generating new hypotheses.' : 
  researchApproach === 'needs' ? 'Needs-Driven Research: Developing solutions to specific problems.' : 
  'Not specified'}

## 1. Research Question
${userInputs.question || "Not completed yet"}

## 2. ${researchApproach === 'hypothesis' ? 'Hypotheses' : 
       researchApproach === 'exploratory' ? 'Exploration Areas' : 
       researchApproach === 'needs' ? 'Need Statement' : 
       'Hypothesis or Research Focus'}
${userInputs.hypothesis || "Not completed yet"}

## 3. Research Philosophy
${userInputs.philosophy.map(id => `- ${philosophyOptions.find(o => o.id === id).label}`).join('\n') || "Not selected yet"}

## 4. ${researchApproach === 'hypothesis' ? 'Experimental Design' : 
       researchApproach === 'exploratory' ? 'Data Collection Approach' : 
       researchApproach === 'needs' ? 'Solution Approach' : 
       'Experimental Design'}
${userInputs.experiment || "Not completed yet"}

## 5. Data Analysis Plan
${userInputs.analysis || "Not completed yet"}

## 6. Process, Skills & Timeline
${userInputs.process || "Not completed yet"}

## 7. ${researchApproach === 'hypothesis' ? 'Abstract' : 
       researchApproach === 'exploratory' ? 'Potential Outcomes' : 
       researchApproach === 'needs' ? 'Expected Impact' : 
       'Abstract or Summary'}
${userInputs.abstract || "Not completed yet"}
`;

    // Create a blob with the content
    const blob = new Blob([exportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    // Create a link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${researchApproach || 'scientific'}-research-plan.md`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Get the current section object for rendering
  const currentSectionObj = getCurrentSectionObject();
  
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      {/* Use full-width container for the header that matches site width */}
      <header className="bg-white shadow-sm">
        <div className="w-full max-w-screen-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mr-3">
              SP
            </div>
            <div>
              <h1 className="text-2xl font-bold">Scientific Paper Planner</h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Design a {researchApproach}-based research project step-by-step
              </p>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={exportProject}
              className="px-3 py-2 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Export
              </span>
            </button>
            
            <button
              onClick={() => setShowConfirmDialog(true)}
              className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New
              </span>
            </button>
            
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-200 text-gray-700'}`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Section navigation tabs */}
        <div className="w-full max-w-screen-2xl mx-auto px-4 pb-2">
          <div className="flex overflow-x-auto space-x-2 py-2">
            {sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                className={`px-3 py-1 text-sm rounded-full whitespace-nowrap 
                  ${currentSection === section.id 
                    ? 'bg-indigo-100 text-indigo-800 font-medium' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                `}
              >
                {index + 1}. {section.title}
              </button>
            ))}
          </div>
        </div>
      </header>
      
      {/* Main content - match width with header */}
      <main className="w-full max-w-screen-2xl mx-auto px-4 py-8">
        <ModernNavigation 
          sections={sections}
          currentSection={currentSection}
          currentIndex={currentIndex}
          userInputs={userInputs}
          handleSectionChange={handleSectionChange}
          setShowConfirmDialog={setShowConfirmDialog}
          exportProject={exportProject}
          goToNextSection={goToNextSection}
          goToPreviousSection={goToPreviousSection}
        />
        
        {/* Content Section */}
        <div className="mb-8">
          <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium mr-2">
                {currentIndex + 1}
              </div>
              {currentSectionObj.title}
            </div>
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Input Area - Takes 3/5 of the space on large screens */}
            <div className="lg:col-span-3">
              <SectionContent 
                section={currentSectionObj}
                userInputs={userInputs}
                philosophyOptions={philosophyOptions}
                handleInputChange={handleInputChange}
                handleCheckboxChange={handleCheckboxChange}
                handleFirstVersionFinished={handleFirstVersionFinished}
                loading={loading}
                researchApproach={researchApproach}
              />
            </div>
            
            {/* Right side panel - Takes 2/5 of the space on large screens */}
            <div className="lg:col-span-2 space-y-6">
              {/* Instructions Panel */}
              <InstructionsPanel section={currentSectionObj} />
              
              {/* Chat Interface */}
              <ModernChatInterface
                currentSection={currentSection}
                chatMessages={chatMessages}
                currentMessage={currentMessage}
                setCurrentMessage={setCurrentMessage}
                handleSendMessage={handleSendMessage}
                loading={loading}
                researchApproach={researchApproach}
              />
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mt-12 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} pt-6`}>
          <p>Scientific Paper Planner • Designed for Researchers • {new Date().getFullYear()}</p>
        </footer>
      </main>
      
      {/* Confirmation Dialog */}
      <ConfirmDialog
        showConfirmDialog={showConfirmDialog}
        setShowConfirmDialog={setShowConfirmDialog}
        resetProject={resetProject}
      />
    </div>
  );
