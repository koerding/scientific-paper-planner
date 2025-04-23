// FILE: src/components/chat/ModernChatInterface.js
// Modified to include a proper title bar in the expanded chat interface

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { trackChatInteraction, trackPageView } from '../../utils/analyticsUtils';
import '../../styles/PaperPlanner.css'; // Ensure styles are imported

const ModernChatInterface = ({
  currentSection, // Section ID string
  currentSectionTitle, // Title string
  chatMessages, // Object like { sectionId: [messages] }
  currentMessage, // String for input
  setCurrentMessage, // Function to update input
  handleSendMessage, // Function to send message
  loading, // Boolean for thinking indicator
  currentSectionData, // The full section object (can be null/undefined initially)
  onboardingStep // Optional onboarding step number
}) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const messagesEndRef = useRef(null);
  const previousSectionRef = useRef(null);

  // Prop check logging (keep for debugging if needed)
  useEffect(() => {
    // console.log('[ModernChatInterface] Props Update:', { /* ... props ... */ });
  }, [/* ... dependencies ... */]);

  // Scroll to bottom effect (unchanged)
  useEffect(() => {
    if (!isMinimized && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isMinimized, currentSection]);

  // Section tracking effect (unchanged)
  useEffect(() => {
    if (currentSection && currentSection !== previousSectionRef.current) {
      previousSectionRef.current = currentSection;
    }
  }, [currentSection]);

  // Format time (unchanged)
  const formatTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Toggle chat visibility (unchanged)
  const toggleChat = () => {
    if (!currentSection) { console.warn("[ModernChatInterface] Cannot toggle chat - currentSection ID is invalid."); return; }
    const newState = !isMinimized;
    setIsMinimized(newState);
    if (!newState) { trackPageView(`/chat/${currentSection}`); trackChatInteraction(currentSection, chatMessages?.[currentSection]?.length || 0); }
  };

  // Send message wrapper (unchanged)
  const handleSendMessageWithTracking = () => {
     if (!currentSection || loading || currentMessage.trim() === '') return;
     trackChatInteraction(currentSection, (chatMessages?.[currentSection]?.length || 0) + 1);
     handleSendMessage();
   };

  const showChatHighlight = onboardingStep === 3;
  const safeChatMessages = currentSection && chatMessages?.[currentSection] ? chatMessages[currentSection] : [];

  // Early return check (unchanged)
  if (!currentSection || !currentSectionData) {
     // console.warn(`[ModernChatInterface] Rendering suspended - missing currentSection (${currentSection}) or currentSectionData (${!!currentSectionData})`);
     return null;
   }

  // --- Render (only if currentSection and currentSectionData are valid) ---
  return (
    <>
      {/* Minimized Chat Icon Button */}
       {isMinimized && (
         <div
           className={`fixed bottom-6 right-6 z-50 ${loading ? 'cursor-wait' : 'cursor-pointer'} ${showChatHighlight ? 'onboarding-highlight-chat' : ''}`}
           style={{ transform: 'translateZ(0)' }}
         >
           <button
             onClick={loading ? null : toggleChat}
             disabled={loading}
             className={`flex items-center justify-center px-4 py-3 rounded-full shadow-lg transition-colors text-white font-medium ${loading ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'}`}
             title={`Ask AI for help on ${currentSectionTitle}`}
             aria-label="Open chat"
           >
                {/* Minimized Button Content (Loading/Default Icons) */}
                {loading ? ( 
                  <div className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </div>
                ) : ( 
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span>Let's talk about {currentSectionTitle}</span>
                  </div>
                )}
           </button>
           {showChatHighlight && (<div className="onboarding-tooltip onboarding-tooltip-chat">Stuck? Ask AI for help anytime.</div>)}
         </div>
       )}

      {/* Expanded chat interface (Code unchanged from previous version) */}
      <div
        className={`fixed shadow-lg bg-white rounded-t-lg overflow-hidden transition-all duration-300 ease-in-out ${
          isMinimized ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'
        }`}
        style={{ /* Styles unchanged */
            bottom: '0', right: '0', width: 'min(950px, 95vw)', height: 'min(600px, 75vh)',
            transform: isMinimized ? 'translateZ(0) translateY(20px)' : 'translateZ(0)',
            maxHeight: 'calc(100vh - 48px)', zIndex: 1000
        }}
      >
        {/* Conditional Rendering Check */}
        {currentSection && currentSectionData ? (
            <>
              {/* Chat header - MODIFIED TO INCLUDE TITLE */}
              <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center chat-header">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span className="font-medium text-white">Let's talk about {currentSectionTitle}</span>
                </div>
                <button 
                  onClick={toggleChat}
                  className="text-white hover:text-gray-200 focus:outline-none"
                  aria-label="Minimize chat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                  </svg>
                </button>
              </div>
              {/* Chat messages container */}
              <div className="flex flex-col h-full" style={{ height: 'calc(100% - 56px)' }}>
                 <div className="flex-grow overflow-y-auto p-4">
                    {safeChatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <div className="mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <p className="text-center">Ask me about your <span className="font-medium">{currentSectionTitle}</span> section.</p>
                        <p className="text-center text-sm mt-1">I can help with ideas, feedback, or answer questions.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {safeChatMessages.map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                              <div className="ai-avatar">AI</div>
                            )}
                            <div className={`message-bubble ${msg.role === 'user' ? 'user-message' : 'ai-message'}`}>
                              <div className="message-content">
                                <ReactMarkdown className="prose prose-sm">{msg.content}</ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        ))}
                        {loading && (
                          <div className="flex justify-start">
                            <div className="ai-avatar">AI</div>
                            <div className="message-bubble ai-message">
                              <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                              </div>
                            </div>
                          </div>
                        )}
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
                        disabled={loading}
                      />
                      <button
                        onClick={handleSendMessageWithTracking}
                        disabled={currentMessage.trim() === '' || loading}
                        className={`px-4 flex items-center justify-center ${
                          currentMessage.trim() === '' || loading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {loading ? (
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
              </div>
            </>
        ) : (
            <div className="p-4 text-center text-gray-500">Loading section data...</div>
        )}
      </div>

      {/* Inline styles (unchanged) */}
      <style jsx>{` /* CSS unchanged */ `}</style>
    </>
  );
};

export default ModernChatInterface;
