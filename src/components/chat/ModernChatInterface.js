// FILE: src/components/chat/ModernChatInterface.js
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { trackChatInteraction, trackPageView } from '../../utils/analyticsUtils';
import useAppStore from '../../store/appStore'; // Import store
import '../../styles/PaperPlanner.css';

const ModernChatInterface = ({
  currentSection,
  currentSectionTitle,
  chatMessages,
  currentMessage,
  setCurrentMessage,
  handleSendMessage,
  loading, // Specific loading state for CHAT operations
  // REMOVED: isAiBusy, // Prop removed
  currentSectionData,
  onboardingStep // Assuming this comes from somewhere else if needed
}) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const messagesEndRef = useRef(null);
  const previousSectionRef = useRef(null);

  // --- Get global loading state directly from store ---
  const isAnyStoreLoading = useAppStore((state) => state.isAnyLoading());
  // ---

  // Scroll to bottom effect
  useEffect(() => { /* ... */ }, [chatMessages, isMinimized, currentSection]);
  // Section tracking effect
  useEffect(() => { /* ... */ }, [currentSection]);

  // Toggle chat visibility - use isAnyStoreLoading
  const toggleChat = () => {
    if (!currentSection || isAnyStoreLoading) return; // Prevent toggling if any AI is busy
    const newState = !isMinimized;
    setIsMinimized(newState);
    if (!newState) { /* track events */ }
  };

  // Send message wrapper - use isAnyStoreLoading
  const handleSendMessageWithTracking = () => {
     // Disable sending if chat is specifically loading OR if any store loading flag is true
     if (!currentSection || loading || isAnyStoreLoading || currentMessage.trim() === '') return;
     trackChatInteraction(currentSection, (chatMessages?.[currentSection]?.length || 0) + 1);
     handleSendMessage();
   };

  const showChatHighlight = onboardingStep === 3;
  const safeChatMessages = currentSection && chatMessages?.[currentSection] ? chatMessages[currentSection] : [];

  if (!currentSection || !currentSectionData) {
     return null;
   }

   // Determine if the minimized button should be disabled - use isAnyStoreLoading
   const isButtonDisabled = loading || isAnyStoreLoading; // Disable if chat OR *any* other AI is busy
   const buttonBgClass = isButtonDisabled ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700';


  return (
    <>
      {/* Minimized Chat Icon Button */}
       {isMinimized && (
         <div
           className={`fixed bottom-6 right-6 z-50 ${isButtonDisabled ? 'cursor-wait' : 'cursor-pointer'} ${showChatHighlight ? 'onboarding-highlight-chat' : ''}`}
           style={{ transform: 'translateZ(0)' }}
         >
           <button
             onClick={toggleChat}
             disabled={isButtonDisabled} // Disable based on combined condition
             className={`flex items-center justify-center px-4 py-3 rounded-full shadow-lg transition-colors text-white font-medium ${buttonBgClass}`}
             title={isAnyStoreLoading ? "AI is busy..." : `Ask AI for help on ${currentSectionTitle}`}
             aria-label="Open chat"
           >
                {/* Content depends on specific chat loading state */}
                {loading ? ( // Show spinner only if chat itself is loading
                  <div className="flex items-center">{/* Spinner */} <span>Processing...</span></div>
                ) : (
                  <div className="flex items-center">{/* Chat Icon */}
                    {/* Show generic "AI Busy" text if disabled but not specifically chat loading */}
                    <span>{isAnyStoreLoading ? "AI Busy..." : `Let's talk about ${currentSectionTitle}`}</span>
                  </div>
                )}
           </button>
           {/* Tooltip */}
         </div>
       )}

      {/* Expanded chat interface */}
      <div
        className={`fixed shadow-lg bg-white rounded-t-lg overflow-hidden transition-all duration-300 ease-in-out ${
          isMinimized ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'
        }`}
        style={{ /* styles */ }}
      >
        {currentSection && currentSectionData ? (
            <>
              {/* Chat header */}
              <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center chat-header">
                {/* Header content */}
                <button onClick={toggleChat} /* ... */> {/* Close Icon */} </button>
              </div>
              {/* Chat messages container */}
              <div className="flex flex-col h-full" style={{ height: 'calc(100% - 56px)' }}>
                 <div className="flex-grow overflow-y-auto p-4">
                    {/* Messages rendering */}
                    {safeChatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500"> {/* Empty State */} </div>
                    ) : (
                      <div className="space-y-4">
                        {safeChatMessages.map((msg, idx) => ( /* Message Bubbles */ ))}
                        {/* Show typing indicator only if chat itself is loading */}
                        {loading && ( /* Typing Indicator */ )}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                 </div>
                 {/* Chat input */}
                 <div className="p-3 border-t border-gray-200 bg-white">
                    <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                      <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessageWithTracking()}
                        placeholder={`Ask about ${currentSectionTitle}...`}
                        className="flex-grow px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        // Disable input if chat is loading OR any store loading flag is true
                        disabled={loading || isAnyStoreLoading}
                      />
                      <button
                        onClick={handleSendMessageWithTracking}
                        // Disable send button similarly
                        disabled={currentMessage.trim() === '' || loading || isAnyStoreLoading}
                        className={`px-4 flex items-center justify-center transition-colors ${
                          currentMessage.trim() === '' || loading || isAnyStoreLoading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {/* Show spinner only if chat itself is loading */}
                        {loading ? ( /* Spinner Icon */ ) : ( /* Send Icon */ )}
                      </button>
                    </div>
                  </div>
              </div>
            </>
        ) : (
            <div className="p-4 text-center text-gray-500">Loading section data...</div>
        )}
      </div>
    </>
  );
};

export default ModernChatInterface;
