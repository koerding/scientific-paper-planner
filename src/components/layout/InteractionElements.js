// FILE: src/components/layout/InteractionElements.js
import React from 'react';
import ModernChatInterface from '../chat/ModernChatInterface';

/**
 * Component for interactive UI elements like chat
 * Now receives chat state/actions as props from parent (originating from Zustand store)
 */
const InteractionElements = ({
  // Chat props (passed down from VerticalPaperPlannerApp)
  currentSection, // This is now currentChatSectionId
  currentSectionTitle,
  chatMessages,
  currentMessage,
  setCurrentMessage,
  handleSendMessage,
  loading, // This is now loadingFlags.chat
  currentSectionData, // Data for the current chat section

  // Other props (kept for compatibility if needed, but likely unused now)
  // handleMagicClick, userInputs, lastImprovementTime, significantEditsMade
}) => {
  return (
    <>
      {/* Chat interface - Pass props directly */}
      <ModernChatInterface
        currentSection={currentSection}
        currentSectionTitle={currentSectionTitle}
        chatMessages={chatMessages}
        currentMessage={currentMessage}
        setCurrentMessage={setCurrentMessage} // Pass action
        handleSendMessage={handleSendMessage} // Pass action
        loading={loading} // Pass chat loading state
        currentSectionData={currentSectionData} // Pass relevant section data
        // onboardingStep prop can be added if needed, selected from store in parent
      />
    </>
  );
};

export default InteractionElements;
