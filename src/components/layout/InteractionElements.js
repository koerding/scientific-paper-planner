// src/components/layout/InteractionElements.js
import React from 'react';
import ModernChatInterface from '../chat/ModernChatInterface';

const InteractionElements = ({
  // Chat props
  currentSection,
  currentSectionTitle,
  chatMessages,
  currentMessage,
  setCurrentMessage,
  handleSendMessage,
  loading,
  currentSectionData,
  
  // Other props kept for compatibility but not used
  handleMagicClick,
  userInputs,
  lastImprovementTime,
  significantEditsMade
}) => {
  return (
    <>
      {/* Chat interface */}
      <ModernChatInterface
        currentSection={currentSection}
        currentSectionTitle={currentSectionTitle}
        chatMessages={chatMessages}
        currentMessage={currentMessage}
        setCurrentMessage={setCurrentMessage}
        handleSendMessage={handleSendMessage}
