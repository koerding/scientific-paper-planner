// FILE: src/components/layout/InteractionElements.js
import React from 'react';
import ModernChatInterface from '../chat/ModernChatInterface';

/**
 * Component for interactive UI elements like chat
 * Now receives chat state/actions AND the global busy state as props
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
  isAiBusy, // This is the GLOBAL AI busy state
  currentSectionData,
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
        isAiBusy={isAiBusy} // Pass the GLOBAL busy flag
        currentSectionData={currentSectionData}
      />
    </>
  );
};

export default InteractionElements;
