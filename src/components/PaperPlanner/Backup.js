import React, { useState, useEffect } from 'react';
import ModernInputArea from './ModernInputArea';
import ModernNavigation from './ModernNavigation';
import ModernChatInterface from './ModernChatInterface';
import ConfirmDialog from './ConfirmDialog';
import './PaperPlanner.css';

/**
 * Modern Paper Planner Application Component with contemporary design
 */
const ModernPaperPlannerApp = ({ 
  sections, 
  philosophyOptions,
  usePaperPlannerHook
}) => {
  const [darkMode, setDarkMode] = useState(false);
  
  const {
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
  } = usePaperPlannerHook;

  // Get current section object
  const currentSectionObj = sections.find(s => s.id === currentSection);
  
  // Theme toggler
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    // This would ideally update a CSS class on the body or a parent container
  };
  
  // Function to export project
  const exportProject = () => {
    const exportContent = `# Scientific Paper Project Plan

## 1. Research Question
${userInputs.question || "Not completed yet"}

## 2. Hypotheses
${userInputs.hypothesis || "Not completed yet"}

## 3. Research Philosophy
${userInputs.philosophy.map(id => `- ${philosophyOptions.find(o => o.id === id).label}`).join('\n') || "Not selected yet"}

## 4. Experimental Design
${userInputs.experiment || "Not completed yet"}

## 5. Data Analysis Plan
${userInputs.analysis || "Not completed yet"}

## 6. Process, Skills & Timeline
${userInputs.process || "Not completed yet"}

## 7. Abstract
${userInputs.abstract || "Not completed yet"}
`;

    // Create a blob with the content
    const blob = new Blob([exportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    // Create a link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scientific-paper-plan.md';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with app logo and theme toggle */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mr-3">
              SP
            </div>
            <div>
              <h1 className="text-2xl font-bold">Scientific Paper Planner</h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Design a hypothesis-based neuroscience project step-by-step
              </p>
            </div>
          </div>
          
          {/* Dark mode toggle */}
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
        
        {/* Navigation */}
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
              <ModernInputArea 
                section={currentSectionObj}
                userInputs={userInputs}
                philosophyOptions={philosophyOptions}
                handleInputChange={handleInputChange}
                handleCheckboxChange={handleCheckboxChange}
                handleFirstVersionFinished={handleFirstVersionFinished}
                loading={loading}
              />
            </div>
            
            {/* Chat Interface - Takes 2/5 of the space on large screens */}
            <div className="lg:col-span-2">
              <ModernChatInterface
                currentSection={currentSection}
                chatMessages={chatMessages}
                currentMessage={currentMessage}
                setCurrentMessage={setCurrentMessage}
                handleSendMessage={handleSendMessage}
                loading={loading}
              />
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mt-12 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} pt-6`}>
          <p>Scientific Paper Planner • Designed for Researchers • {new Date().getFullYear()}</p>
        </div>
        
        {/* Confirmation Dialog */}
        <ConfirmDialog
          showConfirmDialog={showConfirmDialog}
          setShowConfirmDialog={setShowConfirmDialog}
          resetProject={resetProject}
        />
      </div>
    </div>
  );
};

export default ModernPaperPlannerApp;
