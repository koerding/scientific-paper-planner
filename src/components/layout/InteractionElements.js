// FILE: src/components/layout/InteractionElements.js

import React from 'react';
import ModernChatInterface from '../chat/ModernChatInterface';
import ImprovementReminderToast from '../toasts/ImprovementReminderToast';

/**
 * Component for interactive UI elements like chat and reminders
 * UPDATED: Removed FloatingMagicButton
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
  
  // Magic button props (kept for ImprovementReminderToast)
  handleMagicClick,
  
  // Reminder toast props
  userInputs,
  lastImprovementTime,
  significantEditsMade
}) => {
  return (
    <>
      {/* Improvement reminder toast */}
      <ImprovementReminderToast
        userInputs={userInputs}
        lastImprovementTime={lastImprovementTime}
        significantEditsMade={significantEditsMade}
        handleMagicClick={handleMagicClick}
      />

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
