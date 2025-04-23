// src/components/layout/InteractionElements.js

import React from 'react';
import ModernChatInterface from '../chat/ModernChatInterface';

/**
 * Component for interactive UI elements like chat
 * UPDATED: Removed FloatingMagicButton and ImprovementReminderToast
 */
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
        loading={loading}
        currentSectionData={currentSectionData}
      />
    </>
  );
};

export default InteractionElements;
