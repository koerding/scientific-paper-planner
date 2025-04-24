// FILE: src/components/layout/InteractionElements.js
import React from 'react';
import ModernChatInterface from '../chat/ModernChatInterface';

/**
 * Component for interactive UI elements like chat
 * Updated to access loading state directly from the store instead of props
 */
const InteractionElements = ({
  // Chat props (passed down from VerticalPaperPlannerApp)
  currentSection,
  currentSectionTitle,
  chatMessages,
  currentMessage,
  setCurrentMessage,
  handleSendMessage,
  loading, // This is the specific chat loading state
  currentSectionData,
  onboardingStep,
}) => {
  return (
    <>
      {/* Chat interface - Pass props directly */}
      <ModernChatInterface
        currentSection={currentSection}
        currentSectionTitle={currentSectionTitle}
        chatMessages={chatMessages}
        currentMessage={currentMessage}
        setCurrentMessage={setCurrentMessage}
        handleSendMessage={handleSendMessage}
        loading={loading} // Pass chat-specific loading flag
        currentSectionData={currentSectionData}
        onboardingStep={onboardingStep}
      />
    </>
  );
};

export default InteractionElements;
