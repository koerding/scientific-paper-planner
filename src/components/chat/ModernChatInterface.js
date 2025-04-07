// FILE: src/components/chat/ModernChatInterface.js

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import '../../styles/PaperPlanner.css';

/**
 * Modernized chat interface with fixed layout issues
 * FIXES:
 * - Fixed syntax error on line 67
 * - Consistent positioning relative to footer
 * - Improved z-index handling
 * - Fixed transition issues
 * - Better handling of magic button overlap
 * - FIXED: Z-index increased to be on top of the improve instructions button
 * - FIXED: Vertically aligned header icon and text
 * - FIXED: Added thinking indicator where assistant's response will appear
 */
const ModernChatInterface = ({
  currentSection,
  currentSectionTitle,
  chatMessages,
  currentMessage,
  setCurrentMessage,
  handleSendMessage,
  loading,
  currentSectionData,
  onboardingStep
}) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const messagesEndRef = useRef(null);
  const previousSectionRef = useRef(null);
  const chatIconRef = useRef(null);

  // Scroll to bottom when messages change or chat is opened
  useEffect(() => {
    if (!isMinimized && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isMinimized, currentSection]);

  // Track section changes
  useEffect(() => {
    if (currentSection && currentSection !== previousSectionRef.current) {
      previousSectionRef.current = currentSection;
    }
  }, [currentSection]);

  // Format timestamp for messages
  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Toggle chat window visibility
  const toggleChat = () => {
    setIsMinimized(!isMinimized);
  };

  // Determine if the chat icon should be highlighted
  const showChatHighlight = onboardingStep === 3;

  return (
    <>
      {/* Minimized chat icon - improved positioning */}
      {isMinimized && (
        <div
          ref={chatIconRef}
          className={`fixed bottom-6 right-6 z-50 cursor-pointer ${showChatHighlight ? 'onboarding-highlight-chat' : ''}`}
          onClick={toggleChat}
          style={{ transform: 'translateZ(0)' }}
        >
          <div className="w-16 h-16 bg-indigo-600 rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
          {/* Onboarding Tooltip - improved positioning */}
          {showChatHighlight && (
            <div className="onboarding-tooltip onboarding-tooltip-chat">
              Stuck? Ask AI for help anytime.
            </div>
          )}
        </div>
      )}

      {/* Expanded chat interface - fixed positioning and transitions */}
      <div
        className={`fixed shadow-lg bg-white rounded-t-lg overflow-hidden transition-all duration-300 ease-in-out ${
          isMinimized ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'
        }`}
        style={{
          bottom: '0',
          right: '0',
          width: 'min(950px, 95vw)',
          height: 'min(600px, 75vh)',
          transform: isMinimized ? 'translateZ(0) translateY(20px)' : 'translateZ(0)',
          maxHeight: 'calc(100vh - 48px)',
          zIndex: 1000 // FIXED: Increased z-index to be higher than the improve instructions button (z-40)
        }}
      >
        {/* Chat header - FIXED: properly centered alignment */}
        <div className="bg-indigo-600 text-white px-4 py-3 flex justify-between items-center chat-header">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-indigo-600 font-bold mr-3">
              AI
            </div>
            <h3 className="font-medium text-lg truncate pr-2">
              AI Research Assistant - Talk about {currentSectionTitle}
            </h3>
          </div>
          <button
            onClick={toggleChat}
            className="text-white hover:text-gray-200 focus:outline-none"
            aria-label="Minimize chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Chat messages - fixed height calculation */}
        <div className="flex flex-col h-full" style={{ height: 'calc(100% - 56px)' }}>
          <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
            {!currentSection || !chatMessages[currentSection] || chatMessages[currentSection].length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-lg">No messages yet</p>
                <p className="text-sm">Ask a question about your {currentSectionTitle || 'research'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Render all existing messages first */}
                {chatMessages[currentSection].map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
                    <div className={`message-bubble ${msg.role === 'user' ? 'user-message' : 'ai-message'} max-w-3xl`}>
                      <div className="text-sm mb-1 opacity-75">
                        {msg.role === 'user' ? 'You' : 'AI Assistant'} • {formatTime()}
                      </div>
                      <div className={`message-content ${msg.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                        {msg.role === 'user' ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* FIXED: Show thinking indicator after the last message if loading */}
                {loading && (
                  <div className="flex justify-start mb-2">
                    <div className="message-bubble ai-message max-w-3xl">
                      <div className="text-sm mb-1 opacity-75">
                        AI Assistant • {formatTime()}
                      </div>
                      <div className="message-content text-gray-800 flex items-center">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                        <span className="ml-2 text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Chat input - improved focus handling */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                className="flex-grow px-3 py-2 border border-gray-300 rounded-l-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ask a question..."
                onKeyPress={(e) => e.key === 'Enter' && !loading && currentMessage.trim() !== '' && handleSendMessage()}
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || currentMessage.trim() === ''}
                className={`px-3 py-2 rounded-r-lg ${
                  loading || currentMessage.trim() === '' 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 transition-colors'
                }`}
                aria-label="Send message"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModernChatInterface;
