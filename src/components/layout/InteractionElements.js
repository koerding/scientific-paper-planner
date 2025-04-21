// FILE: src/components/layout/InteractionElements.js

import React from 'react';
import ModernChatInterface from '../chat/ModernChatInterface';
import FloatingMagicButton from '../buttons/FloatingMagicButton';
import ImprovementReminderToast from '../toasts/ImprovementReminderToast';

/**
 * Component for interactive UI elements like chat, magic button, and reminders
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
  
  // Magic button props
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

      {/* Magic button for improving instructions */}
      <FloatingMagicButton
        handleMagicClick={handleMagicClick}
        loading={loading}
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
