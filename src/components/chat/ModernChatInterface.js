// FILE: src/components/chat/ModernChatInterface.js

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import '../../styles/PaperPlanner.css'; // Ensure CSS is imported

/**
 * Modernized chat interface that can be minimized to a floating button
 * UPDATED: Added onboarding highlight/tooltip for chat icon
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
  onboardingStep // Receive onboarding state
}) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const messagesEndRef = useRef(null);
  const previousSectionRef = useRef(null);
  const chatIconRef = useRef(null); // Ref for the chat icon wrapper

  // ... (useEffect hooks for scrolling and previousSectionRef remain the same)
  useEffect(() => {
    if (!isMinimized && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isMinimized, currentSection]);

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
      {/* Minimized chat icon - Add ref and conditional highlight/tooltip */}
      {isMinimized && (
        <div
          ref={chatIconRef} // Add ref here
          className={`fixed bottom-6 right-6 z-50 cursor-pointer ${showChatHighlight ? 'onboarding-highlight-chat' : ''}`} // Apply highlight class conditionally
          onClick={toggleChat}
        >
          <div className="w-16 h-16 bg-indigo-600 rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
           {/* Onboarding Tooltip */}
           {showChatHighlight && (
            <div className="onboarding-tooltip onboarding-tooltip-chat">
              Stuck? Ask AI for help anytime.
            </div>
           )}
        </div>
      )}

      {/* Expanded chat interface */}
      {/* Styling and structure remain mostly the same */}
      <div
        className={`fixed z-40 shadow-lg bg-white rounded-t-lg overflow-hidden transition-all duration-300 ease-in-out ${
          isMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{
          // Adjusted width and height slightly
          bottom: '0',
          right: '0',
          width: 'min(450px, 90vw)', // Max width, responsive
          height: 'min(600px, 75vh)' // Max height, responsive
        }}
      >
        {/* Chat header */}
         <div className="bg-indigo-600 text-white px-4 py-3 flex justify-between items-center">
           {/* ... header content */}
           <div className="flex items-center">
             <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-indigo-600 font-bold mr-3">
               AI
             </div>
             <h3 className="font-medium text-lg truncate pr-2">
               {currentSectionTitle ? `AI Research Assistant` : 'AI Research Assistant'}
             </h3>
           </div>
           <button
             onClick={toggleChat}
             className="text-white hover:text-gray-200 focus:outline-none"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
             </svg>
           </button>
         </div>


        {/* Chat messages */}
         <div className="flex flex-col h-full" style={{ height: 'calc(100% - 56px)' }}> {/* Adjusted height calc if header padding changes */}
          <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
            {/* ... message rendering logic ... */}
             {!currentSection || !chatMessages[currentSection] || chatMessages[currentSection].length === 0 ? ( <>{/* Empty state */}...</> ) : ( <div className="space-y-3">{/* Messages */}...<div ref={messagesEndRef} /></div> )}
          </div>

          {/* Chat input */}
          <div className="p-3 border-t border-gray-200 bg-white">
             {/* ... input field and send button ... */}
             <div className="flex">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                className="flex-grow px-3 py-2 border border-gray-300 rounded-l-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ask a question..." // Simplified placeholder
                onKeyPress={(e) => e.key === 'Enter' && !loading && currentMessage.trim() !== '' && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || currentMessage.trim() === ''}
                className={`px-3 py-2 rounded-r-lg ${ /* Conditional classes */ loading || currentMessage.trim() === '' ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 transition-colors' }`}
              >
                {loading ? ( <>{/* Loading spinner */}...</> ) : ( <>{/* Send icon */}...</> )}
              </button>
            </div>
          </div>
         </div>
      </div>
    </>
  );
};

export default ModernChatInterface;
