// FILE: src/components/chat/ModernChatInterface.js
// Key changes:
// 1. Use both isAnyStoreLoading and globalAiLoading for consistent UI
// 2. Enhanced loading state styles to be more visible

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import ReactGA from 'react-ga4';
import { trackChatInteraction, trackPageView } from '../../utils/analyticsUtils';
import useAppStore from '../../store/appStore';
import '../../styles/PaperPlanner.css';

const ModernChatInterface = ({
  currentSection,
  currentSectionTitle,
  chatMessages,
  currentMessage,
  setCurrentMessage,
  handleSendMessage,
  loading, // Specific loading state for CHAT operations
  currentSectionData,
  onboardingStep
}) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const messagesEndRef = useRef(null);
  const previousSectionRef = useRef(null);
  const inputRef = useRef(null);

  // Get both loading states from store for complete coverage
  const isAnyStoreLoading = useAppStore((state) => state.isAnyLoading());
  const globalAiLoading = useAppStore((state) => state.globalAiLoading);
  
  // Combined loading state for consistent UI
  const isButtonDisabled = isAnyStoreLoading || globalAiLoading;

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

  // Toggle chat window open/closed
  const toggleChat = () => {
    if (!currentSection || isButtonDisabled) return;
    
    const newState = !isMinimized;
    setIsMinimized(newState);
    
    // Only track when opening the chat
    if (!newState && ReactGA && typeof ReactGA.isInitialized === 'function' && ReactGA.isInitialized()) {
      trackPageView(`/chat/${currentSection}`);
      trackChatInteraction(currentSection, chatMessages?.[currentSection]?.length || 0);
    }
    
    // Focus input field when opening chat
    if (!newState) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
    }
  };

  // Handle sending messages with analytics tracking
  const handleSendMessageWithTracking = () => {
    if (!currentSection || loading || isButtonDisabled || currentMessage.trim() === '') return;
    
    // Track interaction if analytics is initialized
    if (ReactGA && typeof ReactGA.isInitialized === 'function' && ReactGA.isInitialized()) {
      trackChatInteraction(currentSection, (chatMessages?.[currentSection]?.length || 0) + 1);
    }
    
    handleSendMessage();
  };

  // Handle key press for sending messages
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessageWithTracking();
    }
  };

  const showChatHighlight = onboardingStep === 3;
  const safeChatMessages = currentSection && chatMessages?.[currentSection] ? chatMessages[currentSection] : [];

  if (!currentSection || !currentSectionData) {
    return null;
  }

  // Enhanced button style with more visible loading state
  const buttonBgClass = isButtonDisabled 
    ? 'bg-indigo-300 text-indigo-800 cursor-wait animate-pulse' 
    : 'bg-indigo-600 hover:bg-indigo-700';

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
            disabled={isButtonDisabled}
            className={`flex items-center justify-center px-4 py-3 rounded-full shadow-lg transition-colors text-white font-medium ${buttonBgClass}`}
            title={isButtonDisabled ? "AI is busy..." : `Ask AI for help on ${currentSectionTitle}`}
            aria-label="Open chat"
          >
            {(loading || isButtonDisabled) ? (
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
                <span>{`Let's talk about ${currentSectionTitle}`}</span>
              </div>
            )}
          </button>
          {showChatHighlight && (<div className="onboarding-tooltip onboarding-tooltip-chat">Stuck? Ask AI for help anytime.</div>)}
        </div>
      )}

      {/* Expanded chat interface */}
      <div
        className={`fixed shadow-lg rounded-lg overflow-hidden transition-all duration-300 ease-in-out bottom-4 right-4 w-[450px] max-w-[90vw] h-[600px] max-h-[80vh] ${
          isMinimized ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'
        }`}
        style={{ backgroundColor: '#ffffff', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}
      >
        {currentSection && currentSectionData ? (
          <>
            {/* Chat header */}
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
              <div className="flex-grow overflow-y-auto p-4" style={{ backgroundColor: '#f7f9fc' }}>
                {/* Messages rendering */}
                {safeChatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <div className="bg-gray-100 rounded-lg p-6 text-center max-w-xs">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <p className="text-lg font-medium mb-1">No messages yet</p>
                      <p className="text-sm text-gray-600">
                        Ask questions about your {currentSectionTitle.toLowerCase()} section or get help with your project.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Message Bubbles */}
                    {safeChatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                          <div className="ai-avatar flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-2 text-indigo-600 font-medium text-sm">
                            AI
                          </div>
                        )}
                        <div 
                          className={`message-bubble rounded-lg p-3 max-w-[80%] ${
                            msg.role === 'user' 
                              ? 'bg-indigo-600 text-white self-end' 
                              : 'bg-white border border-gray-200 text-gray-800 self-start'
                          }`}
                          style={{
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            borderTopRightRadius: msg.role === 'user' ? '0' : '1rem',
                            borderTopLeftRadius: msg.role === 'assistant' ? '0' : '1rem'
                          }}
                        >
                          <div className="message-content">
                            <ReactMarkdown className="prose prose-sm">
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Typing indicator when loading */}
                    {(loading || isButtonDisabled) && (
                      <div className="flex justify-start">
                        <div className="ai-avatar flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-2 text-indigo-600 font-medium text-sm">
                          AI
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-3 inline-flex items-center shadow-sm">
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
                    ref={inputRef}
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Ask about ${currentSectionTitle}...`}
                    className="flex-grow px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    disabled={loading || isButtonDisabled}
                  />
                  <button
                    onClick={handleSendMessageWithTracking}
                    disabled={currentMessage.trim() === '' || loading || isButtonDisabled}
                    className={`px-4 flex items-center justify-center transition-colors ${
                      currentMessage.trim() === '' || loading || isButtonDisabled
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {(loading || isButtonDisabled) ? (
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
    </>
  );
};

export default ModernChatInterface;
