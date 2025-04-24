// FILE: src/components/layout/InteractionElements.js
import React from 'react';
import ModernChatInterface from '../chat/ModernChatInterface';

/**
 * Component for interactive UI elements like chat
 * REMOVED: No longer receives or passes down isAiBusy prop.
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
  // REMOVED: isAiBusy, // Prop removed
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
        // REMOVED: isAiBusy={isAiBusy} // Prop removed
        currentSectionData={currentSectionData}
      />
    </>
  );
};

export default InteractionElements;
