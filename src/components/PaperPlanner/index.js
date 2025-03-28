import React from 'react';
import sectionContent from '../../sectionContent.json';
import usePaperPlanner from '../../hooks/usePaperPlanner';
import InputArea from './InputArea';
import ChatInterface from './ChatInterface';
import Navigation from './Navigation';
import ConfirmDialog from './ConfirmDialog';
import { exportProject } from '../../utils/exportUtils';

/**
 * Main Paper Planner Application Component
 */
const PaperPlannerApp = () => {
  const { sections, philosophyOptions } = sectionContent;
  
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
  } = usePaperPlanner(sections);

  // Get current section object
  const currentSectionObj = sections.find(s => s.id === currentSection);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-lg p-6">
        {/* Title and description */}
        <h1 className="text-2xl font-bold mb-2 text-gray-800">
          Scientific Paper Planner
        </h1>
        <p className="text-gray-600 mb-6">
          Design a hypothesis-based neuroscience project by completing each section step-by-step.
        </p>
        
        {/* Navigation */}
        <Navigation 
          sections={sections}
          currentSection={currentSection}
          currentIndex={currentIndex}
          userInputs={userInputs}
          handleSectionChange={handleSectionChange}
          setShowConfirmDialog={setShowConfirmDialog}
          exportProject={() => exportProject(userInputs, philosophyOptions)}
          goToNextSection={goToNextSection}
          goToPreviousSection={goToPreviousSection}
        />
        
        {/* Content Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 flex items-center">
            <span className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-blue-600 text-white mr-2">
              {currentIndex + 1}
            </span>
            {currentSectionObj.title}
          </h2>
          
          {/* Input Area */}
          <InputArea 
            section={currentSectionObj}
            userInputs={userInputs}
            philosophyOptions={philosophyOptions}
            handleInputChange={handleInputChange}
            handleCheckboxChange={handleCheckboxChange}
            handleFirstVersionFinished={handleFirstVersionFinished}
            loading={loading}
          />
          
          {/* Chat Interface */}
          <ChatInterface
            currentSection={currentSection}
            chatMessages={chatMessages}
            currentMessage={currentMessage}
            setCurrentMessage={setCurrentMessage}
            handleSendMessage={handleSendMessage}
            loading={loading}
          />
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

export default PaperPlannerApp;
